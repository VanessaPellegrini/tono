import type { SongManager } from '../song/SongManager';
import { ROOT_NAMES } from '../data/chords';
import type { HandPointerState } from '../input/HandTracker';
import { drawBackground } from './drawBackground';
import { drawChordWheel } from './drawChordWheel';
import { drawSideZones } from './drawSideZones';
import { drawHandPointers } from './drawHandPointers';
import { drawShiftLabels } from './drawShiftLabels';
import { spawnParticles, updateAndDrawParticles } from './particles';
import type { Particle } from './particles';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private songManager: SongManager;
  private selectedChordIndex = 0;
  private currentChordName = 'A';
  private flashAlpha = 0;
  private flashChord: string | null = null;
  private pulse = 0;
  private particles: Particle[] = [];
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
    this.particles.push(...spawnParticles(this.canvas.width / 2, this.canvas.height / 2));
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

  private render = (): void => {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const wheelSize = Math.min(260, Math.max(190, Math.min(w, h) * 0.28));
    const wheelX = w * 0.5;
    const wheelY = h * 0.5;
    const wheelRadius = wheelSize * 0.5;
    const isWebcam = this.inputMode === 'webcam';

    drawBackground(ctx, w, h, isWebcam);

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

    const currentChord = this.mode === 'story'
      ? this.songManager.getCurrentChord()
      : this.currentChordName;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.min(w * 0.22, 190)}px Georgia, serif`;
    ctx.fillStyle = 'rgba(255,248,238,0.08)';
    ctx.fillText(currentChord || '...', w / 2, h * 0.26);

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

      const barW = 220;
      const barH = 3;
      const barX = (w - barW) / 2;
      const barY = h * 0.71;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = 'rgba(227, 59, 54, 0.6)';
      ctx.fillRect(barX, barY, barW * progress, barH);
    }

    if (isWebcam) {
      ctx.clearRect(0, 0, w, h);
      const leftX = w * 0.279;
      const rightX = w * 0.721;
      const centerY = h * 0.5;
      const wheelRadiusWebcam = Math.min(w, h) * 0.19;

      const flashRef = { value: this.flashAlpha };

      drawChordWheel(ctx, leftX, centerY, wheelRadiusWebcam, null, this.getSelectionForWheel(0, leftX, centerY, wheelRadiusWebcam), this.wheelShifts[0], this.selectedChordIndex, true, flashRef, this.flashChord);
      this.flashAlpha = flashRef.value;

      drawChordWheel(ctx, rightX, centerY, wheelRadiusWebcam, null, this.getSelectionForWheel(1, rightX, centerY, wheelRadiusWebcam), this.wheelShifts[1], this.selectedChordIndex, true, flashRef, this.flashChord);
      this.flashAlpha = flashRef.value;

      drawSideZones(ctx, w, h, this.handPointers);
      drawShiftLabels(ctx, w, h, wheelRadiusWebcam, this.handPointers);
      drawHandPointers(ctx, w, h, this.handPointers);
    } else {
      const flashRef = { value: this.flashAlpha };
      drawChordWheel(ctx, wheelX, wheelY, wheelRadius, currentChord, this.selectedChordIndex, 0, this.selectedChordIndex, false, flashRef, this.flashChord);
      this.flashAlpha = flashRef.value;
    }

    if (!isWebcam) {
      this.particles = updateAndDrawParticles(ctx, this.particles);
    }

    ctx.font = '12px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.textAlign = 'center';
    ctx.fillText(
      isWebcam
        ? 'point at a note on either wheel · stay on it to sound'
        : 'LS = chord · L2/R2 = b/# · L1/R1 = m/7 · RS hold = sustain',
      w / 2,
      h - 30,
    );

    requestAnimationFrame(this.render);
  };

  private getSelectionForWheel(wheel: number, cx: number, cy: number, radius: number): number {
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
}
