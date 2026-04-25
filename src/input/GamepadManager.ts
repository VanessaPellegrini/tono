import { ROOT_NAMES, formatChordName, raiseHalfStep, type ChordQuality } from '../data/chords';

export type GamepadCallbacks = {
  onChordSelect: (chord: string, index: number) => void;
  onStrum: (chord: string) => void;
  onStrumHoldStart: (chord: string) => void;
  onStrumHoldEnd: (chord: string) => void;
};

export class GamepadManager {
  private callbacks: GamepadCallbacks;
  private active = false;
  private currentChordIndex = 0;
  private currentQuality: ChordQuality = 'major';
  private currentSharp = false;
  private prevAxes: number[] = [];
  private rsHolding = false;
  private rafId: number | null = null;
  private readonly deadzone = 0.35;
  private readonly triggerThreshold = 0.5;
  private readonly stickThreshold = 0.7;

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

    const nextSharp = buttons[6] || (gp.axes[4] ?? 0) > this.triggerThreshold;
    if (nextSharp !== this.currentSharp) {
      this.currentSharp = nextSharp;
      this.emitCurrentChord();
    }

    const nextQuality = this.resolveQuality(buttons);
    if (nextQuality !== this.currentQuality) {
      this.currentQuality = nextQuality;
      this.emitCurrentChord();
    }

    // Right stick (RS) hold → strum on release
    const rsX = gp.axes[2] ?? 0;
    const rsY = gp.axes[3] ?? 0;
    const prevRsX = this.prevAxes[2] ?? 0;
    const prevRsY = this.prevAxes[3] ?? 0;
    const rsMagnitude = Math.hypot(rsX, rsY);
    const prevRsMagnitude = Math.hypot(prevRsX, prevRsY);

    if (rsMagnitude > this.stickThreshold && prevRsMagnitude <= this.stickThreshold) {
      this.rsHolding = true;
      this.callbacks.onStrumHoldStart(this.currentChord());
    }

    if (this.rsHolding && rsMagnitude <= this.stickThreshold && prevRsMagnitude > this.stickThreshold) {
      this.callbacks.onStrumHoldEnd(this.currentChord());
      this.rsHolding = false;
    }

    this.prevAxes = gp.axes.slice();
  }

  private resolveQuality(buttons: boolean[]): ChordQuality {
    const l1 = buttons[4];
    const r1 = buttons[5];
    const r2 = buttons[7];

    if (l1) return 'seventh';
    if (r1) return 'suspended';
    if (r2) return 'minor';
    return 'major';
  }

  private emitCurrentChord(): void {
    const baseRoot = ROOT_NAMES[this.currentChordIndex];
    const root = this.currentSharp ? raiseHalfStep(baseRoot) : baseRoot;
    this.callbacks.onChordSelect(formatChordName(root, this.currentQuality), this.currentChordIndex);
  }

  private currentChord(): string {
    const baseRoot = ROOT_NAMES[this.currentChordIndex];
    const root = this.currentSharp ? raiseHalfStep(baseRoot) : baseRoot;
    return formatChordName(root, this.currentQuality);
  }

  getCurrentChordIndex(): number {
    return this.currentChordIndex;
  }
}
