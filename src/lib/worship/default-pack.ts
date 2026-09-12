// Worship Pad Pro — default sample pack.
//
// The factory pads are the real MP3 files already stored at the ROOT of the
// private `worship-pad-samples` bucket (files uploaded by users live under
// `<userId>/<pack>/...` and are never touched here).
//
// Only the object listing is fetched at startup — the audio itself is
// downloaded lazily by the engine the first time a chord is played, so the app
// never pulls 24 large MP3s at once. No synthesis is used as a fallback.

import { supabase } from "@/integrations/supabase/client";
import { SAMPLES_BUCKET } from "./remote-samples";
import {
  chordId, NOTE_NAMES, DEFAULT_FX, emptyKit,
  type ChordId, type ChordQuality, type Kit, type NoteName, type PadDefinition,
} from "./types";

export const DEFAULT_KIT_ID = "default-worship-pack";
export const DEFAULT_KIT_NAME = "Worship Pads (padrão)";

const FLAT_TO_SHARP: Record<string, NoteName> = {
  DB: "C#", EB: "D#", GB: "F#", AB: "G#", BB: "A#",
};

/** Words that are never chords in the Portuguese file names ("PAD em Am"). */
const STOP_WORDS = new Set(["PAD", "EM", "OU", "DE", "DO", "DA", "E"]);

/**
 * Reads the tonality from a default-pack file name.
 *
 *   "PAD C - WORSHIP PAD - NORD WARM PAD - Julio Zoty.mp3" -> C:maj
 *   "PAD Csharp - ...mp3"                                  -> C#:maj
 *   "PAD em Am - SOFTPAD ...mp3"                           -> A:min
 *   "PAD em (Asharpm) ou (Bbm) - ...mp3"                   -> A#:min
 */
export function parseDefaultPackChord(fileName: string): ChordId | null {
  const base = fileName.replace(/\.[a-z0-9]+$/i, "");
  // Only the first segment carries the tonality; the rest is pack/artist text.
  const head = base.split(/\s+-\s+|_/)[0];
  const tokens = head.split(/[\s()[\]]+/).filter(Boolean);

  for (const raw of tokens) {
    if (STOP_WORDS.has(raw.toUpperCase())) continue;
    const parsed = parseChordToken(raw);
    if (parsed) return parsed;
  }
  return null;
}

function parseChordToken(token: string): ChordId | null {
  const m = /^([A-Ga-g])(sharp|#|♯|flat|b|♭)?(m|min|menor)?$/.exec(token.trim());
  if (!m) return null;
  const letter = m[1].toUpperCase();
  const acc = (m[2] ?? "").toLowerCase();
  let root: NoteName | undefined;

  if (acc === "sharp" || acc === "#" || acc === "♯") {
    const name = `${letter}#`;
    root = NOTE_NAMES.includes(name as NoteName) ? (name as NoteName) : undefined;
  } else if (acc === "flat" || acc === "b" || acc === "♭") {
    root =
      FLAT_TO_SHARP[`${letter}B`] ??
      (NOTE_NAMES[(NOTE_NAMES.indexOf(letter as NoteName) + 11) % 12] as NoteName);
  } else {
    root = letter as NoteName;
  }
  if (!root || !NOTE_NAMES.includes(root)) return null;

  const quality: ChordQuality = m[3] ? "min" : "maj";
  return chordId(root, quality);
}

export type DefaultPack = { pads: PadDefinition[]; kit: Kit };

/** Lists the factory MP3s (metadata only) and maps them onto the 24 chords. */
export async function loadDefaultPack(): Promise<DefaultPack | null> {
  const { data, error } = await supabase.storage.from(SAMPLES_BUCKET).list("", {
    limit: 200,
    sortBy: { column: "name", order: "asc" },
  });
  if (error || !data) return null;

  const files = data.filter((f) => f.id && /\.(mp3|wav|ogg)$/i.test(f.name));
  const pads: PadDefinition[] = [];
  const chordMap: Record<ChordId, string> = {};

  for (const file of files) {
    const chord = parseDefaultPackChord(file.name);
    if (!chord || chordMap[chord]) continue;
    const id = `default-${chord.replace(/[:#]/g, "_")}`;
    pads.push({
      id,
      name: file.name.replace(/\.[a-z0-9]+$/i, ""),
      description: "Sample oficial do Worship Pad Pro",
      category: "worship",
      tags: ["padrão"],
      color: "#f59e0b",
      icon: "Waves",
      loopMode: "loop",
      fx: { ...DEFAULT_FX },
      source: {
        kind: "sample",
        blobId: "",
        storagePath: file.name,
        loopStart: 0,
        loopEnd: 0,
        trimStart: 0,
        trimEnd: 0,
      },
      builtIn: true,
      createdAt: file.created_at ?? new Date().toISOString(),
    });
    chordMap[chord] = id;
  }

  if (pads.length === 0) return null;

  const kit: Kit = {
    ...emptyKit(DEFAULT_KIT_NAME),
    id: DEFAULT_KIT_ID,
    description: "Pads reais incluídos no aplicativo",
    chordMap,
  };
  return { pads, kit };
}
