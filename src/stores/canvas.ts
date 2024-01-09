import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { BezierCurve, HermiteCurve, type Cube, BSpline } from '@/components/CanvasComponent/types'
import { Line } from '@/geometry/line'
import { Polygon } from '@/geometry/polygon'
import { LineSegment } from '@/geometry/line'
import { Point } from '@/geometry/point'
import { type Ellipse, type Hyperbola, type Parabola } from '@/geometry/biCurves'

export const useCanvasStore = defineStore('canvas', () => {
  const drawingCtx = ref<CanvasRenderingContext2D | undefined>(undefined)
  const previewCtx = ref<CanvasRenderingContext2D | undefined>(undefined)
  const segmentConnectingSnapDistance = 20;
  const segmentConnectingMouseForceUnsnapDistance = 100;
  const selectedLayer = ref<number>(1);
  class State {
    _currRotationX = 0;
    _currRotationY = 0;
    _currRotationZ = 0;
    _currScaleX = 1;
    _currScaleY = 1;
    _currScaleZ = 1;
    _currTranslationX = 0;
    _currTranslationY = 0;
    _currTranslationZ = 0;
    _tX = 0;
    _tY = 0;
    _reflectedX = false;
    _reflectedY = false;

    ddaLineSegments: LineSegment[] = [];
    bresenhamLineSegments: LineSegment[] = [];
    wuLineSegments: LineSegment[] = [];
    ellipses: Ellipse[] = [];
    parabolas: Parabola[] = [];
    hyperbolas: Hyperbola[] = [];
    hermiteCurves: HermiteCurve[] = [];
    bezierCurves: BezierCurve[] = [];
    bSplines: BSpline[] = [];
    vertexPolygons: Polygon[] = [];
    lineSegmentPolygons: Polygon[] = [];
    clippingWindow = null;
    cube: Cube | null = null;
  
  }

  const layersState = ref<Map<number, State>>(new Map())

  function addLayer(index: number) {
    layersState.value.set(index,new State)
  }
  function setDrawingCtx(ctx: CanvasRenderingContext2D) {
    drawingCtx.value = ctx
  }
  function setPreviewCtx(ctx: CanvasRenderingContext2D) {
    previewCtx.value = ctx
  }

  function getAllCurveEndpoints(exceptFor: BSpline | HermiteCurve | BezierCurve): Point[] {
    const points: Array<Point> = []

    for (const state of layersState.value.values()) {
      state.hermiteCurves.filter(curve => curve !== exceptFor).map(curve => curve.endpoints).flat().forEach(point => points.push(new Point(point.x, point.y, point.z, point.w))),
      state.bezierCurves.filter(curve => curve !== exceptFor).map(curve => curve.endpoints).flat().forEach(point => points.push(new Point(point.x, point.y, point.z, point.w))),
      state.bSplines.filter(curve => curve !== exceptFor).map(curve => curve.endpoints).flat().forEach(point => points.push(new Point(point.x, point.y, point.z, point.w)))
    }
    return points
  }

  function addDDALineSegment(segment: LineSegment) {
    layersState.value.get(selectedLayer.value)?.ddaLineSegments.push(segment)
  }

  function addBresenhamLineSegment(segment: LineSegment) {
    layersState.value.get(selectedLayer.value)?.bresenhamLineSegments.push(segment)
  }

  function addWuLineSegment(segment: LineSegment) {
    layersState.value.get(selectedLayer.value)?.wuLineSegments.push(segment)
  }

  function addEllipse(ellipse: Ellipse) {
    layersState.value.get(selectedLayer.value)?.ellipses.push(ellipse)
  }

  function addParabola(parabola: Parabola) {
    layersState.value.get(selectedLayer.value)?.parabolas.push(parabola)
  }

  function addHyperbola(hyperbola: Hyperbola) {
    layersState.value.get(selectedLayer.value)?.hyperbolas.push(hyperbola)
  }

  function addHermiteCurve(curve: HermiteCurve) {
    layersState.value.get(selectedLayer.value)?.hermiteCurves.push(curve)
  }

  function addBezierCurve(curve: BezierCurve) {
    layersState.value.get(selectedLayer.value)?.bezierCurves.push(curve)
  }

  function addBSpline(curve: BSpline) {
    layersState.value.get(selectedLayer.value)?.bSplines.push(curve)
  }
  return { drawingCtx, previewCtx, setPreviewCtx, setDrawingCtx, addDDALineSegment, addBresenhamLineSegment, addWuLineSegment, addEllipse, addParabola, addHyperbola, addHermiteCurve, addBezierCurve, addBSpline, addLayer, selectedLayer, layersState, getAllCurveEndpoints, segmentConnectingMouseForceUnsnapDistance, segmentConnectingSnapDistance }
})
