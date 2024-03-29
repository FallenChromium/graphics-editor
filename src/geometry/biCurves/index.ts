import { Line } from '../line'
import { Point } from '../point'
import { useBiCurveStore } from '@/stores/biCurves'
import { pinia } from '@/stores'
import { storeToRefs } from 'pinia'
import { useCanvasStore } from '@/stores/canvas'

export class Ellipse {
  _origin: Point;
  _a: number;
  _b: number;
  constructor(origin: Point, a: number, b: number) {
    this._origin = new Point(origin.x, origin.y, origin.z);
    this._a = a;
    this._b = b;
  }

  get origin() { return new Point(this._origin.x, this._origin.y, this._origin.z); }
  get a() { return this._a; }
  get b() { return this._b; }
}

export class Hyperbola {
  _origin: Point;
  _a: number;
  _b: number;
  _isHorizontal: boolean;
  constructor(origin: Point, a: number, b: number, isHorizontal: boolean) {
    this._origin = new Point(origin.x, origin.y, origin.z);
    this._a = a;
    this._b = b;
    this._isHorizontal = isHorizontal;
  }

  get origin() { return new Point(this._origin.x, this._origin.y, this._origin.z); }
  get a() { return this._a; }
  get b() { return this._b; }
  get isHorizontal() { return this._isHorizontal; }
}

export class Parabola {
  _vertex: Point;
  _p: number;
  _isHorizontal: boolean;
  constructor(vertex: Point, p: number, isHorizontal: boolean) {
    this._vertex = new Point(vertex.x, vertex.y, vertex.z);
    this._p = p;
    this._isHorizontal = isHorizontal;
  }

  get vertex() { return new Point(this._vertex.x, this._vertex.y, this._vertex.z); }
  get p() { return this._p; }
  get isHorizontal() { return this._isHorizontal; }
}

function _ellipsePointError(x: number, y: number, a: number, b: number) {
  return Math.abs(x ** 2 / a ** 2 + y ** 2 / b ** 2 - 1)
}

function _ellipse(origin: Point, a: number, b: number): Point[] {
  const points_quadrant1 = []

  let currX = 0
  let currY = b
  // TODO: too many points being drawn if there's no limit, should be capped not by the dimensions but by the viewport size
  if (a > 5 && b > 5) {
    do {
      points_quadrant1.push(new Point(currX + origin.x, currY + origin.y))

      const horizontalPixelError = _ellipsePointError(currX + 1, currY, a, b)
      const verticalPixelError = _ellipsePointError(currX, currY - 1, a, b)
      const diagonalPixelError = _ellipsePointError(currX + 1, currY - 1, a, b)
      const minimalError = Math.min(horizontalPixelError, verticalPixelError, diagonalPixelError)

      if (minimalError === horizontalPixelError) {
        currX++
      } else if (minimalError === verticalPixelError) {
        currY--
      } else {
        currX++
        currY--
      }
    } while (currY >= 0)
  }

  const horizontalEllipseAxis = new Line(origin, new Point(origin.x + 1, origin.y))
  const verticalEllipseAxis = new Line(origin, new Point(origin.x, origin.y + 1))
  const points_quadrant2 = points_quadrant1.map((point) =>
    point.reflectAlongLine(verticalEllipseAxis)
  )
  const points_quadrant3 = points_quadrant2.map((point) =>
    point.reflectAlongLine(horizontalEllipseAxis)
  )
  const points_quadrant4 = points_quadrant1.map((point) =>
    point.reflectAlongLine(horizontalEllipseAxis)
  )

  return [...points_quadrant1, ...points_quadrant2, ...points_quadrant3, ...points_quadrant4]
}


const biCurveStore = useBiCurveStore(pinia)
const { origin, isDrawing, direction } = storeToRefs(biCurveStore)
const { setOrigin, switchDrawing } = biCurveStore

function drawEllipse(ctx: CanvasRenderingContext2D, e: MouseEvent) {
  const { x, y, z, w } = origin.value
  let a, b = 0
  if (e.shiftKey) {
    const max = Math.max(e.offsetX - origin.value.x, e.offsetY - origin.value.y)
    a = max
    b = max
  }
  else {
    a = e.offsetX - origin.value.x
    b = e.offsetY - origin.value.y
  }
  const points = _ellipse(
    new Point(x, y, z, w),
    a,
    b
  )
  points.forEach((point) => {
    ctx.fillStyle = 'rgba(0, 0, 0, ' + w + ')'
    ctx.fillRect(point.x, point.y, 1, 1)
  })
}

