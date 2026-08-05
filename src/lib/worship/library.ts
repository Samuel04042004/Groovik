// Worship Pad Pro — default library.
//
// Audio quality is prioritized over quantity: this module never ships
// synthesized/oscillator pads. Until the user imports real sampled ambient
// pads (or records them), the library is empty and chord slots stay empty.

import type { PadDefinition } from "./types";

export const BUILTIN_PADS: PadDefinition[] = [];

/** Suggested colors for new user pads, cycled in the editor. */
export const PAD_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#a855f7",
  "#10b981",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#eab308",
];

export const PAD_ICONS = [
  "Waves", "Sparkles", "Church", "Music4", "CloudMoon", "Sunrise", "Piano", "Mic2",
];
