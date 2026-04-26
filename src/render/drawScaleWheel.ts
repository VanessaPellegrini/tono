import type { NoteName, AccidentalMode } from '../data/chords';
import { displayNote } from '../data/chords';
import { CIRCLE_OF_FIFTHS } from '../data/scales';

export function drawScaleWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  selectedRoot: NoteName,
  hoveredIndex: number,
  label: string,
  accidentalMode: AccidentalMode = 'sharp',
): void {
  const count = CIRCLE_OF_FIFTHS.length;
  const wedgeAngle = (Math.PI * 2) / count;
  const start = -Math.PI / 2;

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.translate(cx, cy);

  const ring = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius);
  ring.addColorStop(0, 'rgba(255,255,255,0.02)');
  ring.addColorStop(1, 'rgba(255,255,255,0.06)');
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  CIRCLE_OF_FIFTHS.forEach((root, index) => {
    const angle = start + index * wedgeAngle;
    const mid = angle + wedgeAngle / 2;
    const isSelected = root === selectedRoot;
    const isHovered = index === hoveredIndex;
    const displayRoot = displayNote(root, accidentalMode);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius * 0.98, angle, angle + wedgeAngle);
    ctx.closePath();

    if (isSelected) {
      ctx.fillStyle = 'rgba(180,160,229,0.25)';
    } else if (isHovered) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
    }
    ctx.fill();

    ctx.strokeStyle = isSelected
      ? 'rgba(180,160,229,0.6)'
      : isHovered
        ? 'rgba(255,255,255,0.15)'
        : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = isSelected ? 1.5 : 1;
    ctx.stroke();

    const labelRadius = radius * 0.74;
    const labelX = Math.cos(mid) * labelRadius;
    const labelY = Math.sin(mid) * labelRadius;
    ctx.save();
    ctx.translate(labelX, labelY);
    ctx.rotate(mid + Math.PI / 2);
    ctx.font = `${isSelected ? 700 : 500} ${isSelected ? 14 : 12}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = isSelected
      ? 'rgba(220,210,255,0.95)'
      : isHovered
        ? 'rgba(255,255,255,0.72)'
        : 'rgba(255,255,255,0.36)';
    ctx.fillText(displayRoot, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.rotate(angle);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(radius * 0.33, 0);
    ctx.lineTo(radius * 0.96, 0);
    ctx.stroke();
    ctx.restore();
  });

  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(200,190,230,0.8)';
  ctx.fillText(label, cx, cy + radius + 22);
  ctx.restore();
}
