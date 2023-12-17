<template>
  <div class="editor">
    <div class="editor-container">
      <ToolbarComponent @toolChanged="updateSelectedTool" @colorChanged="updateSelectedColor" :tools="tools"
        :activeTool="selectedTool" :color="selectedColor" />
      <div class="editor-canvas-container">
        <div class="canvas-layers-container">
          <CanvasComponent v-for="layer in layers" :key="layer.id" :id="`canvas-${layer.id}`" class="layer-canvas "
            :width="documentWidth" :height="documentHeight" v-show="layer.visible"
            :ref="(el) => (layers[layer.id].canvas = el as InstanceType<typeof CanvasComponent>)" />
          <CanvasComponent id="preview-canvas" ref="previewRef" :style="{ cursor: cursor }" :width="documentWidth"
            :height="documentHeight" />
        </div>
      </div>
      <div class="editor-properties-panel">
        <div class="layers-panel-container instrument-panel">
          <div class="panel-header">
            <div class="panel-title">
              <span><i class="mdi mdi-layers-triple" /></span> Layers
            </div>
            <div class="panel-buttons">
              <a class="icon-button" @click="addLayer">
                <i class="mdi mdi-plus" />
              </a>
            </div>
          </div>
          <div class="panel-content">
            <div v-for="layer in layers" :key="layer.id"
              :class="layer.id === selectedLayer ? 'layer-list-item active' : 'layer-list-item'"
              @click="selectedLayer = layer.id">
              <div class="layer-preview"></div>
              <div class="layer-name">
                {{ layer.name }}
              </div>
              <div class="layer-visible">
                <a @click="updateLayerVisible(layer.id)">
                  <i :class="layer.visible ? 'mdi mdi-eye' : 'mdi mdi-eye-off'" />
                </a>
              </div>
            </div>
          </div>
        </div>
        <LineToolPane></LineToolPane>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ToolbarComponent from '@/components/ToolbarComponent/ToolbarComponent.vue';
import CanvasComponent from '@/components/CanvasComponent/CanvasComponent.vue';
import LineToolPane from '@/geometry/line/LineToolPane.vue';
import { onMounted, ref, type Ref } from 'vue'
import type { tool } from '@/components/ToolbarComponent/types';
import { lineClickHandler } from '@/geometry/line'
import { ellipseClickHandler } from '@/geometry/bi_curves'
import { useCanvasStore } from '@/stores/canvas'
const canvasStore = useCanvasStore()
const { setDrawingCtx, setPreviewCtx } = canvasStore

const tools: Array<tool> = [
  { id: 0, name: 'Move', icon: 'cursor-move', cursor: 'move', canvasCallbacks: [{ event: 'mouseup', callback: () => { } }, { event: 'mousedown', callback: () => { } }, { event: 'mousemove', callback: () => { } }] },
  { id: 1, name: 'Select', icon: 'select-drag', cursor: 'crosshair', canvasCallbacks: [{ event: 'mouseup', callback: () => { } }, { event: 'mousedown', callback: () => { } }, { event: 'mousemove', callback: () => { } }] },
  {
    id: 2, name: 'Line', icon: 'vector-line', canvasCallbacks: [
      {
        event: 'click', callback: lineClickHandler
      }]
  },
  {
    id: 3, name: 'Bi curves', icon: 'vector-ellipse', canvasCallbacks: [
      { event: 'click', callback: ellipseClickHandler },
    ]
  },
  {
    id: 4, name: 'Rectangle', icon: 'rectangle', canvasCallbacks: [
      { event: 'click', callback: () => {} },
    ]
  }
  // { id: 3, name: 'Paint Bucket', icon: 'format-color-fill', canvasCallbacks: [{ event: 'mouseup', callback: () => { } }, { event: 'mousedown', callback: () => { } }, { event: 'mousemove', callback: () => { } }] },
  // { id: 4, name: 'Crop', icon: 'crop', canvasCallbacks: [{ event: 'mouseup', callback: () => { } }, { event: 'mousedown', callback: () => { } }, { event: 'mousemove', callback: () => { } }] },
  // { id: 5, name: 'Eraser', icon: 'eraser', canvasCallbacks: [{ event: 'mouseup', callback: () => { } }, { event: 'mousedown', callback: () => { } }, { event: 'mousemove', callback: () => { } }] },
  // { id: 7, name: 'Shape', icon: 'shape', canvasCallbacks: [{ event: 'mouseup', callback: () => { } }, { event: 'mousedown', callback: () => { } }, { event: 'mousemove', callback: () => { } }] },
  // { id: 8, name: 'Text', icon: 'format-text', cursor: 'text', canvasCallbacks: [{ event: 'mouseup', callback: () => { } }, { event: 'mousedown', callback: () => { } }, { event: 'mousemove', callback: () => { } }] }
]

