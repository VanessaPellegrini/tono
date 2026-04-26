export type InputMode = 'joystick' | 'webcam';
export type InstrumentMode = 'guitar' | 'piano';

type Listener = () => void;

class AppState {
  private inputMode: InputMode = 'joystick';
  private instrumentMode: InstrumentMode = 'guitar';
  private selectedChordIndex = 0;
  private currentChordName = 'A';
  private listeners = new Set<Listener>();

  get mode(): InputMode {
    return this.inputMode;
  }

  get instrument(): InstrumentMode {
    return this.instrumentMode;
  }

  get chordIndex(): number {
    return this.selectedChordIndex;
  }

  get chordName(): string {
    return this.currentChordName;
  }

  setMode(mode: InputMode): void {
    if (this.inputMode === mode) return;
    this.inputMode = mode;
    this.notify();
  }

  setInstrument(instrument: InstrumentMode): void {
    if (this.instrumentMode === instrument) return;
    this.instrumentMode = instrument;
    this.notify();
  }

  setChord(index: number, name: string): void {
    this.selectedChordIndex = Math.max(0, index);
    this.currentChordName = name;
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}

export const appState = new AppState();
