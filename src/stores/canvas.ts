import { ref } from 'vue'
import { defineStore } from 'pinia'
import { BezierCurve, HermiteCurve, type Cube, BSpline } from '@/components/CanvasComponent/types'
import { Line } from '@/geometry/line'
import { Polygon } from '@/geometry/polygon'
import { LineSegment } from '@/geometry/line'
import { Point } from '@/geometry/point'
import { type Ellipse, type Hyperbola, type Parabola } from '@/geometry/biCurves'

export const useCanvasStore = defineStore('canvas', () => {
  const drawingCtx = ref<CanvasRenderingContext2D|undefined>(undefined)
  const previewCtx = ref<CanvasRenderingContext2D|undefined>(undefined)
  const segmentConnectingSnapDistance = 20;
  const segmentConnectingMouseForceUnsnapDistance = 100;
  const _currRotationX = ref<number>(0);
  const _currRotationY = ref<number>(0);
  const _currRotationZ = ref<number>(0);
  const _currScaleX = ref<number>(1);
  const _currScaleY = ref<number>(1);
  const _currScaleZ = ref<number>(1);
  const _currTranslationX = ref<number>(0);
  const _currTranslationY = ref<number>(0);
  const _currTranslationZ = ref<number>(0);
  const _tX = ref<number>(0);
  const _tY = ref<number>(0);
  const _reflectedX = ref<boolean>(false);
  const _reflectedY = ref<boolean>(false);

  const ddaLineSegments = ref<Array<LineSegment>>([]);
  const bresenhamLineSegments = ref<Array<LineSegment>>([])
  const wuLineSegments = ref<Array<LineSegment>>([]);
  const ellipses = ref<Array<Ellipse>>([]);
  const parabolas = ref<Array<Parabola>>([]);
  const hyperbolas = ref<Array<Hyperbola>>([]);
  const hermiteCurves = ref<Array<HermiteCurve>>([]);
  const bezierCurves = ref<Array<BezierCurve>>([]);
  const bSplines = ref<Array<BSpline>>([]);
  const vertexPolygons = ref<Array<Polygon>>([]);
  const lineSegmentPolygons = ref<Array<LineSegment>>([]);
  const clippingWindow = null;
  const cube = ref<Cube | null>(null);
  function setDrawingCtx(ctx: CanvasRenderingContext2D) {
    drawingCtx.value = ctx
  }
  function setPreviewCtx(ctx: CanvasRenderingContext2D) {
    previewCtx.value = ctx
  }

  function getAllCurveEndpoints(exceptFor: BSpline | HermiteCurve | BezierCurve): Point[] {
    const points: Array<Point> = []

        hermiteCurves.value.filter(curve => curve !== exceptFor).map(curve => curve.endpoints).flat().forEach(point => points.push(new Point(point.x, point.y, point.z, point.w))),
        bezierCurves.value.filter(curve => curve !== exceptFor).map(curve => curve.endpoints).flat().forEach(point => points.push(new Point(point.x, point.y, point.z, point.w))),
        bSplines.value.filter(curve => curve !== exceptFor).map(curve => curve.endpoints).flat().forEach(point => points.push(new Point(point.x, point.y, point.z, point.w)))
    return points
}
  return { drawingCtx, previewCtx, setPreviewCtx, setDrawingCtx, ddaLineSegments, bresenhamLineSegments, wuLineSegments, ellipses, parabolas, hyperbolas, hermiteCurves, bezierCurves, bSplines, vertexPolygons, lineSegmentPolygons, clippingWindow, cube, getAllCurveEndpoints, segmentConnectingMouseForceUnsnapDistance, segmentConnectingSnapDistance }
})
