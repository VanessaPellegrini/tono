import { describe, it, expect } from 'vitest';
import {
  getScaleNotes,
  getDiatonicChords,
  getScaleLabel,
  CIRCLE_OF_FIFTHS,
  SCALE_TYPES,
  DEGREE_SYMBOLS,
  type ScaleType,
} from '../src/data/scales';
import { getChordInfoByName, buildChord, QUALITY_SUFFIX, type ChordQuality } from '../src/data/chords';

describe('SCALE_TYPES', () => {
  it('has at least 8 scale types', () => {
    expect(SCALE_TYPES.length).toBeGreaterThanOrEqual(8);
  });

  it('has unique ids', () => {
    const ids = SCALE_TYPES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes major and minor', () => {
    expect(SCALE_TYPES.find((s) => s.id === 'major')).toBeDefined();
    expect(SCALE_TYPES.find((s) => s.id === 'minor')).toBeDefined();
  });
});

describe('CIRCLE_OF_FIFTHS', () => {
  it('has exactly 12 notes', () => {
    expect(CIRCLE_OF_FIFTHS).toHaveLength(12);
  });

  it('starts with C and G', () => {
    expect(CIRCLE_OF_FIFTHS[0]).toBe('C');
    expect(CIRCLE_OF_FIFTHS[1]).toBe('G');
  });

  it('contains all 12 chromatic notes', () => {
    const set = new Set(CIRCLE_OF_FIFTHS);
    expect(set.size).toBe(12);
  });

  it('each successive note is a fifth above', () => {
    const fifthIntervals = [7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5, 0];
    for (let i = 0; i < 12; i++) {
      const from = CIRCLE_OF_FIFTHS[i];
      const to = CIRCLE_OF_FIFTHS[(i + 1) % 12];
      const fromIdx = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].indexOf(from);
      const expected = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][(fromIdx + 7) % 12];
      expect(to).toBe(expected);
    }
  });
});

