import { Point } from '@/geometry/point'
import { Vector } from '@/linear_algebra/vector'
import type { CanvasCallback } from '@/components/CanvasComponent/types'
import { type point, type line } from '../types'
import { pinia } from '@/stores'
import { useLineStore } from '@/stores/line'
import { clearCanvas } from '@/components/CanvasComponent/utils'
import { storeToRefs } from 'pinia'
import { useCanvasStore } from '@/stores/canvas'
import { convertHexToRGBA } from '@/components/ToolbarComponent/utils'
export { drawLineBresenham, drawLineDDA, drawLineWu }
const lineStore = useLineStore(pinia)

export type drawingFunctionsTypes = 'DDA' | 'Bresenham' | 'Wu'

export class Line {
  _pointContainmentError = 1

  private _startpoint: Point
  private _endpoint: Point
  private _directionVector: Vector
  constructor(point1: Point, point2: Point) {
    this._startpoint = new Point(point1.x, point1.y, point1.z, point1.w)
    this._endpoint = new Point(point2.x, point2.y, point2.z, point2.w)
    this._directionVector = new Vector(point1, point2)
  }

  get angleToXAxis() {
    return this._directionVector.angleToXAxis
  }

  distanceToPoint(point: Point) {
    const helperVector = new Vector(this._startpoint, point)
    // | (P-A) x B | / | B |
    return helperVector.crossProduct(this._directionVector).modulus / this._directionVector.modulus
  }

  closestOwnPointToPoint(point: Point) {
    const normalizedDirectionVector = this._directionVector.toNormalized()
    const helperVector = new Vector(this._startpoint, point)
    const dotProduct = helperVector.dotProduct(normalizedDirectionVector)
    return new Point(
      this._startpoint.x + normalizedDirectionVector.x * dotProduct,
      this._startpoint.y + normalizedDirectionVector.y * dotProduct,
      this._startpoint.z + normalizedDirectionVector.z * dotProduct
    )
  }

  intersectionPoint(line: Line) {
    const [a1, b1, c1] = [this.coefficients_2d.a, this.coefficients_2d.b, this.coefficients_2d.c]
    const [a2, b2, c2] = [line.coefficients_2d.a, line.coefficients_2d.b, line.coefficients_2d.c]
    return new Point(
      (b1 * c2 - b2 * c1) / (a1 * b2 - a2 * b1),
      (c1 * a2 - c2 * a1) / (a1 * b2 - a2 * b1)
    )
  }

  get normalVector() {
    // z = 0
    return new Vector(new Point(0, 0), new Point(-this._directionVector.y, this._directionVector.x))
  }

  get coefficients_2d() {
    return {
      a: this.normalVector.x,
      b: this.normalVector.y,
      c: -(this._startpoint.x * this.normalVector.x + this._startpoint.y * this.normalVector.y)
    }
  }

  containsPoint(point: Point) {
    return this.distanceToPoint(point) <= this._pointContainmentError
  }

  get startPoint() {
    return this._startpoint
  }

  get endPoint() {
    return this._endpoint
  }
}

export class LineSegment {
  private _point1: Point
  private _point2: Point

  constructor(point1: Point, point2: Point) {
    this._point1 = new Point(point1.x, point1.y, point1.z)
    this._point2 = new Point(point2.x, point2.y, point2.z)
  }

  get P1() {
    return new Point(this._point1.x, this._point1.y, this._point1.z)
  }
  get P2() {
    return new Point(this._point2.x, this._point2.y, this._point2.z)
  }

  intersectionPoint(lineSegment: LineSegment) {
    const lineIntersectionPoint = new Line(this.P1, this.P2).intersectionPoint(
      new Line(lineSegment.P1, lineSegment.P2)
    )
    return this.containsPoint(lineIntersectionPoint) &&
      lineSegment.containsPoint(lineIntersectionPoint)
      ? lineIntersectionPoint
      : null
  }

  containsPoint(point: Point) {
    return this.pointInLineSegmentBounds(point) && new Line(this.P1, this.P2).containsPoint(point)
  }

  intersects(lineSegment: LineSegment) {
    return this.intersectionPoint(lineSegment) !== null
  }

  pointInLineSegmentBounds(point: Point) {
    return (
      point.x >= this.minX &&
      point.x <= this.maxX &&
      point.y >= this.minY &&
      point.y <= this.maxY &&
      point.z >= this.minZ &&
      point.z <= this.maxZ
    )
  }

  get minX() {
    return this.P1.x < this.P2.x ? this.P1.x : this.P2.x
  }

  get maxX() {
    return this.P1.x > this.P2.x ? this.P1.x : this.P2.x
  }

  get minY() {
    return this.P1.y < this.P2.y ? this.P1.y : this.P2.y
  }

  get maxY() {
    return this.P1.y > this.P2.y ? this.P1.y : this.P2.y
  }

  get minZ() {
    return this.P1.z < this.P2.z ? this.P1.z : this.P2.z
  }

  get maxZ() {
    return this.P1.z > this.P2.z ? this.P1.z : this.P2.z
  }

