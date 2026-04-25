import {
  ROOT_NAMES,
  formatChordName,
  formatRootWithAccidental,
  type ChordQuality,
} from '../data/chords';

export type GamepadCallbacks = {
  onChordSelect: (chord: string, index: number) => void;
  onStrum: (chord: string) => void;
  onStrumHoldStart: (chord: string) => void;
  onStrumHoldEnd: (chord: string) => void;
  onDebug?: (state: GamepadDebugState) => void;
};

export type GamepadDebugState = {
  chord: string;
  chordIndex: number;
  quality: ChordQuality;
  sharp: boolean;
  rsHolding: boolean;
  rsX: number;
  rsY: number;
  rsMagnitude: number;
  rsSource: string;
  axes: number[];
  buttons: boolean[];
};

export class GamepadManager {
  private callbacks: GamepadCallbacks;
  private active = false;
  private currentChordIndex = 0;
  private currentQuality: ChordQuality = 'major';
  private currentAccidental: -1 | 0 | 1 = 0;
  private prevAxes: number[] = []; 
  private rsHolding = false;
  private rsSource = 'axes[2]/axes[3]';
  private rafId: number | null = null;
  private readonly deadzone = 0.35;
  private readonly triggerThreshold = 0.5;
  private readonly stickThreshold = 0.4;
  private readonly releaseThreshold = 0.25;

  constructor(callbacks: GamepadCallbacks) {
    this.callbacks = callbacks;
  }

  start(): void {
    this.active = true;
    this.poll();
  }

  stop(): void {
    this.active = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  private poll = (): void => {
    if (!this.active) return;

    const gamepads = navigator.getGamepads();
    for (const gp of gamepads) {
      if (!gp) continue;
      this.processGamepad(gp);
    }

    this.rafId = requestAnimationFrame(this.poll);
  };

  private processGamepad(gp: Gamepad): void {
    // Left stick 2D angle → chord selection around the wheel
    const axisX = gp.axes[0] ?? 0;
    const axisY = gp.axes[1] ?? 0;
    const magnitude = Math.hypot(axisX, axisY);
    if (magnitude > this.deadzone) {
      const angle = Math.atan2(axisY, axisX);
      const normalized = ((angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
      const index = Math.min(Math.floor(normalized * ROOT_NAMES.length), ROOT_NAMES.length - 1);
      if (index !== this.currentChordIndex) {
        this.currentChordIndex = index;
        this.emitCurrentChord();
      }
    }

    const buttons = Array.from(gp.buttons).map((b) => b.pressed || b.value >= this.triggerThreshold);

    const nextAccidental: -1 | 0 | 1 = buttons[6]
      ? -1
      : buttons[7] || (gp.axes[5] ?? 0) > this.triggerThreshold
        ? 1
        : 0;
    if (nextAccidental !== this.currentAccidental) {
      this.currentAccidental = nextAccidental;
      this.emitCurrentChord();
    }

    const nextQuality = this.resolveQuality(buttons);
    if (nextQuality !== this.currentQuality) {
      this.currentQuality = nextQuality;
      this.emitCurrentChord();
    }

    // Right stick (RS) hold → strum on release
    const { x: rsX, y: rsY, source: rsSource } = this.readRightStick(gp);
    const { x: prevRsX, y: prevRsY } = this.readRightStickFromAxes(this.prevAxes);
    const rsMagnitude = Math.hypot(rsX, rsY);
    const prevRsMagnitude = Math.hypot(prevRsX, prevRsY);

    if (rsMagnitude > this.stickThreshold && prevRsMagnitude <= this.stickThreshold) {
      this.rsHolding = true;
      this.callbacks.onStrumHoldStart(this.currentChord());
    }

    if (this.rsHolding && rsMagnitude <= this.releaseThreshold && prevRsMagnitude > this.releaseThreshold) {
      this.callbacks.onStrumHoldEnd(this.currentChord());
      this.rsHolding = false;
    }

    this.rsSource = rsSource;

    this.callbacks.onDebug?.({
      chord: this.currentChord(),
      chordIndex: this.currentChordIndex,
      quality: this.currentQuality,
      sharp: this.currentAccidental !== 0,
      rsHolding: this.rsHolding,
      rsX,
      rsY,
      rsMagnitude,
      rsSource: this.rsSource,
      axes: gp.axes.slice(),
      buttons,
    });

    this.prevAxes = gp.axes.slice();
  }

  private resolveQuality(buttons: boolean[]): ChordQuality {
    const l1 = buttons[4];
    const r1 = buttons[5];

    if (l1) return 'minor';
    if (r1) return 'seventh';
    return 'major';
  }

  private emitCurrentChord(): void {
    const baseRoot = ROOT_NAMES[this.currentChordIndex];
    const displayRoot = formatRootWithAccidental(baseRoot, this.currentAccidental);
    this.callbacks.onChordSelect(formatChordName(displayRoot, this.currentQuality), this.currentChordIndex);
  }

  private currentChord(): string {
    const baseRoot = ROOT_NAMES[this.currentChordIndex];
    const displayRoot = formatRootWithAccidental(baseRoot, this.currentAccidental);
    return formatChordName(displayRoot, this.currentQuality);
  }

  private readRightStick(gp: Gamepad): { x: number; y: number; source: string } {
    const pairA = { x: gp.axes[2] ?? 0, y: gp.axes[3] ?? 0, source: 'axes[2]/axes[3]' };
    const pairB = { x: gp.axes[4] ?? 0, y: gp.axes[5] ?? 0, source: 'axes[4]/axes[5]' };
    const magA = Math.hypot(pairA.x, pairA.y);
    const magB = Math.hypot(pairB.x, pairB.y);

    return magB > magA ? pairB : pairA;
  }

  private readRightStickFromAxes(axes: number[]): { x: number; y: number } {
    const pairA = { x: axes[2] ?? 0, y: axes[3] ?? 0 };
    const pairB = { x: axes[4] ?? 0, y: axes[5] ?? 0 };
    const magA = Math.hypot(pairA.x, pairA.y);
    const magB = Math.hypot(pairB.x, pairB.y);

    return magB > magA ? pairB : pairA;
  }

  getCurrentChordIndex(): number {
    return this.currentChordIndex;
  }
}
