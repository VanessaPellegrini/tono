export interface SongStep {
  chord: string;
  duration: number; // seconds
}

export interface Song {
  name: string;
  artist: string;
  steps: SongStep[];
}

export class SongManager {
  private song: Song | null = null;
  private playing = false;
  private currentStep = 0;
  private elapsed = 0;
  private lastTime = 0;
  private rafId: number | null = null;
  private onChordChange: ((chord: string) => void) | null = null;

  loadSong(song: Song): void {
    this.song = song;
    this.currentStep = 0;
    this.elapsed = 0;
    this.playing = false;
  }

  setOnChordChange(cb: (chord: string) => void): void {
    this.onChordChange = cb;
  }

  play(): void {
    if (!this.song) return;
    this.playing = true;
    this.lastTime = performance.now();
    this.announceChord();
    this.tick();
  }

  pause(): void {
    this.playing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  stop(): void {
    this.pause();
    this.currentStep = 0;
    this.elapsed = 0;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getCurrentChord(): string | null {
    return this.song?.steps[this.currentStep]?.chord ?? null;
  }

  getNextChord(): string | null {
    if (!this.song) return null;
    const next = (this.currentStep + 1) % this.song.steps.length;
    return this.song.steps[next]?.chord ?? null;
  }

  getProgress(): number {
    if (!this.song || this.song.steps.length === 0) return 0;
    return this.currentStep / this.song.steps.length;
  }

  getSongName(): string {
    return this.song?.name ?? '';
  }

  private tick = (): void => {
    if (!this.playing || !this.song) return;

    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this.elapsed += delta;

    const step = this.song.steps[this.currentStep];
    if (this.elapsed >= step.duration) {
      this.elapsed = 0;
      this.currentStep = (this.currentStep + 1) % this.song.steps.length;
      this.announceChord();
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  private announceChord(): void {
    const chord = this.getCurrentChord();
    if (chord && this.onChordChange) {
      this.onChordChange(chord);
    }
  }
}