  get isHorizontal() {
    return this.P1.y === this.P2.y
  }

  get length() {
    return new Vector(this.P1, this.P2).modulus
  }
}

const { isDrawing, startPoint, algoType } = storeToRefs(lineStore)
const { setStartPoint, toggleDrawing } = lineStore
const canvasStore = useCanvasStore(pinia)
const { drawingCtx, previewCtx } = storeToRefs(canvasStore)
const { addDDALineSegment, addBresenhamLineSegment, addWuLineSegment } = canvasStore

export const lineDrawingFunctions = {
  DDA: drawLineDDA,
  Bresenham: drawLineBresenham,
  Wu: drawLineWu
}

function _getDependentAndIndependentVariableInfo(
  endpoints: { start: Point; end: Point },
  swapVariables: boolean
) {
  const independentStart = swapVariables ? endpoints.start.y : endpoints.start.x
  const independentEnd = swapVariables ? endpoints.end.y : endpoints.end.x
  const deltaIndependent = Math.abs(independentEnd - independentStart)

  const dependentStart = swapVariables ? endpoints.start.x : endpoints.start.y
  const dependentEnd = swapVariables ? endpoints.end.x : endpoints.end.y
  const deltaDependent = Math.abs(dependentEnd - dependentStart)

  const deltaErr = deltaDependent / deltaIndependent
  return {
    independentStart,
    independentEnd,
    independentStep: independentEnd - independentStart > 0 ? 1 : -1,
    deltaIndependent,

    dependentStart,
    dependentEnd,
    dependentStep: dependentEnd - dependentStart > 0 ? 1 : -1,
    deltaDependent,

    deltaErr
  }
}

function drawLineDDA(start: Point, end: Point, canvasCtx: CanvasRenderingContext2D): line {
  const dx = end.x - start.x
  const dy = end.y - start.y
  // choose the main direction
  const steps = Math.max(Math.abs(dx), Math.abs(dy))
  const xIncrement = dx / steps
  const yIncrement = dy / steps
  let x = start.x
  let y = start.y
  const debugArray: Point[] = []
  canvasCtx.beginPath()

  for (let i = 0; i < steps; i++) {
    x = x + xIncrement
    y = y + yIncrement
    canvasCtx.lineTo(Math.round(x), Math.round(y))
    canvasCtx.moveTo(Math.round(x), Math.round(y))
    debugArray.push(new Point(Math.round(x), Math.round(y), 0, 1))
  }
  canvasCtx.stroke()
  canvasCtx.closePath()
  return { start: new Point(start.x, start.y, 0, 0), end: new Point(end.x, end.y, 0, 0), points: debugArray }
}

/* Used as a reference: https://ychebnikkompgrafblog.wordpress.com/2-3-%D0%BE%D0%B1%D1%89%D0%B8%D0%B9-%D0%B0%D0%BB%D0%B3%D0%BE%D1%80%D0%B8%D1%82%D0%BC-%D0%B1%D1%80%D0%B5%D0%B7%D0%B5%D0%BD%D1%85%D0%B5%D0%BC%D0%B0/ */
function drawLineBresenham(start: Point, end: Point, canvasCtx: CanvasRenderingContext2D): line {
  // projections on the x and y axis
  let dx = end.x - start.x
  let dy = end.y - start.y
  let steep = false
  let x = start.x
  let y = start.y
  const idealLine = new Line(start, end)
  if (idealLine.angleToXAxis % 45 === 0) {
    return drawLineDDA(start, end, canvasCtx)
  }
  const points: point[] = []
  canvasCtx.beginPath()
  if (Math.abs(dy) > Math.abs(dx)) {
    const temp = dx
    dx = dy
    dy = temp
    x = start.y
    y = start.x
    steep = true
  }
  // in which direction should the coordinate change
  const step_x = Math.sign(dx)
  const step_y = Math.sign(dy)
  // e = 1/2 + dy/dx; e * 2dx = 2dy - dx -> no division
  let error = 2 * Math.abs(dy) - Math.abs(dx)
  for (let i = 0; i <= Math.abs(dx); i++) {
    if (error >= 0) {
      // add to secondary coordinate because the error indicates we should be "higher"
      // (actually depends on the direction of dy)
      y = y + step_y
      error = error - 2 * Math.abs(dx)
    }
    // always add to main coordinate anyway
    x = x + step_x
    error = error + 2 * Math.abs(dy)
    const curPoint = {
      x: steep ? Math.round(y) : Math.round(x),
      y: steep ? Math.round(x) : Math.round(y)
    }
    canvasCtx.lineTo(curPoint.x, curPoint.y)
    canvasCtx.moveTo(curPoint.x, curPoint.y)
    points.push()
  }
  canvasCtx.stroke()
  canvasCtx.closePath()
  return { start: new Point(start.x, start.y, 0, 0), end: new Point(end.x, end.y, 0, 0), points }
}

