import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { drawingFunctionsTypes } from '@/geometry/line'
export const useLineStore = defineStore('line', () => {
  const isDrawing = ref(false)
  const startPoint = ref<{ x: number; y: number; z: number; w: number }>({ x: 0, y: 0, z: 0, w: 1 })
  const algoType = ref<drawingFunctionsTypes>('DDA')
  function setStartPoint(x: number, y: number) {
    startPoint.value = { x: x, y: y, z: 0, w: 1 }
  }
  function toggleDrawing() {
    isDrawing.value = !isDrawing.value
  }

  function setAlgoType(algo: drawingFunctionsTypes) {
    algoType.value = algo
  }
  return { isDrawing, startPoint, setStartPoint, toggleDrawing, algoType, setAlgoType }
})
