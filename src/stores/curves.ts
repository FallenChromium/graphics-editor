import { Point } from '@/geometry/point'
import { getClosestReferencePointToPoint } from '@/geometry/utils'
import { Matrix, bSplineMatrix, hermiteMatrix } from '@/linear_algebra/matrix'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type CurveType = 'Bezier' | 'Hermit' | 'B-Spline'


export const useCurveStore = defineStore('curves', () => {
  const algoType = ref<CurveType>('Bezier')
  const points = ref<Point[]>([])
  const isDrawing = ref<boolean>(false)
  
  function addPoint (point: Point) {
    points.value.push(point)
  }
  function wipePoints() {
    points.value = []
  }

  function setAlgoType(type: CurveType) {
    algoType.value = type
  }

  function setDrawing(state: boolean) {
    isDrawing.value = state
  }
  return { addPoint, points, algoType, isDrawing, wipePoints, setAlgoType, setDrawing }
})

