import type { SongManager } from '../song/SongManager';
import { ROOT_NAMES } from '../data/chords';

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
    this.flashAlpha = 0.4;
    this.flashChord = chord ?? null;
    this.pulse = 1;
    this.spawnParticles();
  }

  setMode(mode: 'free' | 'story'): void {
    this.mode = mode;
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

    // Flash effect
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(227, 59, 54, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, w, h);
      this.flashAlpha *= 0.92;
      if (this.flashAlpha < 0.01) this.flashAlpha = 0;
    }

    if (this.pulse > 0) {
      ctx.save();
      ctx.globalAlpha = this.pulse * 0.18;
      ctx.strokeStyle = '#f2eadc';
      ctx.lineWidth = 2 + this.pulse * 3;
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

    // Subtle chord halo
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#e33b36';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w * 0.34, h * 0.38, Math.min(w, h) * 0.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

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

    // Radial chord wheel
    this.drawChordWheel(ctx, wheelX, wheelY, wheelRadius, currentChord);

    // Particles
    this.particles = this.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.life -= 0.015;

      if (p.life <= 0) return false;

      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace(')', `,${p.life})`).replace('rgb', 'rgba').replace('#', '');
      // Simple approach for hex colors
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.globalAlpha = 1;

      return true;
    });

    // Instructions
    ctx.font = '12px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.textAlign = 'center';
    ctx.fillText('LS = root · L2 = # · R2 = m · RS hold = sustain', w / 2, h - 30);

    requestAnimationFrame(this.render);
  };

  private drawChordWheel(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    currentChord: string | null,
  ): void {
    const wedgeAngle = (Math.PI * 2) / ROOT_NAMES.length;
    const start = -Math.PI / 2;
    const activeRoot = currentChord ? currentChord.replace(/(sus4|7|m)$/, '') : null;

    ctx.save();
    ctx.translate(cx, cy);

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
      const isSelected = index === this.selectedChordIndex;
      const isActive = activeRoot === root;
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
      ctx.fillText(root, 0, 0);
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
        ctx.fillText(currentChord.slice(root.length) || 'maj', 0, 0);
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

    // Inner strum core
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

    for (let i = -2; i <= 2; i++) {
      const x = i * 5;
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(x, -radius * 0.18);
      ctx.lineTo(x, radius * 0.18);
      ctx.stroke();
    }

    // Center label and hint
    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText('STRUM', 0, radius * 0.02);
    ctx.fillStyle = 'rgba(255,255,255,0.26)';
    ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText('swipe', 0, radius * 0.16);

    // Footer navigation
    ctx.restore();

    const navY = cy + radius + 42;
    const navX = cx - 42;
    ctx.save();
    ctx.font = '700 11px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.fillText('L1', navX - 10, navY);
    ctx.fillText('R1', navX + 84, navY);

    for (let i = 0; i < ROOT_NAMES.length; i++) {
      const dotX = navX + 24 + i * 12;
      ctx.beginPath();
      ctx.arc(dotX, navY - 3, i === this.selectedChordIndex ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = i === this.selectedChordIndex ? '#fff7f3' : 'rgba(255,255,255,0.26)';
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText('wheel', navX + 36, navY + 13);
    ctx.restore();

    if (this.flashChord) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fff7f3';
      ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(this.flashChord, cx, cy + radius + 18);
      ctx.restore();
    }
  }
}
