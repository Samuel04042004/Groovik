// Built-in Worship Pad Pro library. Every preset is fully synthesized, so the
// library works offline with zero downloads and imported samples remain the
// user's own content.

import { DEFAULT_FX, type PadDefinition, type PadFx, type SynthRecipe } from "./types";

function recipe(r: Partial<SynthRecipe>): SynthRecipe {
  return {
    layers: [
      { type: "sawtooth", detune: -7, gain: 0.5, octave: 0 },
      { type: "sawtooth", detune: 7, gain: 0.5, octave: 0 },
      { type: "sine", detune: 0, gain: 0.35, octave: -1 },
    ],
    cutoff: 1200,
    resonance: 0.6,
    lfoRate: 0.12,
    lfoDepth: 320,
    air: 0.08,
    ...r,
  };
}

function fx(o: Partial<PadFx>): PadFx {
  return { ...DEFAULT_FX, ...o };
}

type Seed = Omit<PadDefinition, "createdAt" | "builtIn">;

const SEEDS: Seed[] = [
  {
    id: "builtin-worship-glory",
    name: "Glory",
    description: "Pad quente e envolvente para momentos de adoração.",
    category: "worship",
    tags: ["adoração", "quente", "clássico"],
    color: "#e8862f",
    icon: "Sparkles",
    loopMode: "loop",
    fx: fx({ reverb: 0.6, attack: 2.2, release: 3.2 }),
    source: { kind: "synth", recipe: recipe({ cutoff: 1100 }) },
  },
  {
    id: "builtin-worship-holy",
    name: "Holy Ground",
    description: "Camada suave com brilho contido, ideal para ministração.",
    category: "worship",
    tags: ["ministração", "suave"],
    color: "#d9a441",
    icon: "Flame",
    loopMode: "loop",
    fx: fx({ reverb: 0.7, attack: 3, release: 4 }),
    source: {
      kind: "synth",
      recipe: recipe({
        layers: [
          { type: "triangle", detune: -5, gain: 0.55, octave: 0 },
          { type: "sawtooth", detune: 6, gain: 0.3, octave: 0 },
          { type: "sine", detune: 0, gain: 0.4, octave: -1 },
        ],
        cutoff: 900,
        air: 0.12,
      }),
    },
  },
  {
    id: "builtin-ambient-drift",
    name: "Drift",
    description: "Textura ambiente com movimento lento e infinito.",
    category: "ambient",
    tags: ["textura", "lento"],
    color: "#4c8fd6",
    icon: "Waves",
    loopMode: "loop",
    fx: fx({ reverb: 0.8, delay: 0.3, attack: 4, release: 5 }),
    source: { kind: "synth", recipe: recipe({ cutoff: 800, lfoRate: 0.07, lfoDepth: 520, air: 0.18 }) },
  },
  {
    id: "builtin-ambient-horizon",
    name: "Horizon",
    description: "Ambiência aberta com cauda longa de reverb.",
    category: "ambient",
    tags: ["aberto", "reverb"],
    color: "#5fb7c9",
    icon: "Sunrise",
    loopMode: "loop",
    fx: fx({ reverb: 0.85, delay: 0.25, attack: 3.5, release: 6 }),
    source: { kind: "synth", recipe: recipe({ cutoff: 1500, lfoRate: 0.05, air: 0.22 }) },
  },
  {
    id: "builtin-strings-cinema",
    name: "Cordas Sustentadas",
    description: "Naipe de cordas em nota longa, com vibrato natural.",
    category: "strings",
    tags: ["orquestra", "cordas"],
    color: "#b06a8e",
    icon: "Music4",
    loopMode: "loop",
    fx: fx({ reverb: 0.55, attack: 1.4, release: 2.2 }),
    source: {
      kind: "synth",
      recipe: recipe({
        layers: [
          { type: "sawtooth", detune: -10, gain: 0.45, octave: 0 },
          { type: "sawtooth", detune: 10, gain: 0.45, octave: 0 },
          { type: "sawtooth", detune: 0, gain: 0.25, octave: 1 },
        ],
        cutoff: 2200,
        lfoRate: 4.5,
        lfoDepth: 60,
      }),
    },
  },
  {
    id: "builtin-choir-angelic",
    name: "Coral Angelical",
    description: "Vozes etéreas com formantes suaves.",
    category: "choir",
    tags: ["vozes", "etéreo"],
    color: "#8f7fd6",
    icon: "Users",
    loopMode: "loop",
    fx: fx({ reverb: 0.75, attack: 2.6, release: 3.4, eqHigh: 3 }),
    source: {
      kind: "synth",
      recipe: recipe({
        layers: [
          { type: "triangle", detune: -8, gain: 0.5, octave: 0 },
          { type: "triangle", detune: 8, gain: 0.5, octave: 0 },
          { type: "sine", detune: 3, gain: 0.4, octave: 1 },
        ],
        cutoff: 1700,
        lfoRate: 5.2,
        lfoDepth: 40,
        air: 0.2,
      }),
    },
  },
  {
    id: "builtin-piano-soft",
    name: "Piano Pad",
    description: "Piano com sustain infinito e cauda de reverb.",
    category: "piano-pad",
    tags: ["piano", "sustain"],
    color: "#9aa7b8",
    icon: "Piano",
    loopMode: "loop",
    fx: fx({ reverb: 0.5, attack: 0.4, release: 3 }),
    source: {
      kind: "synth",
      recipe: recipe({
        layers: [
          { type: "sine", detune: 0, gain: 0.6, octave: 0 },
          { type: "triangle", detune: 4, gain: 0.3, octave: 1 },
          { type: "sine", detune: -3, gain: 0.35, octave: -1 },
        ],
        cutoff: 2500,
        lfoRate: 0.2,
        lfoDepth: 120,
      }),
    },
  },
  {
    id: "builtin-synth-analog",
    name: "Analog Warm",
    description: "Synth pad analógico com filtro respirando.",
    category: "synth-pad",
    tags: ["analógico", "vintage"],
    color: "#d2685a",
    icon: "AudioWaveform",
    loopMode: "loop",
    fx: fx({ reverb: 0.4, delay: 0.2, attack: 1.2, release: 2 }),
    source: { kind: "synth", recipe: recipe({ cutoff: 1300, resonance: 3, lfoRate: 0.25, lfoDepth: 600 }) },
  },
  {
    id: "builtin-organ-hammond",
    name: "Órgão Gospel",
    description: "Órgão com drawbars clássicos, base de igreja.",
    category: "organ-pad",
    tags: ["órgão", "igreja"],
    color: "#c98a3a",
    icon: "Church",
    loopMode: "loop",
    fx: fx({ reverb: 0.45, attack: 0.15, release: 0.6 }),
    source: {
      kind: "synth",
      recipe: recipe({
        layers: [
          { type: "sine", detune: 0, gain: 0.5, octave: 0 },
          { type: "sine", detune: 0, gain: 0.3, octave: 1 },
          { type: "sine", detune: 0, gain: 0.25, octave: -1 },
        ],
        cutoff: 3200,
        lfoRate: 6.2,
        lfoDepth: 25,
        air: 0.03,
      }),
    },
  },
  {
    id: "builtin-cinematic-epic",
    name: "Épico",
    description: "Camada cinematográfica densa para climas fortes.",
    category: "cinematic",
    tags: ["épico", "denso"],
    color: "#7a5cc4",
    icon: "Clapperboard",
    loopMode: "loop",
    fx: fx({ reverb: 0.7, delay: 0.3, attack: 2.8, release: 4.5, eqLow: 4 }),
    source: {
      kind: "synth",
      recipe: recipe({
        layers: [
          { type: "sawtooth", detune: -12, gain: 0.45, octave: -1 },
          { type: "sawtooth", detune: 12, gain: 0.45, octave: 0 },
          { type: "square", detune: 0, gain: 0.18, octave: 0 },
        ],
        cutoff: 900,
        lfoRate: 0.09,
        lfoDepth: 700,
      }),
    },
  },
  {
    id: "builtin-atmosphere-air",
    name: "Atmosfera",
    description: "Ar e ruído tonal para preencher silêncios.",
    category: "atmosphere",
    tags: ["ar", "textura"],
    color: "#6fb5a0",
    icon: "Wind",
    loopMode: "loop",
    fx: fx({ reverb: 0.9, delay: 0.35, attack: 5, release: 6 }),
    source: { kind: "synth", recipe: recipe({ cutoff: 1900, air: 0.45, lfoRate: 0.04, lfoDepth: 400 }) },
  },
  {
    id: "builtin-soft-velvet",
    name: "Velvet",
    description: "Soft pad discreto para leitura bíblica e oração.",
    category: "soft-pad",
    tags: ["oração", "discreto"],
    color: "#a8c0d8",
    icon: "Feather",
    loopMode: "loop",
    fx: fx({ volume: 0.7, reverb: 0.6, attack: 3.5, release: 4.5, eqHigh: -3 }),
    source: {
      kind: "synth",
      recipe: recipe({
        layers: [
          { type: "sine", detune: -4, gain: 0.55, octave: 0 },
          { type: "triangle", detune: 4, gain: 0.35, octave: 0 },
          { type: "sine", detune: 0, gain: 0.3, octave: -1 },
        ],
        cutoff: 700,
        air: 0.05,
      }),
    },
  },
  {
    id: "builtin-dark-abyss",
    name: "Abyss",
    description: "Dark pad grave e tenso para momentos dramáticos.",
    category: "dark-pad",
    tags: ["grave", "tenso"],
    color: "#5a5f7a",
    icon: "Moon",
    loopMode: "loop",
    fx: fx({ reverb: 0.65, attack: 3, release: 5, eqLow: 5, eqHigh: -5 }),
    source: {
      kind: "synth",
      recipe: recipe({
        layers: [
          { type: "sawtooth", detune: -14, gain: 0.5, octave: -1 },
          { type: "square", detune: 9, gain: 0.22, octave: -1 },
          { type: "sine", detune: 0, gain: 0.4, octave: -2 },
        ],
        cutoff: 520,
        resonance: 4,
        lfoRate: 0.06,
        lfoDepth: 260,
      }),
    },
  },
  {
    id: "builtin-gospel-chops",
    name: "Gospel Keys",
    description: "Base gospel encorpada para trocas rápidas de acordes.",
    category: "gospel",
    tags: ["gospel", "acordes"],
    color: "#e0b23c",
    icon: "Star",
    loopMode: "loop",
    fx: fx({ reverb: 0.5, delay: 0.18, attack: 0.6, release: 1.8 }),
    source: {
      kind: "synth",
      recipe: recipe({
        layers: [
          { type: "triangle", detune: -6, gain: 0.5, octave: 0 },
          { type: "sawtooth", detune: 6, gain: 0.28, octave: 0 },
          { type: "sine", detune: 0, gain: 0.45, octave: -1 },
        ],
        cutoff: 2000,
        lfoRate: 0.3,
        lfoDepth: 200,
      }),
    },
  },
];

export const BUILTIN_PADS: PadDefinition[] = SEEDS.map((s) => ({
  ...s,
  builtIn: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}));
