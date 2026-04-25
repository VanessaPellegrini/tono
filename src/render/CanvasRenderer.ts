import type { SongManager } from '../song/SongManager';

const CHORD_NAMES = ['Am', 'F', 'C', 'G', 'D', 'Em'];

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private songManager: SongManager;
  private selectedChordIndex = 0;
  private flashAlpha = 0;
  private particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];
  private mode: 'free' | 'story' = 'free';

  constructor(canvas: HTMLCanvasElement, _synth: unknown, songManager: SongManager) {
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
    this.selectedChordIndex = index;
  }

  triggerFlash(): void {
    this.flashAlpha = 0.4;
    this.spawnParticles();
  }

  setMode(mode: 'free' | 'story'): void {
    this.mode = mode;
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

    // Background
    ctx.fillStyle = '#0a0a0a';
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

    // Current chord
    const currentChord = this.mode === 'story'
      ? this.songManager.getCurrentChord()
      : CHORD_NAMES[this.selectedChordIndex];

    // Big chord name
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.min(w * 0.25, 200)}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillText(currentChord || '...', w / 2, h * 0.4);

    // Song info (story mode)
    if (this.mode === 'story' && this.songManager.isPlaying()) {
      const songName = this.songManager.getSongName();
      const nextChord = this.songManager.getNextChord();
      const progress = this.songManager.getProgress();

      ctx.font = '14px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(songName, w / 2, h * 0.2);

      ctx.font = '16px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillText(`next: ${nextChord}`, w / 2, h * 0.58);

      // Progress bar
      const barW = 200;
      const barH = 3;
      const barX = (w - barW) / 2;
      const barY = h * 0.62;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = 'rgba(227, 59, 54, 0.6)';
      ctx.fillRect(barX, barY, barW * progress, barH);
    }

    // Chord bar at bottom
    const chordBarY = h - 100;
    const chordSpacing = Math.min(80, (w - 100) / CHORD_NAMES.length);
    const chordStartX = (w - chordSpacing * (CHORD_NAMES.length - 1)) / 2;

    CHORD_NAMES.forEach((chord, i) => {
      const x = chordStartX + i * chordSpacing;
      const isActive = chord === currentChord;
      const isSelected = i === this.selectedChordIndex;

      // Circle
      const radius = isActive ? 22 : isSelected ? 18 : 14;
      ctx.beginPath();
      ctx.arc(x, chordBarY, radius, 0, Math.PI * 2);

      if (isActive) {
        ctx.fillStyle = 'rgba(227, 59, 54, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#e33b36';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (isSelected) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Chord name
      ctx.font = isActive ? 'bold 14px system-ui' : '12px system-ui';
      ctx.fillStyle = isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)';
      ctx.fillText(chord, x, chordBarY + radius + 20);
    });

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
    ctx.font = '12px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.textAlign = 'center';
    ctx.fillText('Gamepad: Left Stick = Chords | L1/R1 = Strum | Hands: Move = Chords | Open = Strum', w / 2, h - 30);

    requestAnimationFrame(this.render);
  };
}
