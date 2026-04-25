import { PluckSynth, Reverb, Gain, start as toneStart } from 'tone';

const CHORDS: Record<string, number[]> = {
  Am: [220, 261.63, 329.63],
  F: [174.61, 220, 261.63],
  C: [261.63, 329.63, 392],
  G: [196, 246.94, 293.66],
  D: [293.66, 369.99, 440],
  Em: [164.81, 196, 246.94],
};

export class SynthEngine {
  private synths: PluckSynth[] = [];
  private reverb!: Reverb;
  private gain!: Gain;
  private currentChord: string | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    await toneStart();

    this.reverb = new Reverb({ decay: 2.5, wet: 0.3 }).toDestination();
    this.gain = new Gain(0.8).connect(this.reverb);

    for (let i = 0; i < 6; i++) {
      const synth = new PluckSynth({
        attackNoise: 1.5,
        dampening: 4000,
        resonance: 0.95,
      }).connect(this.gain);
      this.synths.push(synth);
    }

    this.initialized = true;
  }

  playChord(name: string): void {
    if (!this.initialized) return;
    const notes = CHORDS[name];
    if (!notes) return;

    this.stopChord();
    this.currentChord = name;

    notes.forEach((freq, i) => {
      if (this.synths[i]) {
        this.synths[i].triggerAttack(freq);
      }
    });
  }

  stopChord(): void {
    this.synths.forEach((s) => {
      try { s.triggerRelease(); } catch {}
    });
    this.currentChord = null;
  }

  getCurrentChord(): string | null {
    return this.currentChord;
  }

  getAvailableChords(): string[] {
    return Object.keys(CHORDS);
  }

  dispose(): void {
    this.synths.forEach((s) => s.dispose());
    this.reverb?.dispose();
    this.gain?.dispose();
  }
}
