export type InputEvent = {
  type: 'chord-select' | 'chord-play' | 'chord-stop';
  chord: string;
  chordIndex?: number;
};

type Listener = (event: InputEvent) => void;

export class InputRouter {
  private listeners: Listener[] = [];
  private gamepadActive = false;

  on(listener: Listener): void {
    this.listeners.push(listener);
  }

  off(listener: Listener): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private emit(event: InputEvent): void {
    this.listeners.forEach((l) => l(event));
  }

  connectGamepad(): void {
    this.gamepadActive = true;
  }

  // Called by GamepadManager
  handleChordSelect(chord: string, index: number): void {
    this.emit({ type: 'chord-select', chord, chordIndex: index });
  }

  handleStrum(chord: string): void {
    this.emit({ type: 'chord-play', chord });
  }

  // Called by HandTracker
  handleHandChordSelect(chord: string, index: number): void {
    if (!this.gamepadActive) {
      this.emit({ type: 'chord-select', chord, chordIndex: index });
    }
  }

  handleHandStrum(chord: string): void {
    if (!this.gamepadActive) {
      this.emit({ type: 'chord-play', chord });
    }
  }

  setGamepadActive(active: boolean): void {
    this.gamepadActive = active;
  }
}
