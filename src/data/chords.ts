const NOTE_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export type NoteName = (typeof NOTE_ORDER)[number];
export type ChordQuality = 'major' | 'minor' | 'seventh' | 'suspended';

export type ChordInfo = {
  root: string;
  quality: ChordQuality;
  name: string;
  label: string;
  notes: string[];
};

export const ROOT_NAMES: NoteName[] = ['A', 'D', 'E', 'G', 'C', 'F'];
export const CHORD_NAMES = ROOT_NAMES;

export const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  major: '',
  minor: 'm',
  seventh: '7',
  suspended: 'sus4',
};

const NOTE_INDEX = new Map<NoteName, number>(NOTE_ORDER.map((note, index) => [note, index]));
const FLAT_EQUIVALENTS: Record<NoteName, string> = {
  C: 'B',
  'C#': 'C',
  D: 'Db',
  'D#': 'D',
  E: 'Eb',
  F: 'E',
  'F#': 'F',
  G: 'Gb',
  'G#': 'G',
  A: 'Ab',
  'A#': 'A',
  B: 'Bb',
};

function transpose(note: string, semitones: number): string {
  const match = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return note;

  const [, rawName, rawOctave] = match;
  const name = rawName as NoteName;
  const octave = Number(rawOctave);
  const index = NOTE_INDEX.get(name);
  if (index === undefined) return note;

  const absolute = octave * 12 + index + semitones;
  const wrapped = ((absolute % 12) + 12) % 12;
  const nextOctave = Math.floor(absolute / 12);
  return `${NOTE_ORDER[wrapped]}${nextOctave}`;
}

export function raiseHalfStep(note: NoteName): NoteName {
  const index = NOTE_INDEX.get(note) ?? 0;
  return NOTE_ORDER[(index + 1) % NOTE_ORDER.length];
}

export function lowerHalfStep(note: NoteName): NoteName {
  const index = NOTE_INDEX.get(note) ?? 0;
  return NOTE_ORDER[(index - 1 + NOTE_ORDER.length) % NOTE_ORDER.length];
}

export function transposeNoteName(root: NoteName, semitones: number): string {
  const index = NOTE_INDEX.get(root) ?? 0;
  const shifted = ((index + semitones) % NOTE_ORDER.length + NOTE_ORDER.length) % NOTE_ORDER.length;
  return NOTE_ORDER[shifted];
}

export function formatRootWithAccidental(root: NoteName, accidental: -1 | 0 | 1): string {
  if (accidental === -1) return FLAT_EQUIVALENTS[root];
  if (accidental === 1) return raiseHalfStep(root);
  return root;
}

export function resolveRootNote(root: NoteName, accidental: -1 | 0 | 1): NoteName {
  if (accidental === -1) return lowerHalfStep(root);
  if (accidental === 1) return raiseHalfStep(root);
  return root;
}

function buildVoicing(root: NoteName, quality: ChordQuality): string[] {
  const rootNote = `${root}3`;
  const third = transpose(rootNote, quality === 'minor' ? 3 : 4);
  const fifth = transpose(rootNote, 7);
  const octave = transpose(rootNote, 12);
  const seventh = transpose(rootNote, 10);
  const suspendedFourth = transpose(rootNote, 5);

  switch (quality) {
    case 'minor':
      return [rootNote, third, fifth, octave];
    case 'seventh':
      return [rootNote, third, fifth, seventh];
    case 'suspended':
      return [rootNote, suspendedFourth, fifth, octave];
    default:
      return [rootNote, third, fifth, octave];
  }
}

export function formatChordName(root: string, quality: ChordQuality): string {
  return `${root}${QUALITY_SUFFIX[quality]}`;
}

export function buildChord(root: string, quality: ChordQuality, noteRoot?: NoteName): ChordInfo {
  const resolvedRoot = noteRoot ?? (root as NoteName);
  return {
    root,
    quality,
    name: formatChordName(root, quality),
    label: `${root} ${quality}`,
    notes: buildVoicing(resolvedRoot, quality),
  };
}

export function getChordInfoByName(name: string): ChordInfo | null {
  const rootMatch = [
    ...NOTE_ORDER,
    'Bb',
    'Db',
    'Eb',
    'Gb',
    'Ab',
  ].sort((a, b) => b.length - a.length).find((note) => name.startsWith(note));
  if (!rootMatch) return null;

  const normalizedRoot = ({ Bb: 'A#', Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#' } as const)[rootMatch as 'Bb' | 'Db' | 'Eb' | 'Gb' | 'Ab'] ?? rootMatch;
  const root = normalizedRoot as NoteName;

  const suffix = name.slice(rootMatch.length);
  const quality = (Object.entries(QUALITY_SUFFIX).find(([, value]) => value === suffix)?.[0] ?? 'major') as ChordQuality;
  return buildChord(rootMatch, quality, root);
}
