import { Point } from '@/geometry/point'
import { pinia } from '@/stores'
import { useCurveStore } from '@/stores/curves'
import { storeToRefs } from 'pinia'

const curveStore = useCurveStore(pinia)
const { algoType, points, isDrawing } = storeToRefs(curveStore)
const { addPoint, wipePoints, setDrawing } = curveStore

import { useCanvasStore } from '@/stores/canvas'
import { Matrix, bSplineMatrix, bezierMatrix } from '@/linear_algebra/matrix'
import { getClosestReferencePointToPoint } from '../utils'
import { BSpline, BezierCurve } from '@/components/CanvasComponent/types'
const canvasStore = useCanvasStore(pinia)

const {
  getAllCurveEndpoints,
  segmentConnectingSnapDistance,
  segmentConnectingMouseForceUnsnapDistance,
  addBSpline,
  addBezierCurve
} = canvasStore
const { previewCtx, drawingCtx } = storeToRefs(canvasStore)

function _getXtAndYtFromCoefficients(coefficients: Matrix) {
  function x_t(t: number) {
    return (
      t ** 3 * coefficients.getElementAt(1, 1) +
      t ** 2 * coefficients.getElementAt(2, 1) +
      t * coefficients.getElementAt(3, 1) +
      coefficients.getElementAt(4, 1)
    )
  }

  function y_t(t: number) {
    return (
      t ** 3 * coefficients.getElementAt(1, 2) +
      t ** 2 * coefficients.getElementAt(2, 2) +
      t * coefficients.getElementAt(3, 2) +
      coefficients.getElementAt(4, 2)
    )
  }

  return [x_t, y_t]
}

// function hermitCurve(P1: Point, P4: Point, R1: Point, R4: Point, tStep = 0.001) {
//   const points = []

//   const coordinateMatrix = new Matrix(4, 2)
//   coordinateMatrix.setElements([
//     [P1.x, P1.y],
//     [P4.x, P4.y],
//     [R1.x, R1.y],
//     [R4.x, R4.y]
//   ])
//   const coefficients = hermiteMatrix.multiply(coordinateMatrix)
//   const [x, y] = _getXtAndYtFromCoefficients(coefficients)

//   for (let t = 0; t <= 1; t += tStep) {
//     points.push(new Point(x(t), y(t)))
//   }

//   return points
// }

function bezierCurve(P1: Point, P2: Point, P3: Point, P4: Point, tStep = 0.001) {
  const points = [];

  const coordinateMatrix = new Matrix(4, 2);
  coordinateMatrix.setElements([
    [P1.x, P1.y],
    [P2.x, P2.y],
    [P3.x, P3.y],
    [P4.x, P4.y]
  ]);
  const coefficients = bezierMatrix.multiply(coordinateMatrix);
  const [x, y] = _getXtAndYtFromCoefficients(coefficients);

  for (let t = 0; t <= 1; t += tStep) {
    points.push(new Point(x(t), y(t)));
  }

  return points;
}


function bSplineSegment(P1: Point, P2: Point, P3: Point, P4: Point, tStep = 0.001) {
  const points = []

  const coordinateMatrix = new Matrix(4, 2)
  coordinateMatrix.setElements([
    [P1.x, P1.y],
    [P2.x, P2.y],
    [P3.x, P3.y],
    [P4.x, P4.y]
  ])
  const coefficients = bSplineMatrix.multiply(coordinateMatrix)
  const [x, y] = _getXtAndYtFromCoefficients(coefficients)

  for (let t = 0; t <= 1; t += tStep) {
    points.push(new Point(x(t), y(t)))
  }

  return points
}

export function bSpline(referencePoints: Point[]) {
  referencePoints = [...referencePoints, referencePoints[0], referencePoints[1], referencePoints[2]]

  const points = []
  for (let pointIndex = 0; pointIndex < referencePoints.length - 3; pointIndex++) {
    points.push(
      ...bSplineSegment(
        referencePoints[pointIndex],
        referencePoints[pointIndex + 1],
        referencePoints[pointIndex + 2],
        referencePoints[pointIndex + 3]
      )
    )
  }
  return points
}

function lookForSegmentToConnect(selectedPoints: Point) {
  const { closestCurve, referencePointInCurveIndex } = getClosestReferencePointToPoint(
    new Point(selectedPoints.x, selectedPoints.y),
    false
  )

  const allEndpoints = getAllCurveEndpoints(closestCurve!)
  const mouseMoveEventListener = (event: MouseEvent) => {
    const { x, y } = {
      x: event.offsetX,
      y: event.offsetY
    }
    const mousePosition = new Point(x, y)
    if (closestCurve) {
      for (const currCurveEndpoint of closestCurve.endpoints) {
        for (const otherCurveEndpoint of allEndpoints) {
          if (
            currCurveEndpoint.distanceToPoint(otherCurveEndpoint) <=
            segmentConnectingSnapDistance &&
            mousePosition.distanceToPoint(otherCurveEndpoint) <=
            segmentConnectingMouseForceUnsnapDistance
          ) {
            const diffX = otherCurveEndpoint.x - currCurveEndpoint.x
            const diffY = otherCurveEndpoint.y - currCurveEndpoint.y
            closestCurve.referencePoints.forEach((point, index) => {
              closestCurve.setReferencePoint(new Point(point.x + diffX, point.y + diffY), index)
            })
            return
          }
        }
      }
      if (referencePointInCurveIndex) {
        const closestPoint = closestCurve.referencePoints[referencePointInCurveIndex]
        const diffX = x - closestPoint.x
        const diffY = y - closestPoint.y
        closestCurve.referencePoints.forEach((point, index) => {
          closestCurve.setReferencePoint(new Point(point.x + diffX, point.y + diffY), index)
        })
      }
      const moveEndEventListener = () => {
        previewCtx!.value?.canvas.removeEventListener('mousemove', mouseMoveEventListener)
        previewCtx!.value?.canvas.removeEventListener('click', moveEndEventListener)
        previewCtx!.value?.canvas.addEventListener('click', (event: MouseEvent) => {
          lookForSegmentToConnect(new Point(event.offsetX, event.offsetY, 0, 1))
        })
      }
      previewCtx!.value?.canvas.addEventListener('mousemove', mouseMoveEventListener)
      previewCtx!.value?.canvas.addEventListener('click', moveEndEventListener)
    }
  }
}

export function drawCurve(e: MouseEvent) {
  e.preventDefault()
  setDrawing(false)
  let curvePoints: Point[] = []
  if (points.value.length >= 3) {
    if (algoType.value === 'Bezier') {
      if (points.value.length === 4) {
        curvePoints = bezierCurve(points.value[0], points.value[1], points.value[2], points.value[3])
        addBezierCurve(new BezierCurve([...points.value.slice(0, 4)].map((point) => new Point(point.x, point.y, point.z, 1))))
      }
      else {
        addBezierCurve(new BezierCurve([...points.value.slice(0, 3), points.value[0]].map((point) => new Point(point.x, point.y, point.z, 1))))
      }
    } else if (algoType.value === 'B-Spline') {
      curvePoints = bSpline(points.value)
      addBSpline(new BSpline([...points.value].map((point) => new Point(point.x, point.y, point.z, 1))))
    }
    for (const point of curvePoints) {
      drawingCtx.value?.fillRect(point.x, point.y, 1, 1)
    }
  }
  wipePoints()
}

export function CurveClickHandler(e: MouseEvent) {
  if (!isDrawing) {
    setDrawing(true)
  }
  addPoint(new Point(e.offsetX, e.offsetY, 0, 1))
}

export function CurveMoveHandler() { }
