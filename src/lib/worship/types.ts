// Worship Pad Pro — shared domain types.
// The module is intentionally decoupled from the drum-pad code so future
// additions (MIDI, Bluetooth pedals, cloud sync, kit marketplace) can plug in
// through the same PadDefinition / Kit contracts.

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

export type LoopMode = "loop" | "one-shot";

/** Synth recipe used by the built-in library (no audio files required). */
export type SynthRecipe = {
  /** Oscillator layers: waveform + detune (cents) + relative gain + octave offset. */
  layers: { type: OscillatorType; detune: number; gain: number; octave: number }[];
  /** Low-pass cutoff in Hz at note C4, scaled with pitch. */
  cutoff: number;
  resonance: number;
  /** Slow filter/amplitude movement to keep the pad alive. */
  lfoRate: number;
  lfoDepth: number;
  /** Subtle noise/air layer amount (0-1). */
  air: number;
};

export type PadAudioSource =
  | { kind: "synth"; recipe: SynthRecipe }
  | { kind: "sample"; blobId: string; loopStart: number; loopEnd: number; trimStart: number; trimEnd: number };

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
  attack: number;      // seconds
  release: number;     // seconds
  speed: number;       // playback rate for samples
};

export const DEFAULT_FX: PadFx = {
  volume: 0.85,
  pan: 0,
  pitch: 0,
  transpose: 0,
  eqLow: 0,
  eqMid: 0,
  eqHigh: 0,
  reverb: 0.45,
  delay: 0.12,
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
  color: string;        // hex/oklch string used for the card gradient
  icon: string;         // lucide icon name
  imageBlobId?: string; // custom cover stored in IndexedDB
  loopMode: LoopMode;
  fx: PadFx;
  source: PadAudioSource;
  builtIn: boolean;
  createdAt: string;
};

export type Kit = {
  id: string;
  name: string;
  description: string;
  color: string;
  coverBlobId?: string;
  padIds: string[];
  createdAt: string;
};

export type WorshipSettings = {
  masterVolume: number;
  crossfade: boolean;
  crossfadeTime: number;
  keepAwake: boolean;
  baseOctave: number;
};

export const DEFAULT_SETTINGS: WorshipSettings = {
  masterVolume: 0.9,
  crossfade: true,
  crossfadeTime: 2.5,
  keepAwake: true,
  baseOctave: 3,
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
