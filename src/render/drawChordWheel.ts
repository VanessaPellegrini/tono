import { ROOT_NAMES, transposeNoteName } from '../data/chords';

export function drawChordWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  currentChord: string | null,
  selectedIndex: number,
  shift = 0,
  selectedChordIndex: number,
  isWebcam: boolean,
  flashAlpha: { value: number },
  flashChord: string | null,
): void {
  const wedgeAngle = (Math.PI * 2) / ROOT_NAMES.length;
  const start = -Math.PI / 2;

  ctx.save();
  ctx.translate(cx, cy);

  if (flashAlpha.value > 0) {
    ctx.save();
    ctx.globalAlpha = flashAlpha.value;
    ctx.fillStyle = 'rgba(227,59,54,0.24)';
    ctx.beginPath();
    ctx.arc(0, 0, radius + 16, 0, Math.PI * 2);
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

  ROOT_NAMES.forEach((root, index) => {
    const angle = start + index * wedgeAngle;
    const mid = angle + wedgeAngle / 2;
    const isSelected = index === selectedIndex;
    const label = shift !== 0 ? transposeNoteName(root, shift) : root;
    const isActive = currentChord ? currentChord === label : false;
    const inner = radius * 0.33;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius * 0.98, angle, angle + wedgeAngle);
    ctx.closePath();

    if (isActive) {
      ctx.fillStyle = 'rgba(227,59,54,0.28)';
    } else if (isSelected) {
      ctx.fillStyle = 'rgba(255,248,238,0.16)';
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
    }
    ctx.fill();

    ctx.strokeStyle = isActive ? 'rgba(255,155,145,0.8)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.stroke();

    const labelRadius = radius * 0.72;
    const labelX = Math.cos(mid) * labelRadius;
    const labelY = Math.sin(mid) * labelRadius;
    ctx.save();
    ctx.translate(labelX, labelY);
    ctx.rotate(mid + Math.PI / 2);
    ctx.font = `${isActive ? 700 : isSelected ? 600 : 500} 15px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = isActive ? '#fff7f3' : isSelected ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.56)';
    ctx.fillText(label, 0, 0);
    ctx.restore();

    if (isSelected && currentChord) {
      const tagRadius = radius * 0.57;
      const tagX = Math.cos(mid) * tagRadius;
      const tagY = Math.sin(mid) * tagRadius;
      ctx.save();
      ctx.translate(tagX, tagY);
      ctx.rotate(mid + Math.PI / 2);
      ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.24)';
      ctx.fillText(currentChord.slice(label.length) || 'maj', 0, 0);
      ctx.restore();
    }

    ctx.save();
    ctx.rotate(angle);
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(inner, 0);
    ctx.lineTo(radius * 0.96, 0);
    ctx.stroke();
    ctx.restore();
  });

  const core = ctx.createRadialGradient(0, 0, 2, 0, 0, radius * 0.36);
  core.addColorStop(0, 'rgba(0,0,0,0.96)');
  core.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.36, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.36, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = -1; i <= 1; i++) {
    const x = i * 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(x, -radius * 0.14);
    ctx.lineTo(x, radius * 0.14);
    ctx.stroke();
  }

  ctx.restore();

  const navY = cy + radius + 42;
  const navX = cx - 42;
  ctx.save();
  for (let i = 0; i < ROOT_NAMES.length; i++) {
    const dotX = navX + 24 + i * 12;
    ctx.beginPath();
    ctx.arc(dotX, navY - 3, i === selectedChordIndex ? 4.5 : 3, 0, Math.PI * 2);
    ctx.fillStyle = i === selectedChordIndex ? '#fff7f3' : 'rgba(255,255,255,0.26)';
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('6-chord wheel', navX + 36, navY + 13);
  ctx.restore();

  if (flashChord && !isWebcam) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#fff7f3';
    ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(flashChord, cx, cy + radius + 18);
    ctx.restore();
  }
}
