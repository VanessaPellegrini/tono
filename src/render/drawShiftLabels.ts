export function drawShiftLabels(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  wheelRadius: number,
  handPointers: Array<{ visible: boolean; wheel: number; shift: number }>,
): void {
  const leftX = w * 0.279;
  const rightX = w * 0.721;
  const labelY = h * 0.5 + wheelRadius + 28;

  for (const hand of handPointers) {
    if (!hand.visible || hand.shift === 0) continue;
    const cx = hand.wheel === 0 ? leftX : rightX;
    ctx.save();
    ctx.font = '600 16px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hand.shift > 0 ? `+${hand.shift}` : `${hand.shift}`, cx, labelY);
    ctx.restore();
  }
}
