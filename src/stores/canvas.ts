import { ref } from 'vue'
import { defineStore } from 'pinia'
import CanvasComponent from '@/components/CanvasComponent/CanvasComponent.vue';

export const useCanvasStore = defineStore('canvas', () => {
  const drawingCtx = ref<CanvasRenderingContext2D|undefined>(undefined)
  const previewCtx = ref<CanvasRenderingContext2D|undefined>(undefined)
  function setDrawingCtx(ctx: CanvasRenderingContext2D) {
    drawingCtx.value = ctx
  }
  function setPreviewCtx(ctx: CanvasRenderingContext2D) {
    previewCtx.value = ctx
  }
  return { drawingCtx, previewCtx, setPreviewCtx, setDrawingCtx }
})
