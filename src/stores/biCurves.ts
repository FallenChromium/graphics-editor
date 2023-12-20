import { ref } from 'vue'
import { defineStore } from 'pinia'
export const useBiCurveStore = defineStore('biCurves', () => {
  const isDrawing = ref(false)
  const origin = ref<{ x: number; y: number; z: number; w: number }>({ x: 0, y: 0, z: 0, w: 1 })
  const ellipseA = ref<number>(0);
  const ellipseB = ref<number>(0);
  const direction = ref<"Horizontal" | "Vertical">("Horizontal");

  function switchDrawing() {
    isDrawing.value = !isDrawing.value
  }
  function setOrigin(x: number, y: number) {
    origin.value = { x: x, y: y, z: 0, w: 1 }
  }

  function setEllipseA(value: number) {
    ellipseA.value = value
  }

  function setEllipseB(value: number) {
    ellipseB.value = value
  }

  function toggleDrawing() {
    isDrawing.value = !isDrawing.value
  }

//   function setAlgoType(algo: drawingFunctionsTypes) {
//     algoType.value = algo
//   }
  return { isDrawing, origin, setOrigin, setEllipseA, setEllipseB, toggleDrawing, ellipseA, ellipseB, switchDrawing, direction }
})