function ellipseMoveHandler(this: HTMLCanvasElement, e: MouseEvent) {
  const canvasStore = useCanvasStore(pinia)
  const { previewCtx } = storeToRefs(canvasStore)
  const ctx = previewCtx.value!
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  drawEllipse(ctx, e)
}

export function ellipseClickHandler(this: HTMLCanvasElement, e: MouseEvent) {
  const canvasStore = useCanvasStore(pinia)
  const { addEllipse } = canvasStore
  const { drawingCtx } = storeToRefs(canvasStore)
  if (!isDrawing.value) {
    setOrigin(e.offsetX, e.offsetY)
    this.addEventListener('mousemove', ellipseMoveHandler)
  } else {
    this.removeEventListener('mousemove', ellipseMoveHandler)
    const ctx = drawingCtx.value!
    drawEllipse(ctx, e)
    addEllipse(new Ellipse(new Point(origin.value.x, origin.value.y, origin.value.z, origin.value.w), e.offsetX - origin.value.x, e.offsetY - origin.value.y))
    switchDrawing()
  }
}

function _horizontalParabolaPointError(x: number, y: number, p: number): number {
  return Math.abs(y ** 2 / x - p)
}

// TODO: merge horizontal and vertical parabola functions since they're not that different
function _horizontalParabola(
  vertex: Point,
  p: number,
  Xlimit = 3000 - vertex.x,
  Ylimit = 3000 - vertex.y
) {
  const abs_p = Math.abs(p)
  let points_upperHalf = []

  let currX = 0
  let currY = 0
  do {
    points_upperHalf.push(new Point(currX + vertex.x, currY + vertex.y))

    const horizontalPixelError = _horizontalParabolaPointError(currX + 1, currY, abs_p)
    const verticalPixelError = _horizontalParabolaPointError(currX, currY + 1, abs_p)
    const diagonalPixelError = _horizontalParabolaPointError(currX + 1, currY + 1, abs_p)
    const minimalError = Math.min(horizontalPixelError, verticalPixelError, diagonalPixelError)

    if (minimalError === horizontalPixelError) {
      currX++
    } else if (minimalError === verticalPixelError) {
      currY++
    } else {
      currX++
      currY++
    }
  } while (currX < Xlimit && currY < Ylimit)
  if (Math.sign(p) === -1) {
    const VerticalVertexAxis = new Line(vertex, new Point(vertex.x, vertex.y + 1))
    points_upperHalf = points_upperHalf.map((point) => point.reflectAlongLine(VerticalVertexAxis))
  }
  const parabolaAxis = new Line(vertex, new Point(vertex.x + 1, vertex.y))
  const points_lowerHalf = points_upperHalf.map((point) => point.reflectAlongLine(parabolaAxis))

  return [...points_upperHalf, ...points_lowerHalf]
}

function _verticalParabolaPointError(x: number, y: number, p: number) {
  // error value with a sign isn't used anyway since it is only compared to 0 to determine the minimal error
  return Math.abs(x ** 2 / y - p)
}

// TODO: hardcoded limits
function _verticalParabola(
  vertex: Point,
  p: number,
  Xlimit = 3000 - vertex.x,
  Ylimit = 3000 - vertex.y
) {
  const abs_p = Math.abs(p)
  let points_rightHalf = []

  let currX = 0
  let currY = 0
  do {
    points_rightHalf.push(new Point(currX + vertex.x, currY + vertex.y))

    const horizontalPixelError = _verticalParabolaPointError(currX + 1, currY, abs_p)
    const verticalPixelError = _verticalParabolaPointError(currX, currY + 1, abs_p)
    const diagonalPixelError = _verticalParabolaPointError(currX + 1, currY + 1, abs_p)
    const minimalError = Math.min(horizontalPixelError, verticalPixelError, diagonalPixelError)

    if (minimalError === horizontalPixelError) {
      currX++
    } else if (minimalError === verticalPixelError) {
      currY++
    } else {
      currX++
      currY++
    }
  } while (currX < Xlimit && currY < Ylimit)

  if (p < 0) {
    const verticalAxis = new Line(vertex, new Point(vertex.x + 1, vertex.y))
    points_rightHalf = points_rightHalf.map((point) => point.reflectAlongLine(verticalAxis))
  }
  const parabolaAxis = new Line(vertex, new Point(vertex.x, vertex.y + 1))
  const points_leftHalf = points_rightHalf.map((point) => point.reflectAlongLine(parabolaAxis))

  return [...points_leftHalf, ...points_rightHalf]
}

