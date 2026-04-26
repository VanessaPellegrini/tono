import type { NoteName, ChordQuality } from './chords';
import type { AccidentalMode } from './chords';
import { NOTE_ORDER, formatChordName, displayNote } from './chords';

const NOTE_INDEX = new Map<NoteName, number>(NOTE_ORDER.map((note, i) => [note, i]));

export type ScaleType =
  | 'major'
  | 'minor'
  | 'minor_harmonic'
  | 'minor_melodic'
  | 'dorian'
  | 'mixolydian'
  | 'pentatonic_major'
  | 'pentatonic_minor';

export const SCALE_TYPES: { id: ScaleType; label: string }[] = [
  { id: 'major', label: 'Major' },
  { id: 'minor', label: 'Minor' },
  { id: 'minor_harmonic', label: 'Harmonic Minor' },
  { id: 'minor_melodic', label: 'Melodic Minor' },
  { id: 'dorian', label: 'Dorian' },
  { id: 'mixolydian', label: 'Mixolydian' },
  { id: 'pentatonic_major', label: 'Pentatonic Maj' },
  { id: 'pentatonic_minor', label: 'Pentatonic Min' },
];

const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  minor_harmonic: [0, 2, 3, 5, 7, 8, 11],
  minor_melodic: [0, 2, 3, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  pentatonic_major: [0, 2, 4, 7, 9],
  pentatonic_minor: [0, 3, 5, 7, 10],
};

export const CIRCLE_OF_FIFTHS: NoteName[] = [
  'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F',
];

export const DEGREE_SYMBOLS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'] as const;

export type DiatonicChord = {
  degree: number;
  degreeSymbol: string;
  root: NoteName;
  quality: ChordQuality;
  name: string;
};

export function getScaleNotes(root: NoteName, scaleType: ScaleType): NoteName[] {
  const rootIndex = NOTE_INDEX.get(root) ?? 0;
  const intervals = SCALE_INTERVALS[scaleType];
  return intervals.map((interval) => {
    const noteIndex = (rootIndex + interval) % 12;
    return NOTE_ORDER[noteIndex];
  });
}

const MAJOR_QUALITY_MAP: ChordQuality[] = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'];
const MINOR_QUALITY_MAP: ChordQuality[] = ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'];
const HARMONIC_MINOR_QUALITY_MAP: ChordQuality[] = ['minor', 'diminished', 'augmented', 'minor', 'major', 'major', 'diminished'];
const MELODIC_MINOR_QUALITY_MAP: ChordQuality[] = ['minor', 'minor', 'augmented', 'major', 'major', 'diminished', 'diminished'];
const DORIAN_QUALITY_MAP: ChordQuality[] = ['minor', 'minor', 'major', 'major', 'minor', 'diminished', 'major'];
const MIXOLYDIAN_QUALITY_MAP: ChordQuality[] = ['major', 'minor', 'diminished', 'major', 'minor', 'minor', 'major'];

const QUALITY_MAPS: Partial<Record<ScaleType, ChordQuality[]>> = {
  major: MAJOR_QUALITY_MAP,
  minor: MINOR_QUALITY_MAP,
  minor_harmonic: HARMONIC_MINOR_QUALITY_MAP,
  minor_melodic: MELODIC_MINOR_QUALITY_MAP,
  dorian: DORIAN_QUALITY_MAP,
  mixolydian: MIXOLYDIAN_QUALITY_MAP,
};

export function getDiatonicChords(root: NoteName, scaleType: ScaleType, mode: AccidentalMode = 'sharp'): DiatonicChord[] {
  const notes = getScaleNotes(root, scaleType);

  if (notes.length !== 7) {
    const pentatonic = scaleType === 'pentatonic_major' ? MAJOR_QUALITY_MAP : MINOR_QUALITY_MAP;
    return notes.slice(0, 7).map((note, i) => {
      const displayRoot = displayNote(note, mode);
      return {
        degree: i,
        degreeSymbol: DEGREE_SYMBOLS[i] ?? `${i + 1}`,
        root: note,
        quality: pentatonic[i] ?? 'major',
        name: formatChordName(displayRoot, pentatonic[i] ?? 'major'),
      };
    });
  }

  const qualityMap = QUALITY_MAPS[scaleType] ?? MAJOR_QUALITY_MAP;

  return notes.map((note, i) => {
    const displayRoot = displayNote(note, mode);
    return {
      degree: i,
      degreeSymbol: DEGREE_SYMBOLS[i] ?? `${i + 1}`,
      root: note,
      quality: qualityMap[i] ?? 'major',
      name: formatChordName(displayRoot, qualityMap[i] ?? 'major'),
    };
  });
}

export function getScaleLabel(root: NoteName, scaleType: ScaleType): string {
  const type = SCALE_TYPES.find((s) => s.id === scaleType);
  return type ? `${root} ${type.label}` : root;
}
