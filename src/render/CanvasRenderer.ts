import type { SongManager } from '../song/SongManager';
import { ROOT_NAMES } from '../data/chords';
import type { HandPointerState } from '../input/HandTracker';
import { drawBackground } from './drawBackground';
import { drawChordWheel } from './drawChordWheel';
import { drawScaleWheel } from './drawScaleWheel';
import { drawDiatonicWheel } from './drawDiatonicWheel';
import { drawConnection } from './drawConnection';
import { drawHandPointers } from './drawHandPointers';
import { spawnParticles, updateAndDrawParticles } from './particles';
import type { Particle } from './particles';
import type { NoteName, AccidentalMode } from '../data/chords';
import type { ScaleType, DiatonicChord } from '../data/scales';
import type { InputMode } from '../state/AppState';

export interface DualWheelState {
  scaleRoot: NoteName;
  scaleType: ScaleType;
  diatonicChords: DiatonicChord[];
  selectedChordDegree: number;
  scaleLabel: string;
  useFlats: AccidentalMode;
}

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
  private inputMode: InputMode = 'dualwheel';
  private handPointers: HandPointerState[] = [];
  private wheelShifts = [0, 0];
  private hoveredScaleIndex = -1;
  private hoveredChordIndex = -1;
  private connectionAlpha = 0.3;
  private dualWheelState: DualWheelState | null = null;

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
    if (this.inputMode === 'joystick') {
      this.particles.push(...spawnParticles(this.canvas.width / 2, this.canvas.height / 2));
    }
  }

  setMode(mode: 'free' | 'story'): void {
    this.mode = mode;
  }

  setInputMode(mode: InputMode): void {
    this.inputMode = mode;
  }

  setHandPointers(states: HandPointerState[]): void {
    this.handPointers = states;
    for (const hand of states) {
      if (hand.visible) this.wheelShifts[hand.wheel] = hand.shift;
    }
  }

  setHoveredScaleIndex(index: number): void {
    this.hoveredScaleIndex = index;
  }

  setHoveredChordIndex(index: number): void {
    this.hoveredChordIndex = index;
  }

  setDualWheelState(state: DualWheelState | null): void {
    if (state && this.dualWheelState) {
      if (state.scaleRoot !== this.dualWheelState.scaleRoot || state.scaleType !== this.dualWheelState.scaleType) {
        this.connectionAlpha = 0.8;
      }
    }
    this.dualWheelState = state;
  }

  getScaleWheelGeometry(): { cx: number; cy: number; radius: number } | null {
    if (this.inputMode !== 'dualwheel' && this.inputMode !== 'webcam') return null;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const leftX = w * 0.3;
    const centerY = h * 0.5;
    const radius = Math.min(w, h) * 0.15;
    return { cx: leftX, cy: centerY, radius };
  }

  getChordWheelGeometry(): { cx: number; cy: number; radius: number; chordCount: number } | null {
    if (this.inputMode !== 'dualwheel' && this.inputMode !== 'webcam') return null;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const rightX = w * 0.7;
    const centerY = h * 0.5;
    const radius = Math.min(w, h) * 0.2;
    return { cx: rightX, cy: centerY, radius, chordCount: this.dualWheelState?.diatonicChords.length ?? 7 };
  }

  getCurrentChordName(): string | null {
    if ((this.inputMode === 'dualwheel' || this.inputMode === 'webcam') && this.dualWheelState) {
      const chord = this.dualWheelState.diatonicChords[this.dualWheelState.selectedChordDegree];
      return chord?.name ?? null;
    }
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
    const isDualWheel = this.inputMode === 'dualwheel' || this.inputMode === 'webcam';
    const isWebcam = this.inputMode === 'webcam';

    drawBackground(ctx, w, h, this.inputMode);

    if (isDualWheel) {
      const leftX = w * 0.3;
      const rightX = w * 0.7;
      const centerY = h * 0.5;
      const leftRadius = Math.min(w, h) * 0.15;
      const rightRadius = Math.min(w, h) * 0.2;

      if (isWebcam) ctx.clearRect(0, 0, w, h);

      if (this.connectionAlpha > 0.3) {
        this.connectionAlpha *= 0.95;
        if (this.connectionAlpha < 0.3) this.connectionAlpha = 0.3;
      }

      drawConnection(ctx, leftX + leftRadius, rightX - rightRadius, centerY, this.connectionAlpha);

      if (this.dualWheelState) {
        drawScaleWheel(
          ctx, leftX, centerY, leftRadius,
          this.dualWheelState.scaleRoot,
          this.hoveredScaleIndex,
          this.dualWheelState.scaleLabel,
          this.dualWheelState.useFlats,
        );

        const flashRef = { value: this.flashAlpha };
        drawDiatonicWheel(
          ctx, rightX, centerY, rightRadius,
          this.dualWheelState.diatonicChords,
          this.dualWheelState.selectedChordDegree,
          this.hoveredChordIndex,
          this.wheelShifts[1],
          flashRef,
        );
        this.flashAlpha = flashRef.value;
      }

      if (isWebcam) {
        drawHandPointers(ctx, w, h, this.handPointers);
      }
    } else {
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

      const flashRef = { value: this.flashAlpha };
      drawChordWheel(ctx, wheelX, wheelY, wheelRadius, currentChord, this.selectedChordIndex, 0, this.selectedChordIndex, false, flashRef, this.flashChord);
      this.flashAlpha = flashRef.value;

      this.particles = updateAndDrawParticles(ctx, this.particles);
    }

    ctx.font = '12px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.textAlign = 'center';
    ctx.fillText(
      isDualWheel
        ? 'left wheel: select key · right wheel: select chord'
        : 'LS = chord · L2/R2 = b/# · L1/R1 = m/7 · RS hold = sustain',
      w / 2,
      h - 30,
    );

    requestAnimationFrame(this.render);
  };
}
