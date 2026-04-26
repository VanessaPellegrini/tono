import type { DiatonicChord } from '../data/scales';
import { transposeNoteName } from '../data/chords';

const ACCENT = { r: 180, g: 160, b: 229 };

export function drawDiatonicWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  chords: DiatonicChord[],
  selectedIndex: number,
  hoveredIndex: number,
  shift = 0,
  flashAlpha: { value: number },
): void {
  const count = chords.length;
  const wedgeAngle = (Math.PI * 2) / count;
  const start = -Math.PI / 2;

  ctx.save();
  ctx.translate(cx, cy);

  if (flashAlpha.value > 0) {
    ctx.save();
    ctx.globalAlpha = flashAlpha.value;
    ctx.fillStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},0.22)`;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    flashAlpha.value *= 0.9;
    if (flashAlpha.value < 0.01) flashAlpha.value = 0;
  }

  const ring = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius);
  ring.addColorStop(0, 'rgba(255,255,255,0.02)');
  ring.addColorStop(1, 'rgba(255,255,255,0.12)');
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  chords.forEach((chord, index) => {
    const angle = start + index * wedgeAngle;
    const mid = angle + wedgeAngle / 2;
    const isSelected = index === selectedIndex;
    const isHovered = index === hoveredIndex;
    const rootLabel = shift !== 0 ? transposeNoteName(chord.root, shift) : chord.root;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius * 0.98, angle, angle + wedgeAngle);
    ctx.closePath();

    if (isSelected) {
      ctx.fillStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},0.3)`;
    } else if (isHovered) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
    }
    ctx.fill();

    ctx.strokeStyle = isSelected
      ? `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},0.7)`
      : isHovered
        ? 'rgba(255,255,255,0.14)'
        : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();

    const degreeRadius = radius * 0.8;
    const degreeX = Math.cos(mid) * degreeRadius;
    const degreeY = Math.sin(mid) * degreeRadius;
    ctx.save();
    ctx.translate(degreeX, degreeY);
    ctx.rotate(mid + Math.PI / 2);
    ctx.font = `${isSelected ? 700 : 500} 13px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = isSelected
      ? 'rgba(230,220,255,0.95)'
      : isHovered
        ? 'rgba(255,255,255,0.8)'
        : 'rgba(255,255,255,0.52)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(chord.degreeSymbol, 0, 0);
    ctx.restore();

    const nameRadius = radius * 0.56;
    const nameX = Math.cos(mid) * nameRadius;
    const nameY = Math.sin(mid) * nameRadius;
    ctx.save();
    ctx.translate(nameX, nameY);
    ctx.rotate(mid + Math.PI / 2);
    ctx.font = `${isSelected ? 600 : 400} 11px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = isSelected
      ? 'rgba(255,255,255,0.7)'
      : 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(shift !== 0 ? rootLabel + chord.name.slice(chord.root.length) : chord.name, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.rotate(angle);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(radius * 0.33, 0);
    ctx.lineTo(radius * 0.96, 0);
    ctx.stroke();
    ctx.restore();
  });

  ctx.restore();
}
