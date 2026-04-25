export interface SongNote {
  time: number;
  string: 0 | 1 | 2 | 3 | 4 | 5;
  fret: number;
  duration: number;
}

export interface Song {
  title: string;
  artist: string;
  bpm: number;
  notes: SongNote[];
}

export class SongManager {
  private currentSong: Song | null = null;
  private startTime = 0;

  load(song: Song): void {
    this.currentSong = song;
    this.startTime = 0;
  }

  play(): void {
    this.startTime = performance.now();
  }

  getActiveNotes(now: number): SongNote[] {
    if (!this.currentSong) return [];
    const elapsed = (now - this.startTime) / 1000;
    return this.currentSong.notes.filter(
      (n) => elapsed >= n.time && elapsed < n.time + n.duration,
    );
  }
}
