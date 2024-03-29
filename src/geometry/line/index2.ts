import type { CanvasCallback } from '@/components/CanvasComponent/types';
import { type point, type line } from '../types'
import { useLineStore } from '@/stores/line';
import { clearCanvas } from '@/components/CanvasComponent/utils';
export { drawLineBresenham, drawLineDDA, drawLineWu };
import { pinia } from '@/stores'
import { storeToRefs } from 'pinia';
import { useCanvasStore } from '@/stores/canvas';
import { convertHexToRGBA } from '@/components/ToolbarComponent/utils';

const lineStore = useLineStore(pinia)
const { isDrawing, startPoint, algoType } = storeToRefs(lineStore)
const { setStartPoint, toggleDrawing } = lineStore
const canvasStore = useCanvasStore(pinia)
const { drawingCtx, previewCtx } = storeToRefs(canvasStore)

export type drawingFunctionsTypes = "DDA" | "Bresenham" | "Wu";

export const lineDrawingFunctions = {
  "DDA": drawLineDDA,
  "Bresenham": drawLineBresenham,
  "Wu": drawLineWu
}

function drawLineDDA(
  start: point,
  end: point,
  canvasCtx: CanvasRenderingContext2D
): line {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const xIncrement = dx / steps;
  const yIncrement = dy / steps;
  let x = start.x;
  let y = start.y;
  const debugArray: point[] = [];
  canvasCtx.beginPath();

  for (let i = 0; i < steps; i++) {
    x = x + xIncrement;
    y = y + yIncrement;
    canvasCtx.lineTo(Math.round(x), Math.round(y));
    canvasCtx.moveTo(Math.round(x), Math.round(y));
    debugArray.push({ x: Math.round(x), y: Math.round(y), z: 0, w: 0 });
  }
  canvasCtx.stroke();
  canvasCtx.closePath();
  return { start, end, points: debugArray };
}

/* Used as a reference: https://ychebnikkompgrafblog.wordpress.com/2-3-%D0%BE%D0%B1%D1%89%D0%B8%D0%B9-%D0%B0%D0%BB%D0%B3%D0%BE%D1%80%D0%B8%D1%82%D0%BC-%D0%B1%D1%80%D0%B5%D0%B7%D0%B5%D0%BD%D1%85%D0%B5%D0%BC%D0%B0/ */
function drawLineBresenham(
  start: point,
  end: point,
  canvasCtx: CanvasRenderingContext2D
): line {
  // projections on the x and y axis
  let dx = end.x - start.x;
  let dy = end.y - start.y;
  let steep = false;
  let x = start.x;
  let y = start.y;
  const points: point[] = [];
  canvasCtx.beginPath();
  if (Math.abs(dy) > Math.abs(dx)) {
    const temp = dx;
    dx = dy;
    dy = temp;
    x = start.y
    y = start.x
    steep = true;
  }
  // in which direction should the coordinate change
  const step_x = Math.sign(dx);
  const step_y = Math.sign(dy);
  // e = 1/2 + dy/dx; e * 2dx = 2dy - dx -> no division
  let error = 2 * Math.abs(dy) - Math.abs(dx);
  for (let i = 0; i <= Math.abs(dx); i++) {
    if (error >= 0) {
      // add to secondary coordinate because the error indicates we should be "higher" 
      // (actually depends on the direction of dy)
      y = y + step_y;
      error = error - 2 * Math.abs(dx);
    }
    // always add to main coordinate anyway
    x = x + step_x;
    error = error + 2 * Math.abs(dy);
    const curPoint = { x: steep ? Math.round(y) : Math.round(x), y: steep ? Math.round(x) : Math.round(y) }
    canvasCtx.lineTo(curPoint.x, curPoint.y);
    canvasCtx.moveTo(curPoint.x, curPoint.y);
    points.push();
  }
  canvasCtx.stroke();
  canvasCtx.closePath();
  return { start, end, points };
}

function drawLineWu(start: Point, end: Point) {
  const idealLine = new Line(endpoints.start, endpoints.end);
  if (idealLine.angleToXAxis % 45 === 0) {
      // значит, линия горизонтальная, вертикальная или диагональная
      return this._ddaLine(endpoints);
  }

  const points = [];

  if (endpoints.start.x > endpoints.end.x) {
      this._swapEndpoints(endpoints);
  }
  const [x_start, y_start, x_end, y_end] = this._mapEndpoints(endpoints);

  const deltaX_raw = Math.abs(x_end - x_start);
  const deltaY_raw = Math.abs(y_end - y_start);

  const swapVariables = Math.abs(deltaY_raw / deltaX_raw) > 1;
  const variableInfo = this._getDependentAndIndependentVariableInfo(endpoints, swapVariables);

  let currIndependentVariableValue = variableInfo.independentStart;
  let currDependentVariableValue = variableInfo.dependentStart;
  let error = 0;
  const deltaErr = variableInfo.deltaDependent / variableInfo.deltaIndependent;
  for (
      ;
      currIndependentVariableValue != variableInfo.independentEnd;
      currIndependentVariableValue += variableInfo.independentStep
  ) {
      const x = swapVariables ? currDependentVariableValue : currIndependentVariableValue;
      const y = swapVariables ? currIndependentVariableValue : currDependentVariableValue;
      const firstPointToDraw = new Point(x, y);
      const secondPointToDraw = new Point(
          swapVariables ? x + variableInfo.dependentStep : x,
          swapVariables ? y : y + variableInfo.dependentStep
      );
      const intensity1 = Math.max(0, 1 - idealLine.distanceToPoint(firstPointToDraw));
      const intensity2 = 1 - intensity1;
      points.push({
          x: firstPointToDraw.x,
          y: firstPointToDraw.y,
          opacity: intensity1
      });
      points.push({
          x: secondPointToDraw.x,
          y: secondPointToDraw.y,
          opacity: intensity2
      });

      error += deltaErr;
      // порог значения ошибки 1 нужен, так как в этом случае переход к следующему значению
      // зависимой переменной должен осуществляться после того, как значение выражения
      // currDependentVariableValue + error выходит за пределы следующего значения зависимой
      // переменной (т.к. алгоритм рисует блоками высотой 2 пикселя)
      if (error >= 1.5) {
          currDependentVariableValue += variableInfo.dependentStep;
          error -= 1;
      }
  }

  return points;
}

export function lineMoveHandler(e: MouseEvent) {
  const ctx = previewCtx.value!;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  lineDrawingFunctions[algoType.value](
    startPoint.value,
    { x: e.offsetX, y: e.offsetY },
    ctx
  );
}

export const lineClickHandler = (e: MouseEvent) => {
  const preview = previewCtx.value!
  console.log(previewCtx)
  console.log(preview)
  const drawingCanvas = drawingCtx.value!
  if (isDrawing.value) {
    console.log('STOP DRAWING');
    console.log(algoType.value)
    clearCanvas(preview);
    // call the function for the corresponding algorithm
    lineDrawingFunctions[algoType.value](
      startPoint.value,
      // click position on the canvas
      { x: e.offsetX, y: e.offsetY },
      drawingCanvas
    );
    // reset the state
    setStartPoint(0, 0);
    preview.canvas.removeEventListener(
      'mousemove',
      lineMoveHandler
    );
  } else {
    console.log('START DRAWING');
    console.log(`Starting point: ${e.offsetX}, ${e.offsetY}`);
    clearCanvas(preview);
    setStartPoint(e.offsetX, e.offsetY);
    // add event listener to preview the line that will be drawn on the second click
    preview.canvas.addEventListener(
      'mousemove',
      lineMoveHandler)
  }
  toggleDrawing();
}