function drawLineWu(start: Point, end: Point, canvasCtx: CanvasRenderingContext2D): line {
  let startpoint = new Point(start.x, start.y, start.z, start.w)
  let endpoint = new Point(end.x, end.y, end.z, end.w)
  const idealLine = new Line(start, end)
  if (idealLine.angleToXAxis % 45 === 0) {
    return drawLineDDA(start, end, canvasCtx)
  }

  const points = []

  if (start.x > end.x) {
    [startpoint, endpoint] = [endpoint, startpoint]
  }
  const [x_start, y_start, x_end, y_end] = [startpoint.x, startpoint.y, endpoint.x, endpoint.y]

  const deltaX_raw = Math.abs(x_end - x_start)
  const deltaY_raw = Math.abs(y_end - y_start)

  const swapVariables = Math.abs(deltaY_raw / deltaX_raw) > 1
  const variableInfo = _getDependentAndIndependentVariableInfo(
    { start: startpoint, end: endpoint },
    swapVariables
  )

  let currIndependentVariableValue = variableInfo.independentStart
  let currDependentVariableValue = variableInfo.dependentStart
  let error = 0
  const deltaErr = variableInfo.deltaDependent / variableInfo.deltaIndependent
  for (
    ;
    currIndependentVariableValue != variableInfo.independentEnd;
    currIndependentVariableValue += variableInfo.independentStep
  ) {
    const x = swapVariables ? currDependentVariableValue : currIndependentVariableValue
    const y = swapVariables ? currIndependentVariableValue : currDependentVariableValue
    const firstPointToDraw = new Point(x, y)
    const secondPointToDraw = new Point(
      swapVariables ? x + variableInfo.dependentStep : x,
      swapVariables ? y : y + variableInfo.dependentStep
    )
    const intensity1 = Math.max(0, 1 - idealLine.distanceToPoint(firstPointToDraw))
    const intensity2 = 1 - intensity1
    points.push({
      x: firstPointToDraw.x,
      y: firstPointToDraw.y,
      z: 0,
      w: intensity1
    })
    points.push({
      x: secondPointToDraw.x,
      y: secondPointToDraw.y,
      z: 0,
      w: intensity2
    })

    error += deltaErr
    // порог значения ошибки 1 нужен, так как в этом случае переход к следующему значению
    // зависимой переменной должен осуществляться после того, как значение выражения
    // currDependentVariableValue + error выходит за пределы следующего значения зависимой
    // переменной (т.к. алгоритм рисует блоками высотой 2 пикселя)
    if (error >= 1.5) {
      currDependentVariableValue += variableInfo.dependentStep
      error -= 1
    }
  }
  points.forEach(point => {
    canvasCtx.fillStyle = 'rgba(0, 0, 0, ' + point.w + ')'
    canvasCtx.fillRect(point.x, point.y, 1, 1)
  })

  return { start: new Point(start.x, start.y, 0, 0), end: new Point(end.x, end.y, 0, 0), points: points }
}

export function lineMoveHandler(e: MouseEvent) {
  const ctx = previewCtx.value!
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const {x, y, z, w} = startPoint.value
  lineDrawingFunctions[algoType.value](new Point(x,y,z,w), new Point(e.offsetX, e.offsetY, 0, 1), ctx)
}

export const lineClickHandler = (e: MouseEvent) => {
  const preview = previewCtx.value!
  console.log(previewCtx)
  console.log(preview)
  const drawingCanvas = drawingCtx.value!
  if (isDrawing.value) {
    console.log('STOP DRAWING')
    console.log(algoType.value)
    clearCanvas(preview)
    const {x, y, z, w} = startPoint.value
    // call the function for the corresponding algorithm
    lineDrawingFunctions[algoType.value](
      new Point(x,y,z,w),
      // click position on the canvas
      new Point(e.offsetX, e.offsetY, 0, 1),
      drawingCanvas
    )
    // reset the state
    setStartPoint(0, 0)
    preview.canvas.removeEventListener('mousemove', lineMoveHandler)
    switch (algoType.value) {
      case 'Bresenham': {
        addBresenhamLineSegment(new LineSegment(new Point(startPoint.value.x, startPoint.value.y, 0, 1), new Point(e.offsetX,e.offsetY, 0, 1)))
        break
      }
      case 'DDA': {
        addDDALineSegment(new LineSegment(new Point(startPoint.value.x, startPoint.value.y, 0, 1), new Point(e.offsetX,e.offsetY, 0, 1)))
        break
      }
      case 'Wu': {
        addWuLineSegment(new LineSegment(new Point(startPoint.value.x, startPoint.value.y, 0, 1), new Point(e.offsetX,e.offsetY, 0, 1)))
        break
      }
    }
  } else {
    console.log('START DRAWING')
    console.log(`Starting point: ${e.offsetX}, ${e.offsetY}`)
    clearCanvas(preview)
    setStartPoint(e.offsetX, e.offsetY)
    // add event listener to preview the line that will be drawn on the second click
    preview.canvas.addEventListener('mousemove', lineMoveHandler)
  }
  toggleDrawing()
}
