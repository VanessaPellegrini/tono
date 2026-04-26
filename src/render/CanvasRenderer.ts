import type { SongManager } from '../song/SongManager';
import { ROOT_NAMES, transposeNoteName } from '../data/chords';
import type { HandPointerState } from '../input/HandTracker';

const SOURCE_COLORS: Record<string, { stroke: string; fill: string }> = {
  index:   { stroke: 'rgba(34,197,94,0.92)',  fill: 'rgba(34,197,94,0.18)' },
  fingers: { stroke: 'rgba(234,179,8,0.92)',  fill: 'rgba(234,179,8,0.18)' },
  palm:    { stroke: 'rgba(227,59,54,0.92)',  fill: 'rgba(227,59,54,0.18)' },
};

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private songManager: SongManager;
  private selectedChordIndex = 0;
  private currentChordName = 'A';
  private flashAlpha = 0;
  private flashChord: string | null = null;
  private pulse = 0;
  private particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];
  private mode: 'free' | 'story' = 'free';
  private inputMode: 'joystick' | 'webcam' = 'joystick';
  private handPointers: HandPointerState[] = [];
  private wheelShifts = [0, 0];

  constructor(canvas: HTMLCanvasElement, songManager: SongManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.songManager = songManager;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.render();
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setSelectedChord(index: number): void {
    this.selectedChordIndex = Math.max(0, Math.min(index, ROOT_NAMES.length - 1));
  }

  setCurrentChordName(name: string): void {
    this.currentChordName = name;
  }

  triggerFlash(chord?: string): void {
    this.flashAlpha = 0.22;
    this.flashChord = chord ?? null;
    this.pulse = 1;
    this.spawnParticles();
  }

  setMode(mode: 'free' | 'story'): void {
    this.mode = mode;
  }

  setInputMode(mode: 'joystick' | 'webcam'): void {
    this.inputMode = mode;
  }

  setHandPointers(states: HandPointerState[]): void {
    this.handPointers = states;
    for (const hand of states) {
      if (hand.visible) this.wheelShifts[hand.wheel] = hand.shift;
    }
  }

  getCurrentChordName(): string | null {
    return this.mode === 'story'
      ? this.songManager.getCurrentChord()
      : this.currentChordName;
  }

  private spawnParticles(): void {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const colors = ['#e33b36', '#ff6b5a', '#ff9a8b', '#ffc4b8', '#ffffff'];

    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.5;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  private render = (): void => {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const wheelSize = Math.min(260, Math.max(190, Math.min(w, h) * 0.28));
    const wheelX = w * 0.5;
    const wheelY = h * 0.5;
    const wheelRadius = wheelSize * 0.5;

    // Background
    if (this.inputMode === 'webcam') {
      ctx.fillStyle = 'rgba(3, 5, 6, 0.38)';
      ctx.fillRect(0, 0, w, h);
    } else {
      const bg = ctx.createRadialGradient(w * 0.42, h * 0.38, 30, w * 0.42, h * 0.38, Math.max(w, h));
      bg.addColorStop(0, '#111417');
      bg.addColorStop(0.55, '#0a0d10');
      bg.addColorStop(1, '#050607');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Subtle grid lines
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

    if (this.pulse > 0) {
      ctx.save();
      ctx.globalAlpha = this.pulse * 0.2;
      ctx.strokeStyle = '#f2eadc';
      ctx.lineWidth = 2 + this.pulse * 2.5;
      ctx.beginPath();
      ctx.arc(wheelX, wheelY, wheelRadius + 12 + this.pulse * 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      this.pulse *= 0.9;
      if (this.pulse < 0.02) this.pulse = 0;
    }

    // Current chord
    const currentChord = this.mode === 'story'
      ? this.songManager.getCurrentChord()
      : this.currentChordName;

    // Big chord name
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.min(w * 0.22, 190)}px Georgia, serif`;
    ctx.fillStyle = 'rgba(255,248,238,0.08)';
    ctx.fillText(currentChord || '...', w / 2, h * 0.26);

    // Song info (story mode)
    if (this.mode === 'story' && this.songManager.isPlaying()) {
      const songName = this.songManager.getSongName();
      const nextChord = this.songManager.getNextChord();
      const progress = this.songManager.getProgress();

      ctx.font = '600 14px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.fillText(songName, w / 2, h * 0.15);

      ctx.font = '500 15px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.27)';
      ctx.fillText(`next: ${nextChord ?? '—'}`, w / 2, h * 0.68);

      // Progress bar
      const barW = 220;
      const barH = 3;
      const barX = (w - barW) / 2;
      const barY = h * 0.71;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = 'rgba(227, 59, 54, 0.6)';
      ctx.fillRect(barX, barY, barW * progress, barH);
    }

    if (this.inputMode === 'webcam') {
      ctx.clearRect(0, 0, w, h);
      const leftX = w * 0.279;
      const rightX = w * 0.721;
      const centerY = h * 0.5;
      const wheelRadiusWebcam = Math.min(w, h) * 0.19;

      this.drawChordWheel(ctx, leftX, centerY, wheelRadiusWebcam, null, this.getSelectionForWheel(0, leftX, centerY, wheelRadiusWebcam), this.wheelShifts[0]);
      this.drawChordWheel(ctx, rightX, centerY, wheelRadiusWebcam, null, this.getSelectionForWheel(1, rightX, centerY, wheelRadiusWebcam), this.wheelShifts[1]);

      this.drawSideZones(ctx, w, h);

      this.drawShiftLabels(ctx, w, h, wheelRadiusWebcam);

      this.handPointers.filter((hand) => hand.visible).forEach((hand) => {
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
    } else {
      // Radial chord wheel
      this.drawChordWheel(ctx, wheelX, wheelY, wheelRadius, currentChord, this.selectedChordIndex);
    }

    if (this.inputMode !== 'webcam') {
      this.particles = this.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.life -= 0.015;

        if (p.life <= 0) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
        ctx.globalAlpha = p.life * 0.45;
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;

        return true;
      });
    }

    // Instructions
    ctx.font = '12px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.inputMode === 'webcam'
        ? 'point at a note on either wheel · stay on it to sound'
        : 'LS = chord · L2/R2 = b/# · L1/R1 = m/7 · RS hold = sustain',
      w / 2,
      h - 30,
    );

    requestAnimationFrame(this.render);
  };

  private drawChordWheel(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    currentChord: string | null,
    selectedIndex = this.selectedChordIndex,
    shift = 0,
  ): void {
    const wedgeAngle = (Math.PI * 2) / ROOT_NAMES.length;
    const start = -Math.PI / 2;

    ctx.save();
    ctx.translate(cx, cy);

    if (this.flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = 'rgba(227,59,54,0.24)';
      ctx.beginPath();
      ctx.arc(0, 0, radius + 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      this.flashAlpha *= 0.9;
      if (this.flashAlpha < 0.01) this.flashAlpha = 0;
    }

    // Outer ring
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

      // Wedge label
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

      // Selected quality tag
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

      // Small separator mark
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

    // Inner wheel core
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

    // Footer navigation
    ctx.restore();

    const navY = cy + radius + 42;
    const navX = cx - 42;
    ctx.save();
    for (let i = 0; i < ROOT_NAMES.length; i++) {
      const dotX = navX + 24 + i * 12;
      ctx.beginPath();
      ctx.arc(dotX, navY - 3, i === this.selectedChordIndex ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = i === this.selectedChordIndex ? '#fff7f3' : 'rgba(255,255,255,0.26)';
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText('6-chord wheel', navX + 36, navY + 13);
    ctx.restore();

    if (this.flashChord && this.inputMode !== 'webcam') {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fff7f3';
      ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(this.flashChord, cx, cy + radius + 18);
      ctx.restore();
    }
  }

  private getSelectionForWheel(
    wheel: number,
    cx: number,
    cy: number,
    radius: number,
  ): number {
    const hand = this.handPointers.find((item) => item.visible && item.wheel === wheel);
    if (!hand) return -1;

    const x = hand.x * this.canvas.width;
    const y = hand.y * this.canvas.height;
    const dx = x - cx;
    const dy = y - cy;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const normalized = ((angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
    const index = Math.min(Math.floor(normalized * ROOT_NAMES.length), ROOT_NAMES.length - 1);

    return distance >= radius * 0.55 && distance <= radius * 0.95 ? index : -1;
  }

  private drawSideZones(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const zoneW = w * 0.06;

    for (const hand of this.handPointers) {
      if (!hand.visible) continue;
      const half = hand.zoneHalf;
      if (hand.inLeftZone) {
        const isTop = half === 'top';
        ctx.save();
        if (isTop) {
          ctx.fillStyle = 'rgba(59,130,246,0.15)';
          ctx.fillRect(0, 0, zoneW, h / 2);
        } else {
          ctx.fillStyle = 'rgba(34,197,94,0.15)';
          ctx.fillRect(0, h / 2, zoneW, h / 2);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(zoneW, 0);
        ctx.lineTo(zoneW, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(zoneW, h / 2);
        ctx.stroke();
        ctx.font = '700 28px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (isTop) {
          ctx.fillStyle = 'rgba(59,130,246,0.8)';
          ctx.fillText('+', zoneW / 2, h * 0.25);
        } else {
          ctx.fillStyle = 'rgba(34,197,94,0.8)';
          ctx.fillText('\u2212', zoneW / 2, h * 0.75);
        }
        ctx.restore();
      }
      if (hand.inRightZone) {
        const isTop = half === 'top';
        ctx.save();
        if (isTop) {
          ctx.fillStyle = 'rgba(59,130,246,0.15)';
          ctx.fillRect(w - zoneW, 0, zoneW, h / 2);
        } else {
          ctx.fillStyle = 'rgba(34,197,94,0.15)';
          ctx.fillRect(w - zoneW, h / 2, zoneW, h / 2);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w - zoneW, 0);
        ctx.lineTo(w - zoneW, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w - zoneW, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        ctx.font = '700 28px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (isTop) {
          ctx.fillStyle = 'rgba(59,130,246,0.8)';
          ctx.fillText('+', w - zoneW / 2, h * 0.25);
        } else {
          ctx.fillStyle = 'rgba(34,197,94,0.8)';
          ctx.fillText('\u2212', w - zoneW / 2, h * 0.75);
        }
        ctx.restore();
      }
    }
  }

  private drawShiftLabels(ctx: CanvasRenderingContext2D, w: number, h: number, wheelRadius: number): void {
    const leftX = w * 0.279;
    const rightX = w * 0.721;
    const labelY = h * 0.5 + wheelRadius + 28;

    for (const hand of this.handPointers) {
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
}
