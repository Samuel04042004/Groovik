// Worship Pad Pro — shared domain types.
//
// The module is chord-first: the performance surface is a grid of chords
// (root + quality) and each chord slot points at a sampled pad. There is no
// synthesis anywhere in this module — an unmapped chord is simply empty.

export const PAD_CATEGORIES = [
  "worship",
  "ambient",
  "strings",
  "choir",
  "piano-pad",
  "synth-pad",
  "organ-pad",
  "cinematic",
  "atmosphere",
  "soft-pad",
  "dark-pad",
  "gospel",
] as const;

export type PadCategory = (typeof PAD_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<PadCategory, string> = {
  worship: "Worship",
  ambient: "Ambient",
  strings: "Cordas",
  choir: "Coral",
  "piano-pad": "Piano Pad",
  "synth-pad": "Synth Pad",
  "organ-pad": "Órgão",
  cinematic: "Cinematográfico",
  atmosphere: "Atmosfera",
  "soft-pad": "Soft Pad",
  "dark-pad": "Dark Pad",
  gospel: "Gospel",
};

export const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;
export type NoteName = (typeof NOTE_NAMES)[number];

/* ------------------------------- chords -------------------------------- */

export const CHORD_QUALITIES = [
  "maj",
  "min",
  "maj7",
  "min7",
  "dom7",
  "sus2",
  "sus4",
  "add9",
] as const;
export type ChordQuality = (typeof CHORD_QUALITIES)[number];

/** Suffix appended to the root when rendering a chord label (C, Cm, Cmaj7...). */
export const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  maj: "",
  min: "m",
  maj7: "maj7",
  min7: "m7",
  dom7: "7",
  sus2: "sus2",
  sus4: "sus4",
  add9: "add9",
};

export const QUALITY_LABELS: Record<ChordQuality, string> = {
  maj: "Maior",
  min: "Menor",
  maj7: "Maior 7",
  min7: "Menor 7",
  dom7: "Dominante 7",
  sus2: "Sus2",
  sus4: "Sus4",
  add9: "Add9",
};

/** Stable identifier for a chord slot, e.g. `C:min7`. */
export type ChordId = string;

export function chordId(root: NoteName, quality: ChordQuality): ChordId {
  return `${root}:${quality}`;
}

export function chordLabel(root: NoteName, quality: ChordQuality): string {
  return `${root}${QUALITY_SUFFIX[quality]}`;
}

export function parseChordId(id: ChordId): { root: NoteName; quality: ChordQuality } | null {
  const [root, quality] = id.split(":");
  if (!NOTE_NAMES.includes(root as NoteName)) return null;
  if (!CHORD_QUALITIES.includes(quality as ChordQuality)) return null;
  return { root: root as NoteName, quality: quality as ChordQuality };
}

export function chordIdLabel(id: ChordId): string {
  const parsed = parseChordId(id);
  return parsed ? chordLabel(parsed.root, parsed.quality) : id;
}

/** Semitone distance between two roots (0-11), used for optional auto-pitch. */
export function semitonesBetween(from: NoteName, to: NoteName): number {
  const diff = NOTE_NAMES.indexOf(to) - NOTE_NAMES.indexOf(from);
  return diff > 6 ? diff - 12 : diff < -6 ? diff + 12 : diff;
}

/* -------------------------------- pads ---------------------------------- */

export type LoopMode = "loop" | "one-shot";

/**
 * Only real recorded/imported audio is supported. No oscillators, no synthesis:
 * a pad without audio simply cannot exist.
 */
export type PadAudioSource = {
  kind: "sample";
  blobId: string;
  loopStart: number;
  loopEnd: number;
  trimStart: number;
  trimEnd: number;
};

export type PadFx = {
  volume: number;      // 0 - 1.5
  pan: number;         // -1 - 1
  pitch: number;       // fine tune, cents -100..100
  transpose: number;   // semitones -24..24
  eqLow: number;       // dB -18..18
  eqMid: number;
  eqHigh: number;
  reverb: number;      // 0-1 send
  delay: number;       // 0-1 send
  delayTime: number;   // seconds
  attack: number;      // seconds (fade in)
  release: number;     // seconds (fade out)
  speed: number;       // playback rate
};

export const DEFAULT_FX: PadFx = {
  volume: 0.85,
  pan: 0,
  pitch: 0,
  transpose: 0,
  eqLow: 0,
  eqMid: 0,
  eqHigh: 0,
  reverb: 0.35,
  delay: 0.1,
  delayTime: 0.42,
  attack: 1.6,
  release: 2.4,
  speed: 1,
};

export type PadDefinition = {
  id: string;
  name: string;
  description: string;
  category: PadCategory;
  tags: string[];
  color: string;        // hex string used for the card / button gradient
  icon: string;         // lucide icon name
  imageBlobId?: string; // custom cover stored in IndexedDB
  loopMode: LoopMode;
  fx: PadFx;
  source: PadAudioSource;
  builtIn: boolean;
  createdAt: string;
};

/* -------------------------------- kits ---------------------------------- */

export type Kit = {
  id: string;
  name: string;
  description: string;
  color: string;
  coverBlobId?: string;
  /** chordId -> padId. Missing entries are empty slots. */
  chordMap: Record<ChordId, string>;
  createdAt: string;
};

export function emptyKit(name = "Novo kit"): Kit {
  return {
    id: crypto.randomUUID(),
    name,
    description: "",
    color: "#f59e0b",
    chordMap: {},
    createdAt: new Date().toISOString(),
  };
}

export type WorshipSettings = {
  masterVolume: number;
  crossfade: boolean;
  crossfadeTime: number;
  keepAwake: boolean;
  /** Automatically pitch-shift a mapped pad when played from another root. */
  autoPitch: boolean;
  currentKey: NoteName;
  activeKitId: string | null;
};

export const DEFAULT_SETTINGS: WorshipSettings = {
  masterVolume: 0.9,
  crossfade: true,
  crossfadeTime: 2.5,
  keepAwake: true,
  autoPitch: true,
  currentKey: "C",
  activeKitId: null,
};

export type Favorites = { pads: string[]; kits: string[] };

/** Serializable kit bundle used by export / import. */
export type KitBundleV1 = {
  format: "groovik.worship.kit";
  version: 1;
  exportedAt: string;
  kit: Kit;
  pads: PadDefinition[];
  /** blobId -> data URL (images + audio) so a kit is fully self contained. */
  blobs: Record<string, string>;
};