function drawParabola(ctx: CanvasRenderingContext2D, e: MouseEvent) {
  const { x, y, z, w } = origin.value
  const drawingFunction = direction.value == 'Horizontal' ?
    _horizontalParabola : _verticalParabola
  const points = drawingFunction
    (new Point(x, y, z, w),
      direction.value == 'Horizontal' ?
        e.offsetX - origin.value.x :
        e.offsetY - origin.value.y)
  points.forEach((point) => {
    ctx.fillStyle = 'rgba(0, 0, 0, ' + w + ')'
    ctx.fillRect(point.x, point.y, 1, 1)
  })
}

function parabolaMoveHandler(e: MouseEvent) {
  const canvasStore = useCanvasStore(pinia)
  const { previewCtx } = storeToRefs(canvasStore)
  const ctx = previewCtx.value!
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  drawParabola(ctx, e)
}

export function parabolaClickHandler(this: HTMLCanvasElement, e: MouseEvent) {
  const canvasStore = useCanvasStore(pinia)
  const { addParabola } = canvasStore
  const { drawingCtx } = storeToRefs(canvasStore)
  if (!isDrawing.value) {
    setOrigin(e.offsetX, e.offsetY)
    this.addEventListener('mousemove', parabolaMoveHandler)
  } else {
    this.removeEventListener('mousemove', parabolaMoveHandler)
    const ctx = drawingCtx.value!
    drawParabola(ctx, e)
  }
  addParabola(new Parabola(new Point(origin.value.x, origin.value.y, origin.value.z, 1), direction.value == 'Horizontal' ?
    e.offsetX - origin.value.x :
    e.offsetY - origin.value.y, 
    direction.value == 'Horizontal'));
  switchDrawing()
}

function _verticalHyperbolaPointError(x: number, y: number, a: number, b: number) {
  return Math.abs(y ** 2 / b ** 2 - x ** 2 / a ** 2 - 1)
}

function _horizontalHyperbolaPointError(x: number, y: number, a: number, b: number) {
  return Math.abs(x ** 2 / a ** 2 - y ** 2 / b ** 2 - 1)
}

function _horizontalHyperbola(origin: Point, a: number, b: number, Xlimit = 3000, Ylimit = 3000) {
  const points_quadrant1 = []
  // Those can't be negative
  a = Math.abs(a)
  b = Math.abs(b)
  let currX = a
  let currY = 0
  do {
    points_quadrant1.push(new Point(currX + origin.x, currY + origin.y))

    const horizontalPixelError = _horizontalHyperbolaPointError(currX + 1, currY, a, b)
    const verticalPixelError = _horizontalHyperbolaPointError(currX, currY + 1, a, b)
    const diagonalPixelError = _horizontalHyperbolaPointError(currX + 1, currY + 1, a, b)
    const minimalError = Math.min(horizontalPixelError, verticalPixelError, diagonalPixelError)

    if (minimalError === horizontalPixelError) {
      currX++
    } else if (minimalError === verticalPixelError) {
      currY++
    } else {
      currX++
      currY++
    }
  } while (currX < Xlimit && currY < Ylimit)

  const horizontalHyperbolaAxis = new Line(origin, new Point(origin.x + 1, origin.y))
  const verticalHyperbolaAxis = new Line(origin, new Point(origin.x, origin.y + 1))
  const points_quadrant2 = points_quadrant1.map((point) =>
    point.reflectAlongLine(verticalHyperbolaAxis)
  )
  const points_quadrant3 = points_quadrant2.map((point) =>
    point.reflectAlongLine(horizontalHyperbolaAxis)
  )
  const points_quadrant4 = points_quadrant1.map((point) =>
    point.reflectAlongLine(horizontalHyperbolaAxis)
  )

  return [...points_quadrant1, ...points_quadrant2, ...points_quadrant3, ...points_quadrant4]
}

