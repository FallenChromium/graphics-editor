import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { drawingFunctionsTypes } from '@/geometry/lines'
import type { point } from '@/geometry/types'
export const useLineStore = defineStore('line', () => {
  const isDrawing = ref(false)
  const startPoint = ref<point>({ x: 0, y: 0 })
  const algoType = ref<drawingFunctionsTypes>("DDA")
  function setStartPoint(x: number, y: number) {
    startPoint.value = {x: x, y: y}
  }
  function toggleDrawing() {
    isDrawing.value = !isDrawing.value
  }

  function setAlgoType(algo: drawingFunctionsTypes) {
    algoType.value = algo
  }
  return { isDrawing, startPoint, setStartPoint, toggleDrawing, algoType, setAlgoType, }
})
