import type { NoteName, AccidentalMode } from '../data/chords';
import { displayNote } from '../data/chords';
import type { ScaleType, DiatonicChord } from '../data/scales';
import { getDiatonicChords, SCALE_TYPES } from '../data/scales';

export type InputMode = 'joystick' | 'dualwheel' | 'webcam';
export type InstrumentMode = 'guitar' | 'piano';

type Listener = () => void;

class AppState {
  private inputMode: InputMode = 'dualwheel';
  private instrumentMode: InstrumentMode = 'piano';
  private selectedChordIndex = 0;
  private currentChordName = 'A';
  private selectedScaleRoot: NoteName = 'C';
  private selectedScaleType: ScaleType = 'major';
  private selectedChordDegree = 0;
  private useFlats: AccidentalMode = 'sharp';
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

  get scaleRoot(): NoteName {
    return this.selectedScaleRoot;
  }

  get scaleType(): ScaleType {
    return this.selectedScaleType;
  }

  get chordDegree(): number {
    return this.selectedChordDegree;
  }

  get diatonicChords(): DiatonicChord[] {
    return getDiatonicChords(this.selectedScaleRoot, this.selectedScaleType, this.useFlats);
  }

  get currentDiatonicChord(): DiatonicChord | null {
    const chords = this.diatonicChords;
    return chords[this.selectedChordDegree] ?? null;
  }

  get scaleLabel(): string {
    const type = SCALE_TYPES.find((s: { id: string }) => s.id === this.selectedScaleType);
    const displayRoot = displayNote(this.selectedScaleRoot, this.useFlats);
    return type ? `${displayRoot} ${type.label}` : displayRoot;
  }

  get isDualWheel(): boolean {
    return this.inputMode === 'dualwheel' || this.inputMode === 'webcam';
  }

  get accidentalMode(): AccidentalMode {
    return this.useFlats;
  }

  setAccidentalMode(mode: AccidentalMode): void {
    if (this.useFlats === mode) return;
    this.useFlats = mode;
    this.notify();
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

  setScaleRoot(root: NoteName): void {
    if (this.selectedScaleRoot === root) return;
    this.selectedScaleRoot = root;
    this.selectedChordDegree = 0;
    this.notify();
  }

  setScaleType(type: ScaleType): void {
    if (this.selectedScaleType === type) return;
    this.selectedScaleType = type;
    this.selectedChordDegree = 0;
    this.notify();
  }

  setChordDegree(degree: number): void {
    this.selectedChordDegree = Math.max(0, degree);
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
