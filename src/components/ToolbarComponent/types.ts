import { type CanvasCallback } from "../CanvasComponent/types"
export interface tool {
  id: number
  name: string
  icon: string
  canvasCallbacks: Array<CanvasCallback>
  cursor?: string
}

const exampleTools: Array<tool> = [{
    id: 0,
    name: 'Test',
    icon: 'mdi-text',
    canvasCallbacks: [{event: 'mouseup', callback: () => {}}, {event: 'mousedown', callback: () => {}}, {event: 'mousemove', callback: () => {}}]
}]