describe('getScaleNotes', () => {
  it('C major returns C D E F G A B', () => {
    const notes = getScaleNotes('C', 'major');
    expect(notes).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  });

  it('A minor returns A B C D E F G', () => {
    const notes = getScaleNotes('A', 'minor');
    expect(notes).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  });

  it('G major returns G A B C D E F#', () => {
    const notes = getScaleNotes('G', 'major');
    expect(notes).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F#']);
  });

  it('A harmonic minor returns A B C D E F G#', () => {
    const notes = getScaleNotes('A', 'minor_harmonic');
    expect(notes).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G#']);
  });

  it('D dorian returns D E F G A B C', () => {
    const notes = getScaleNotes('D', 'dorian');
    expect(notes).toEqual(['D', 'E', 'F', 'G', 'A', 'B', 'C']);
  });

  it('G mixolydian returns G A B C D E F', () => {
    const notes = getScaleNotes('G', 'mixolydian');
    expect(notes).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('C pentatonic major returns 5 notes', () => {
    const notes = getScaleNotes('C', 'pentatonic_major');
    expect(notes).toEqual(['C', 'D', 'E', 'G', 'A']);
    expect(notes).toHaveLength(5);
  });

  it('A pentatonic minor returns 5 notes', () => {
    const notes = getScaleNotes('A', 'pentatonic_minor');
    expect(notes).toEqual(['A', 'C', 'D', 'E', 'G']);
    expect(notes).toHaveLength(5);
  });
});

describe('getDiatonicChords', () => {
  it('C major returns 7 diatonic chords', () => {
    const chords = getDiatonicChords('C', 'major');
    expect(chords).toHaveLength(7);
    expect(chords[0].name).toBe('C');
    expect(chords[1].name).toBe('Dm');
    expect(chords[2].name).toBe('Em');
    expect(chords[3].name).toBe('F');
    expect(chords[4].name).toBe('G');
    expect(chords[5].name).toBe('Am');
    expect(chords[6].name).toBe('Bdim');
  });

  it('C major chord qualities are correct', () => {
    const chords = getDiatonicChords('C', 'major');
    expect(chords[0].quality).toBe('major');
    expect(chords[1].quality).toBe('minor');
    expect(chords[2].quality).toBe('minor');
    expect(chords[3].quality).toBe('major');
    expect(chords[4].quality).toBe('major');
    expect(chords[5].quality).toBe('minor');
    expect(chords[6].quality).toBe('diminished');
  });

  it('A minor returns correct diatonic chords', () => {
    const chords = getDiatonicChords('A', 'minor');
    expect(chords).toHaveLength(7);
    expect(chords[0].name).toBe('Am');
    expect(chords[1].name).toBe('Bdim');
    expect(chords[2].name).toBe('C');
    expect(chords[3].name).toBe('Dm');
    expect(chords[4].name).toBe('Em');
    expect(chords[5].name).toBe('F');
    expect(chords[6].name).toBe('G');
  });

  it('G major returns correct chords', () => {
    const chords = getDiatonicChords('G', 'major');
    expect(chords[0].name).toBe('G');
    expect(chords[1].name).toBe('Am');
    expect(chords[2].name).toBe('Bm');
    expect(chords[3].name).toBe('C');
    expect(chords[4].name).toBe('D');
    expect(chords[5].name).toBe('Em');
    expect(chords[6].name).toBe('F#dim');
  });

  it('each chord has a degree symbol', () => {
    const chords = getDiatonicChords('C', 'major');
    chords.forEach((chord, i) => {
      expect(chord.degreeSymbol).toBe(DEGREE_SYMBOLS[i]);
      expect(chord.degree).toBe(i);
    });
  });

  it('pentatonic scales return 5 chords', () => {
    const chords = getDiatonicChords('C', 'pentatonic_major');
    expect(chords).toHaveLength(5);
  });
});

describe('getScaleLabel', () => {
  it('returns correct label for C major', () => {
    expect(getScaleLabel('C', 'major')).toBe('C Major');
  });

  it('returns correct label for A minor', () => {
    expect(getScaleLabel('A', 'minor')).toBe('A Minor');
  });

  it('returns correct label for harmonic minor', () => {
    expect(getScaleLabel('D', 'minor_harmonic')).toBe('D Harmonic Minor');
  });
});

describe('DEGREE_SYMBOLS', () => {
  it('has 7 degree symbols', () => {
    expect(DEGREE_SYMBOLS).toHaveLength(7);
  });

  it('starts with I', () => {
    expect(DEGREE_SYMBOLS[0]).toBe('I');
  });

  it('has lowercase ii and iii', () => {
    expect(DEGREE_SYMBOLS[1]).toBe('ii');
    expect(DEGREE_SYMBOLS[2]).toBe('iii');
  });
});

describe('diminished chords', () => {
  it('has dim suffix', () => {
    expect(QUALITY_SUFFIX.diminished).toBe('dim');
  });

  it('buildVoicing for diminished uses minor third and diminished fifth', () => {
    const chord = buildChord('B', 'diminished', 'B');
    expect(chord.notes).toHaveLength(4);
    expect(chord.notes[0]).toBe('B3');
    expect(chord.notes[1]).toBe('D#4');
    expect(chord.notes[2]).toBe('F4');
    expect(chord.notes[3]).toBe('B4');
  });

  it('getChordInfoByName parses diminished chord', () => {
    const info = getChordInfoByName('Bdim');
    expect(info).not.toBeNull();
    expect(info!.quality).toBe('diminished');
    expect(info!.root).toBe('B');
    expect(info!.name).toBe('Bdim');
  });

  it('getChordInfoByName parses other diminished chords', () => {
    const info = getChordInfoByName('F#dim');
    expect(info).not.toBeNull();
    expect(info!.quality).toBe('diminished');
    expect(info!.name).toBe('F#dim');
  });
});
