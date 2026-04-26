import type { InputMode } from '../state/AppState';

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  inputMode: InputMode,
): void {
  if (inputMode === 'webcam') {
    ctx.fillStyle = 'rgba(3, 5, 6, 0.25)';
    ctx.fillRect(0, 0, w, h);
    return;
  }

  const bg = ctx.createRadialGradient(w * 0.42, h * 0.38, 30, w * 0.42, h * 0.38, Math.max(w, h));
  bg.addColorStop(0, '#111417');
  bg.addColorStop(0.55, '#0a0d10');
  bg.addColorStop(1, '#050607');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  if (inputMode === 'joystick') {
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }
}
