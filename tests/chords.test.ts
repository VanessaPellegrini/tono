import { describe, it, expect } from 'vitest';
import {
  transposeNoteName,
  raiseHalfStep,
  lowerHalfStep,
  formatRootWithAccidental,
  resolveRootNote,
  getChordInfoByName,
  buildChord,
  ROOT_NAMES,
} from '../src/data/chords';
import type { NoteName } from '../src/data/chords';

describe('transposeNoteName', () => {
  it('returns same note for 0 shift', () => {
    expect(transposeNoteName('A', 0)).toBe('A');
    expect(transposeNoteName('C', 0)).toBe('C');
  });

  it('transposes up by semitones', () => {
    expect(transposeNoteName('A', 1)).toBe('A#');
    expect(transposeNoteName('A', 2)).toBe('B');
    expect(transposeNoteName('A', 3)).toBe('C');
    expect(transposeNoteName('C', 1)).toBe('C#');
    expect(transposeNoteName('C', 7)).toBe('G');
  });

  it('transposes down by semitones', () => {
    expect(transposeNoteName('A', -1)).toBe('G#');
    expect(transposeNoteName('A', -2)).toBe('G');
    expect(transposeNoteName('C', -1)).toBe('B');
    expect(transposeNoteName('C', -3)).toBe('A');
  });

  it('wraps around the octave', () => {
    expect(transposeNoteName('A', 12)).toBe('A');
    expect(transposeNoteName('A', -12)).toBe('A');
    expect(transposeNoteName('B', 1)).toBe('C');
    expect(transposeNoteName('C', -1)).toBe('B');
  });

  it('handles large shifts', () => {
    expect(transposeNoteName('A', 24)).toBe('A');
    expect(transposeNoteName('E', 5)).toBe('A');
    expect(transposeNoteName('E', -7)).toBe('A');
  });
});

describe('raiseHalfStep / lowerHalfStep', () => {
  it('raises A to A#', () => {
    expect(raiseHalfStep('A')).toBe('A#');
  });

  it('wraps B to C', () => {
    expect(raiseHalfStep('B')).toBe('C');
  });

  it('lowers C to B', () => {
    expect(lowerHalfStep('C')).toBe('B');
  });

  it('wraps C to B when lowering', () => {
    expect(lowerHalfStep('C')).toBe('B');
  });
});

describe('formatRootWithAccidental', () => {
  it('returns flat equivalent for -1', () => {
    expect(formatRootWithAccidental('A', -1)).toBe('Ab');
    expect(formatRootWithAccidental('E', -1)).toBe('Eb');
  });

  it('returns sharp equivalent for +1', () => {
    expect(formatRootWithAccidental('A', 1)).toBe('A#');
    expect(formatRootWithAccidental('E', 1)).toBe('F');
  });

  it('returns root for 0', () => {
    expect(formatRootWithAccidental('A', 0)).toBe('A');
  });
});

describe('resolveRootNote', () => {
  it('lowers by half step for -1', () => {
    expect(resolveRootNote('A', -1)).toBe('G#');
    expect(resolveRootNote('C', -1)).toBe('B');
  });

  it('raises by half step for +1', () => {
    expect(resolveRootNote('A', 1)).toBe('A#');
    expect(resolveRootNote('B', 1)).toBe('C');
  });

  it('returns same for 0', () => {
    expect(resolveRootNote('A', 0)).toBe('A');
  });
});

describe('getChordInfoByName', () => {
  it('parses simple major chord', () => {
    const chord = getChordInfoByName('A');
    expect(chord).not.toBeNull();
    expect(chord!.name).toBe('A');
    expect(chord!.quality).toBe('major');
    expect(chord!.notes).toEqual(['A3', 'C#4', 'E4', 'A4']);
  });

  it('parses minor chord', () => {
    const chord = getChordInfoByName('Em');
    expect(chord).not.toBeNull();
    expect(chord!.name).toBe('Em');
    expect(chord!.quality).toBe('minor');
    expect(chord!.notes).toEqual(['E3', 'G3', 'B3', 'E4']);
  });

  it('parses seventh chord', () => {
    const chord = getChordInfoByName('D7');
    expect(chord).not.toBeNull();
    expect(chord!.name).toBe('D7');
    expect(chord!.quality).toBe('seventh');
  });

  it('parses suspended chord', () => {
    const chord = getChordInfoByName('Gsus4');
    expect(chord).not.toBeNull();
    expect(chord!.name).toBe('Gsus4');
    expect(chord!.quality).toBe('suspended');
  });

  it('parses sharp chord', () => {
    const chord = getChordInfoByName('F#m');
    expect(chord).not.toBeNull();
    expect(chord!.name).toBe('F#m');
    expect(chord!.notes).toContain('F#3');
  });

  it('parses flat chord', () => {
    const chord = getChordInfoByName('Bbm');
    expect(chord).not.toBeNull();
    expect(chord!.name).toBe('Bbm');
    expect(chord!.quality).toBe('minor');
  });

  it('returns null for invalid name', () => {
    expect(getChordInfoByName('')).toBeNull();
    expect(getChordInfoByName('X')).toBeNull();
  });
});

describe('buildChord', () => {
  it('builds a major chord with correct voicing', () => {
    const chord = buildChord('C', 'major');
    expect(chord.notes).toEqual(['C3', 'E3', 'G3', 'C4']);
  });

  it('builds a minor chord with minor third', () => {
    const chord = buildChord('A', 'minor');
    expect(chord.notes).toEqual(['A3', 'C4', 'E4', 'A4']);
  });

  it('builds a seventh chord without octave', () => {
    const chord = buildChord('G', 'seventh');
    expect(chord.notes).toHaveLength(4);
    expect(chord.notes[0]).toBe('G3');
  });

  it('builds a suspended chord with fourth', () => {
    const chord = buildChord('D', 'suspended');
    expect(chord.notes).toEqual(['D3', 'G3', 'A3', 'D4']);
  });
});

describe('ROOT_NAMES', () => {
  it('has 6 entries', () => {
    expect(ROOT_NAMES).toHaveLength(6);
  });

  it('contains standard guitar open chords', () => {
    expect(ROOT_NAMES).toContain('A');
    expect(ROOT_NAMES).toContain('D');
    expect(ROOT_NAMES).toContain('E');
    expect(ROOT_NAMES).toContain('G');
    expect(ROOT_NAMES).toContain('C');
    expect(ROOT_NAMES).toContain('F');
  });
});