function _verticalHyperbola(origin: Point, a: number, b: number, Xlimit = 3000, Ylimit = 3000) {
  const points_quadrant1 = []
  a = Math.abs(a)
  b = Math.abs(b)
  let currX = 0
  let currY = b
  do {
    points_quadrant1.push(new Point(currX + origin.x, currY + origin.y))

    const horizontalPixelError = _verticalHyperbolaPointError(currX + 1, currY, a, b)
    const verticalPixelError = _verticalHyperbolaPointError(currX, currY + 1, a, b)
    const diagonalPixelError = _verticalHyperbolaPointError(currX + 1, currY + 1, a, b)
    const minimalError = Math.min(horizontalPixelError, verticalPixelError, diagonalPixelError)

    if (minimalError === horizontalPixelError) {
      currX++
    } else if (minimalError === verticalPixelError) {
      currY++
    } else {
      currX++
      currY++
    }
  } while (currX < Xlimit && currY < Ylimit)

  const horizontalHyperbolaAxis = new Line(origin, new Point(origin.x + 1, origin.y))
  const verticalHyperbolaAxis = new Line(origin, new Point(origin.x, origin.y + 1))
  const points_quadrant2 = points_quadrant1.map((point) =>
    point.reflectAlongLine(verticalHyperbolaAxis)
  )
  const points_quadrant3 = points_quadrant2.map((point) =>
    point.reflectAlongLine(horizontalHyperbolaAxis)
  )
  const points_quadrant4 = points_quadrant1.map((point) =>
    point.reflectAlongLine(horizontalHyperbolaAxis)
  )

  return [...points_quadrant1, ...points_quadrant2, ...points_quadrant3, ...points_quadrant4]
}

function hyperbolaMoveHandler(this: HTMLCanvasElement, e: MouseEvent) {
  const canvasStore = useCanvasStore(pinia)
  const { previewCtx } = storeToRefs(canvasStore)
  const ctx = previewCtx.value!
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const { x, y, z, w } = origin.value
  const points =
    (direction.value === "Horizontal" ? _horizontalHyperbola : _verticalHyperbola)
      (
        new Point(x, y, z, w),
        e.offsetX - origin.value.x,
        e.offsetY - origin.value.y
      )

  points.forEach((point) => {
    ctx.fillStyle = 'rgba(0, 0, 0, ' + w + ')'
    ctx.fillRect(point.x, point.y, 1, 1)
  })
}

export function hyperbolaClickHandler(this: HTMLCanvasElement, e: MouseEvent) {
  const canvasStore = useCanvasStore(pinia)
  const { addHyperbola } = canvasStore
  const { drawingCtx } = storeToRefs(canvasStore)
  if (!isDrawing.value) {
    setOrigin(e.offsetX, e.offsetY)
    this.addEventListener('mousemove', hyperbolaMoveHandler)
  } else {
    this.removeEventListener('mousemove', hyperbolaMoveHandler)
    const ctx = drawingCtx.value!
    const { x, y, z, w } = origin.value
    const points =
      (direction.value === "Horizontal" ? _horizontalHyperbola : _verticalHyperbola)
        (
          new Point(x, y, z, w),
          e.offsetX - origin.value.x,
          e.offsetY - origin.value.y
        )

    points.forEach((point) => {
      ctx.fillStyle = 'rgba(0, 0, 0, ' + w + ')'
      ctx.fillRect(point.x, point.y, 1, 1)
    })
  }
  addHyperbola(new Hyperbola(new Point(origin.value.x, origin.value.y, origin.value.z), e.offsetX - origin.value.x, e.offsetY - origin.value.y, direction.value === "Horizontal"))
  switchDrawing()
}


function _exitEllipseDrawingMode(selectedPoints: Point[]) {
  const origin = new Point(selectedPoints[0].x, selectedPoints[0].y)
  const a = +Number(prompt('Введите значение "a"'))
  const b = +Number(prompt('Введите значение "b"'))

  // this._model.addEllipse(new geometryModule.Ellipse(origin, a, b));
}

function _exitHorizontalParabolaDrawingMode(selectedPoints: Point[]) {
  const vertex = new Point(selectedPoints[0].x, selectedPoints[0].y)
  const p = +Number(prompt('Введите значение "p"'))

  // this._model.addParabola(new geometryModule.Parabola(vertex, p, true));
}

function _exitVerticalParabolaDrawingMode(selectedPoints: Point[]) {
  const vertex = new Point(selectedPoints[0].x, selectedPoints[0].y)
  const p = +Number(prompt('Введите значение "p"'))

  // this._model.addParabola(new geometryModule.Parabola(vertex, p, false));
}

function _exitHorizontalHyperbolaDrawingMode(selectedPoints: Point[]) {
  const origin = new Point(selectedPoints[0].x, selectedPoints[0].y)
  const a = +Number(prompt('Введите значение "a"'))
  const b = +Number(prompt('Введите значение "b"'))

  // this._model.addHyperbola(new geometryModule.Hyperbola(origin, a, b, true));
}

function _exitVerticalHyperbolaDrawingMode(selectedPoints: Point[]) {
  const origin = new Point(selectedPoints[0].x, selectedPoints[0].y)
  const a = +Number(prompt('Введите значение "a"'))
  const b = +Number(prompt('Введите значение "b"'))

  // this._model.addHyperbola(new geometryModule.Hyperbola(origin, a, b, false));
}
