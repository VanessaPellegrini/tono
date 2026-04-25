import { PolySynth, Synth } from "tone";

export type Fret = number;
export type StringIndex = 0 | 1 | 2 | 3 | 4 | 5;

export interface NoteEvent {
  string: StringIndex;
  fret: Fret;
  velocity: number;
  duration: string;
}

export class SynthEngine {
  private synth: PolySynth;

  constructor() {
    this.synth = new PolySynth(Synth).toDestination();
  }

  playNote(event: NoteEvent): void {
    const freq = this.fretToFreq(event.string, event.fret);
    this.synth.triggerAttackRelease(freq, event.duration, undefined, event.velocity);
  }

  private fretToFreq(string: StringIndex, fret: Fret): number {
    const openFreqs = [329.63, 246.94, 196.0, 146.83, 110.0, 82.41];
    return openFreqs[string] * Math.pow(2, fret / 12);
  }

  dispose(): void {
    this.synth.dispose();
  }
}
