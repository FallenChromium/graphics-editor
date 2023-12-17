<script setup lang="ts">
import { ref, onMounted, defineExpose, type Ref, type CanvasHTMLAttributes } from 'vue'
const CanvasElement: Ref<HTMLCanvasElement | undefined> = ref(undefined)
const props = defineProps({
  width: { type: Number, required: true },
  height: { type: Number, required: true }
})
const canvas = ref<HTMLCanvasElement | undefined>(undefined)
const ctx = ref<CanvasRenderingContext2D | undefined>(undefined)
const dpr = window.devicePixelRatio

defineExpose({ element: canvas, ctx: ctx, width: props.width, height: props.height })

onMounted(() => {
  canvas.value = CanvasElement.value!
  ctx.value = canvas.value!.getContext('2d') as CanvasRenderingContext2D
  // make canvas transparent
  // synchronize canvas size to screen pixels

  canvas.value.width = props.width * dpr
  canvas.value.height = props.height * dpr
  ctx.value.scale(dpr, dpr)
  ctx.value.strokeStyle = 'black';
  ctx.value.lineCap = 'square';
  ctx.value.imageSmoothingEnabled = false;
})
</script>

<template>
  <canvas ref="CanvasElement" class="canvas-element" :width="props.width / dpr" :height="props.height / dpr"
    :style="{ width: `${props.width}px`, height: `${props.height}px` }"></canvas>
</template>

<style>
.canvas-element {
  top: 0;
  left: 0;
  position: absolute;
}
</style>