const cursor = ref('default')
const selectedColor = ref('#000000')
const selectedTool = ref(0)

const documentHeight = ref(1080)
const documentWidth = ref(1920)

const updateSelectedTool = (toolId: number) => {
  selectedTool.value = toolId
  cursor.value = tools[toolId].cursor || 'default'
  for (const tool of tools) {
    for (const callback of tool.canvasCallbacks) {
      previewRef.value?.$el.removeEventListener(callback.event, callback.callback)
    }
  }
  for (const callback of tools[toolId].canvasCallbacks) {
    previewRef.value?.$el.addEventListener(callback.event, callback.callback)
  }
}
const updateSelectedColor = (color: string) => {
  console.log(color)
  selectedColor.value = color
  for (const layer of layers.value) {
    layer.canvas!.ctx!.fillStyle = color
    layer.canvas!.ctx!.strokeStyle = color
  }
}


const previewRef = ref<InstanceType<typeof CanvasComponent> | undefined>()
const checkboardRef = ref<InstanceType<typeof CanvasComponent> | undefined>()

interface layer {
  id: number
  name: string
  canvas: Ref<InstanceType<typeof CanvasComponent> | undefined>
  visible: boolean
}
const layers = ref<Array<layer>>([{
  id: 0,
  name: 'Background',
  canvas: checkboardRef,
  visible: true,
},
{
  id: 1,
  name: 'Layer 1',
  canvas: ref(undefined),
  visible: true
}])
const selectedLayer = ref<number>(1)

const addLayer = () => {
  layers.value.push({
    id: layers.value.length,
    name: `Layer ${layers.value.length}`,
    canvas: undefined,
    visible: true
  })
}
const updateLayerVisible = (id: number) => {
  layers.value[id].visible = !layers.value[id].visible
}

const selection = null
const isDragging = false
const selectionStart = null


onMounted(() => {
  // checkerboard canvas
  const canvas = checkboardRef.value!
  const ctx = canvas.ctx!
  setPreviewCtx(previewRef.value!.ctx!)
  setDrawingCtx(layers.value[selectedLayer.value].canvas!.ctx!)
  const GRID_SIZE = 10;
  const blocksX = Math.round(documentWidth.value / GRID_SIZE);
  const blocksY = Math.round(documentHeight.value / GRID_SIZE);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
  ctx!.beginPath();
  for (let x = 0; x <= blocksX; x++) {
    for (let y = 0; y <= blocksY; y++) {
      if ((x + y) % 2 === 0) {
        checkboardRef.value!.ctx!.fillStyle = 'white';
      } else {
        checkboardRef.value!.ctx!.fillStyle = '#eee';
      }

      ctx.fillRect(GRID_SIZE * x, GRID_SIZE * y, GRID_SIZE, GRID_SIZE);
    }
  }
  checkboardRef.value!.ctx!.fillStyle = "white"
  checkboardRef.value!.ctx!.fillRect(0, 0, previewRef.value!.width, previewRef.value!.height)
}
)
//     methods: {
//       onWindowResize() {
//         // Update canvas bounding rect

//         this.$nextTick(function() {
//           this.boundingRect = this.canvas.getBoundingClientRect();
//         });
//       },

//       getCursorPos(e) {
//         return {
//           x: e.clientX - this.boundingRect.left,
//           y: e.clientY - this.boundingRect.top
//         };
//       },

//       handleSelectMouseDown(e) {
//         this.selectionStart = null;
//         var startPos = this.getCursorPos(e);
//         this.selectionStart = startPos;
//         this.isDragging = true;
//       },

//       handleSelectMouseUp(e) {
//         var endPos = this.getCursorPos(e);
//         var selectionEnd = {
//           x: endPos.x - this.selectionStart.x,
//           y: endPos.y - this.selectionStart.y
//         }

