const CHORD_NAMES = ['Am', 'F', 'C', 'G', 'D', 'Em'];

export type GamepadCallbacks = {
  onChordSelect: (chord: string, index: number) => void;
  onStrum: (chord: string) => void;
};

export class GamepadManager {
  private callbacks: GamepadCallbacks;
  private active = false;
  private currentChordIndex = 0;
  private prevButtons: boolean[] = [];
  private rafId: number | null = null;

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
    // Left stick X (axis 0) → chord selection
    const axisX = gp.axes[0]; // -1 to 1
    if (axisX !== 0) {
      const normalized = (axisX + 1) / 2; // 0 to 1
      const index = Math.min(Math.floor(normalized * CHORD_NAMES.length), CHORD_NAMES.length - 1);
      if (index !== this.currentChordIndex) {
        this.currentChordIndex = index;
        this.callbacks.onChordSelect(CHORD_NAMES[index], index);
      }
    }

    // L1 (index 4) / R1 (index 5) → strum
    const buttons = Array.from(gp.buttons).map((b) => b.pressed);

    if (buttons[4] && !this.prevButtons[4]) {
      this.strum(gp);
    }
    if (buttons[5] && !this.prevButtons[5]) {
      this.strum(gp);
    }

    this.prevButtons = buttons;
  }

  private strum(gp: Gamepad): void {
    const chord = CHORD_NAMES[this.currentChordIndex];
    this.callbacks.onStrum(chord);

    // Vibration
    if (gp.vibrationActuator) {
      try {
        const va = (gp as any).vibrationActuator;
        if (va && va.playEffect) {
          va.playEffect('strong-rumble', {
            startDelay: 0,
            duration: 100,
            weakMagnitude: 0.5,
            strongMagnitude: 0.3,
          });
        }
      } catch {}
    }
  }

  getCurrentChordIndex(): number {
    return this.currentChordIndex;
  }
}
