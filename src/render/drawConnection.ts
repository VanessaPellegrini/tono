export function drawConnection(
  ctx: CanvasRenderingContext2D,
  leftX: number,
  rightX: number,
  centerY: number,
  alpha: number,
): void {
  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  const gradient = ctx.createLinearGradient(leftX, centerY, rightX, centerY);
  gradient.addColorStop(0, 'rgba(180,160,229,0.2)');
  gradient.addColorStop(0.5, 'rgba(180,160,229,0.08)');
  gradient.addColorStop(1, 'rgba(180,160,229,0.2)');

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftX, centerY);
  ctx.lineTo(rightX, centerY);
  ctx.stroke();

  const dotCount = 5;
  const dotSpacing = (rightX - leftX) / (dotCount + 1);
  for (let i = 1; i <= dotCount; i++) {
    const x = leftX + i * dotSpacing;
    ctx.fillStyle = 'rgba(180,160,229,0.15)';
    ctx.beginPath();
    ctx.arc(x, centerY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
