
export const clearCanvas = (ctx: CanvasRenderingContext2D) => {
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear the preview canvas before drawing the new line
    }
  };