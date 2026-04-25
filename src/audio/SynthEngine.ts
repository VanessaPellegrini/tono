import { Compressor, Filter, Gain, Reverb, Sampler, now as toneNow, start as toneStart } from 'tone';
import { ROOT_NAMES, getChordInfoByName } from '../data/chords';

export class SynthEngine {
  private sampler!: Sampler;
  private reverb!: Reverb;
  private gain!: Gain;
  private filter!: Filter;
  private compressor!: Compressor;
  private currentChord: string | null = null;
  private currentNotes: string[] = [];
  private initialized = false;

  isReady(): boolean {
    return this.initialized;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await toneStart();

    this.reverb = new Reverb({ decay: 1.7, wet: 0.14 }).toDestination();
    this.compressor = new Compressor({ threshold: -26, ratio: 2.2, attack: 0.005, release: 0.2 });
    this.filter = new Filter({ type: 'lowpass', frequency: 2500, rolloff: -24 });
    this.gain = new Gain(0.95).connect(this.filter);
    this.filter.connect(this.compressor);
    this.compressor.connect(this.reverb);

    this.sampler = new Sampler({
      urls: {
        E2: 'guitar_LowEstring1.mp3',
        A2: 'guitar_Astring.mp3',
        D3: 'guitar_Dstring.mp3',
        G3: 'guitar_Gstring.mp3',
        B3: 'guitar_Bstring.mp3',
        E4: 'guitar_highEstring.mp3',
      },
      baseUrl: 'https://tonejs.github.io/audio/berklee/',
      release: 1.8,
      onload: () => undefined,
    }).connect(this.gain);

    this.initialized = true;
  }

  playChord(name: string, sustain = false): void {
    if (!this.initialized) return;
    const chord = getChordInfoByName(name);
    if (!chord) return;

    this.currentChord = name;
    if (sustain) {
      this.currentNotes.forEach((note) => {
        try { this.sampler.triggerRelease(note, toneNow()); } catch {}
      });
      this.currentNotes = chord.notes;
      chord.notes.forEach((note, i) => {
        this.sampler.triggerAttack(note, toneNow() + i * 0.016, 0.9 - i * 0.05);
      });
      return;
    }

    chord.notes.forEach((note, i) => {
      this.sampler.triggerAttackRelease(note, 0.18, toneNow() + i * 0.016, 0.9 - i * 0.05);
    });
  }

  stopChord(): void {
    this.currentNotes.forEach((note) => {
      try { this.sampler.triggerRelease(note); } catch {}
    });
    this.currentNotes = [];
    this.currentChord = null;
  }

  getCurrentChord(): string | null {
    return this.currentChord;
  }

  getAvailableChords(): string[] {
    return ROOT_NAMES;
  }

  dispose(): void {
    this.sampler?.dispose();
    this.reverb?.dispose();
    this.gain?.dispose();
    this.filter?.dispose();
    this.compressor?.dispose();
  }
}