//         this.selection = [this.selectionStart, selectionEnd];
//         this.isDragging = false;

//         // this.context.fillStyle = this.currentColor;
//         // this.context.fillRect(endPos.x, endPos.y, 4, 4);
//         // this.context.fillRect(this.selectionStart.x, this.selectionStart.y, 4, 4);
//       },

//       handlePaintBucketMouseDown() {
//         if (this.selection === null) {
//           this.layers[this.selectedLayer].context.beginPath();
//           this.layers[this.selectedLayer].context.rect(0, 0, this.canvas.width, this.canvas.height);
//           this.layers[this.selectedLayer].context.fillStyle = this.currentColor;
//           this.layers[this.selectedLayer].context.fill();
//           this.layers[this.selectedLayer].context.closePath();
//         } else {
//           // Figure out orientation for rectangle because
//           // (0,0) is always top left in canvas but our selection
//           // isn't guarenteed to orient that way
//           const Sx = this.selection[0].x;
//           const Sy = this.selection[0].y;
//           const Ex = this.selection[1].x;
//           const Ey = this.selection[1].y;

//           const vecS = new Vector2D(Sx, Sy);
//           const vecE = new Vector2D(Ex, Ey);
//           const O = vecS.Subtract(vecE);

//           console.log(O.x, O.y);

//           var startX, startY, endX, endY;

//           if (O.x < 0 && O.y < 0) {
//             startX = Sx;
//             startY = Sy;
//             endX = Ex;
//             endY = Ey;
//           } else if (O.x >= 0 && O.y >= 0) {
//             startX = Ex;
//             startY = Ey;
//             endX = Sx;
//             endY = Sy;
//           } else if (O.x >= 0 && O.y < 0) {
//             startX = Ex;
//             startY = Sy;
//             endX = Sx;
//             endY = Ey;
//           } else if (O.x < 0 && O.y >= 0) {
//             startX = Sx;
//             startY = Ey;
//             endX = Ex;
//             endY = Sy;
//           }

//           this.layers[this.selectedLayer].context.beginPath();
//           this.layers[this.selectedLayer].context.rect(startX, startY, endX, endY);
//           this.layers[this.selectedLayer].context.fillStyle = this.currentColor;
//           this.layers[this.selectedLayer].context.fill();
//           this.layers[this.selectedLayer].context.closePath();
//         }
//       },
//     }
//   }
</script>

<style>
.editor-container {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
}

.editor-canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 96vh;
  max-width: 80vw;
}

.editor-properties-panel {
  background: var(--background);
  display: flex;
  flex-direction: column;
  flex-flow: nowrap;
  min-width: 17vw;
  flex-direction: column;
}

.layer-canvas {
  /* position: absolute;
  width: 100%;
  height: 100%;
  border: 1px solid black;
  top: 0;
  left: 0; */
}

.canvas-layers-container {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: auto;
  contain: strict;
  white-space: nowrap;
  justify-content: center safe;

}

.instrument-panel {
  flex: 1 1 auto;
}

.panel-header {
  font-size: 14pt;
  /* padding: 10px; */
  background: #1a1c29;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-left: 10px;
  padding-right: 10px;
}

.panel-title {
  flex: 1;

}

#preview-canvas {
  /* background: #aaa; */
  box-shadow: 10px 10px 10px #000000;
}

.icon-button {
  background: none;
  outline: none;
  border: none;
  font-size: 20pt;
  width: 20px;
  height: 20px;
  transition: 250ms;
}

.icon-button:hover {
  opacity: 0.8;
  cursor: pointer;
}

.icon-button:active {
  opacity: 0.5;
}

.layer-list-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px;
}

.layer-list-item.active {
  background: #2a2d42;
}

.layer-preview {
  width: 50px;
  height: 50px;
  border: 1px solid #1a1c29;
  background: white;
  margin-right: 10px;
}

.layer-name {
  font-weight: 400;
  flex: 1;
}

.layer-visible a {
  font-size: 14pt;
}

.layer-visible a:hover {
  opacity: 0.8;
  cursor: pointer;
}

.canvas-layers-container {
  position: relative;
}

.layer-canvas {
  background: transparent;
}

#checkboard-canvas {
  background: red;
}
</style>
