export function drawSideZones(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  handPointers: Array<{
    visible: boolean;
    zoneHalf: 'top' | 'bottom' | null;
    inLeftZone: boolean;
    inRightZone: boolean;
  }>,
): void {
  const zoneW = w * 0.06;

  for (const hand of handPointers) {
    if (!hand.visible) continue;
    const half = hand.zoneHalf;

    const drawZone = (x: number, isTop: boolean): void => {
      ctx.save();
      if (isTop) {
        ctx.fillStyle = 'rgba(59,130,246,0.15)';
        ctx.fillRect(x, 0, zoneW, h / 2);
      } else {
        ctx.fillStyle = 'rgba(34,197,94,0.15)';
        ctx.fillRect(x, h / 2, zoneW, h / 2);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + zoneW * (x === 0 ? 1 : 0), 0);
      ctx.lineTo(x + zoneW * (x === 0 ? 1 : 0), h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, h / 2);
      ctx.lineTo(x + zoneW, h / 2);
      ctx.stroke();
      ctx.font = '700 28px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isTop) {
        ctx.fillStyle = 'rgba(59,130,246,0.8)';
        ctx.fillText('+', x + zoneW / 2, h * 0.25);
      } else {
        ctx.fillStyle = 'rgba(34,197,94,0.8)';
        ctx.fillText('\u2212', x + zoneW / 2, h * 0.75);
      }
      ctx.restore();
    };

    if (hand.inLeftZone && half) drawZone(0, half === 'top');
    if (hand.inRightZone && half) drawZone(w - zoneW, half === 'top');
  }
}
