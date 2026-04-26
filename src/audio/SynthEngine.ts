import { Compressor, Filter, Gain, Reverb, Sampler, now as toneNow, start as toneStart } from 'tone';
import { ROOT_NAMES, getChordInfoByName } from '../data/chords';

export class SynthEngine {
  private guitarSampler!: Sampler;
  private pianoSampler!: Sampler;
  private reverb!: Reverb;
  private gain!: Gain;
  private filter!: Filter;
  private compressor!: Compressor;
  private currentChord: string | null = null;
  private currentNotes: string[] = [];
  private currentInstrument: 'guitar' | 'piano' = 'guitar';
  private initialized = false;
  private loaded: Record<'guitar' | 'piano', boolean> = { guitar: false, piano: false };

  isReady(): boolean {
    return this.initialized && this.loaded[this.currentInstrument];
  }

  setInstrument(instrument: 'guitar' | 'piano'): void {
    if (this.currentInstrument === instrument) return;
    this.stopChord();
    this.currentInstrument = instrument;
  }

  getInstrument(): 'guitar' | 'piano' {
    return this.currentInstrument;
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

    await Promise.all([
      new Promise<void>((resolve) => {
        this.guitarSampler = new Sampler({
          urls: {
            A2: 'a2_mf_rr1.wav',
            A3: 'a3_mf_rr1.wav',
            A4: 'a4_mf_rr1.wav',
            A5: 'a5_mf_rr1.wav',
            C3: 'c3_mf_rr1.wav',
            C4: 'c4_mf_rr1.wav',
            C5: 'c5_mf_rr1.wav',
            C6: 'c6_mf_rr1.wav',
            E2: 'e2_mf_rr1.wav',
            'D#3': 'eb3_mf_rr1.wav',
            'D#4': 'eb4_mf_rr1.wav',
            'D#5': 'eb5_mf_rr1.wav',
            'F#2': 'gb2_mf_rr1.wav',
            'F#3': 'gb3_mf_rr1.wav',
            'F#4': 'gb4_mf_rr1.wav',
            'F#5': 'gb5_mf_rr1.wav',
            'C#2': 'db2_mf_rr1.wav',
          },
          baseUrl: '/audio/guitar-emily/',
          release: 1.8,
          onload: () => {
            this.loaded.guitar = true;
            resolve();
          },
        }).connect(this.gain);
      }),
      new Promise<void>((resolve) => {
        this.pianoSampler = new Sampler({
          urls: {
            A0: 'A0v10.mp3',
            A1: 'A1v10.mp3',
            A2: 'A2v10.mp3',
            A3: 'A3v10.mp3',
            A4: 'A4v10.mp3',
            A5: 'A5v10.mp3',
            A6: 'A6v10.mp3',
            A7: 'A7v10.mp3',
            C1: 'C1v10.mp3',
            C2: 'C2v10.mp3',
            C3: 'C3v10.mp3',
            C4: 'C4v10.mp3',
            C5: 'C5v10.mp3',
            C6: 'C6v10.mp3',
            C7: 'C7v10.mp3',
            C8: 'C8v10.mp3',
          },
          baseUrl: '/audio/piano-velocity10/',
          release: 1.6,
          onload: () => {
            this.loaded.piano = true;
            resolve();
          },
        }).connect(this.gain);
      }),
    ]);

    this.initialized = true;
  }

  playChord(name: string, sustain = false): void {
    if (!this.initialized) return;
    const chord = getChordInfoByName(name);
    if (!chord) return;

    this.currentChord = name;
    const sampler = this.currentInstrument === 'piano' ? this.pianoSampler : this.guitarSampler;

    if (sustain) {
      this.currentNotes.forEach((note) => {
        try {
          sampler.triggerRelease(note, toneNow());
        } catch {
          /* ignore */
        }
      });
      this.currentNotes = chord.notes;
      chord.notes.forEach((note, i) => {
        sampler.triggerAttack(note, toneNow() + i * 0.016, 0.88 - i * 0.04);
      });
      return;
    }

    chord.notes.forEach((note, i) => {
      sampler.triggerAttackRelease(note, this.currentInstrument === 'piano' ? 0.9 : 0.18, toneNow() + i * 0.016, 0.9 - i * 0.05);
    });
  }

  stopChord(): void {
    this.currentNotes.forEach((note) => {
      try {
        const sampler = this.currentInstrument === 'piano' ? this.pianoSampler : this.guitarSampler;
        sampler.triggerRelease(note);
      } catch {
        /* ignore */
      }
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
    this.guitarSampler?.dispose();
    this.pianoSampler?.dispose();
    this.reverb?.dispose();
    this.gain?.dispose();
    this.filter?.dispose();
    this.compressor?.dispose();
  }
}
