import type { HandPointerState } from '../input/HandTracker';

const SOURCE_COLORS: Record<string, { stroke: string; fill: string }> = {
  index:   { stroke: 'rgba(34,197,94,0.92)',  fill: 'rgba(34,197,94,0.18)' },
  fingers: { stroke: 'rgba(234,179,8,0.92)',  fill: 'rgba(234,179,8,0.18)' },
  palm:    { stroke: 'rgba(227,59,54,0.92)',  fill: 'rgba(227,59,54,0.18)' },
};

export function drawHandPointers(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  handPointers: HandPointerState[],
): void {
  handPointers.filter((hand) => hand.visible).forEach((hand) => {
    const px = hand.x * w;
    const py = hand.y * h;
    const colors = SOURCE_COLORS[hand.source] ?? SOURCE_COLORS.palm;
    ctx.save();
    ctx.strokeStyle = colors.stroke;
    ctx.fillStyle = colors.fill;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff7f3';
    ctx.fill();
    ctx.restore();
  });
}
