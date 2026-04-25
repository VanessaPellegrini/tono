const NOTE_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export type NoteName = (typeof NOTE_ORDER)[number];
export type ChordQuality = 'major' | 'minor' | 'seventh' | 'suspended';

export type ChordInfo = {
  root: NoteName;
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

export function formatChordName(root: NoteName, quality: ChordQuality): string {
  return `${root}${QUALITY_SUFFIX[quality]}`;
}

export function buildChord(root: NoteName, quality: ChordQuality): ChordInfo {
  return {
    root,
    quality,
    name: formatChordName(root, quality),
    label: `${root} ${quality}`,
    notes: buildVoicing(root, quality),
  };
}

export function getChordInfoByName(name: string): ChordInfo | null {
  const root = NOTE_ORDER.find((note) => name.startsWith(note));
  if (!root) return null;

  const suffix = name.slice(root.length);
  const quality = (Object.entries(QUALITY_SUFFIX).find(([, value]) => value === suffix)?.[0] ?? 'major') as ChordQuality;
  return buildChord(root, quality);
}
