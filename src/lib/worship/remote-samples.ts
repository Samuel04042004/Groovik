// Worship Pad Pro — cloud sample storage.
//
// Real MP3 pads (often >20 MB) live in the private `worship-pad-samples`
// bucket, organized per pack: `<userId>/<packSlug>/<file>.mp3`.
// The database only stores the object path — never the audio itself — and the
// audio is downloaded lazily, the first time a chord is played.
//
// No synthesis anywhere: a slot without an uploaded sample stays silent.

import { supabase } from "@/integrations/supabase/client";
import { chordId, NOTE_NAMES, type ChordId, type ChordQuality, type NoteName } from "./types";

export const SAMPLES_BUCKET = "worship-pad-samples";
export const DEFAULT_PACK_SLUG = "worship-pack-01";

export type WorshipSample = {
  id: string;
  pack_slug: string;
  chord_id: ChordId;
  root_note: NoteName;
  quality: ChordQuality;
  file_name: string;
  storage_path: string;
  size_bytes: number;
  content_type: string;
  duration_seconds: number | null;
  created_at: string;
};

/* --------------------------- filename parsing --------------------------- */

/**
 * Extracts the tonality from a sample file name, ignoring everything else.
 *
 *   "PAD C - WORSHIP PAD - NORD WARM PAD - Julio Zoty.mp3"  -> C:maj
 *   "PAD A#m - WORSHIP PAD ... .mp3"                        -> A#:min
 *   "Pad Db - ... .mp3"                                     -> C#:maj
 */
export function parseChordFromFileName(fileName: string): ChordId | null {
  const base = fileName.replace(/\.[a-z0-9]+$/i, "");
  // Token right after the leading "PAD" marker, or the first musical token.
  const tokens = base.split(/[\s_\-–—]+/).filter(Boolean);
  const start = tokens.findIndex((t) => /^pad$/i.test(t));
  const candidates = start >= 0 ? tokens.slice(start + 1) : tokens;

  for (const raw of [...candidates, ...tokens]) {
    const parsed = parseToken(raw);
    if (parsed) return parsed;
  }
  return null;
}

const FLAT_TO_SHARP: Record<string, NoteName> = {
  Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#",
};

function parseToken(token: string): ChordId | null {
  const m = /^([A-Ga-g])([#b♯♭]?)(m|min|menor)?$/.exec(token.trim());
  if (!m) return null;
  const letter = m[1].toUpperCase();
  const accidental = (m[2] ?? "").replace("♯", "#").replace("♭", "b");
  let root: NoteName | undefined;
  if (accidental === "b") {
    root = FLAT_TO_SHARP[`${letter}b`];
    if (!root) root = NOTE_NAMES[(NOTE_NAMES.indexOf(letter as NoteName) + 11) % 12] as NoteName;
  } else {
    const name = `${letter}${accidental === "#" ? "#" : ""}`;
    root = NOTE_NAMES.includes(name as NoteName) ? (name as NoteName) : undefined;
  }
  if (!root) return null;
  const quality: ChordQuality = m[3] ? "min" : "maj";
  return chordId(root, quality);
}

export function chordParts(id: ChordId): { root: NoteName; quality: ChordQuality } {
  const [root, quality] = id.split(":");
  return { root: root as NoteName, quality: quality as ChordQuality };
}

/* ------------------------------ catalogue ------------------------------- */

export async function listSamples(packSlug?: string): Promise<WorshipSample[]> {
  let q = supabase
    .from("worship_pad_samples")
    .select("*")
    .order("created_at", { ascending: true });
  if (packSlug) q = q.eq("pack_slug", packSlug);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as WorshipSample[];
}

export async function deleteSample(sample: WorshipSample): Promise<void> {
  await supabase.storage.from(SAMPLES_BUCKET).remove([sample.storage_path]);
  const { error } = await supabase.from("worship_pad_samples").delete().eq("id", sample.id);
  if (error) throw error;
  bufferCache.delete(sample.storage_path);
}

/* -------------------------------- upload -------------------------------- */

export type UploadItem = {
  file: File;
  chord: ChordId | null;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  message?: string;
};

export function buildUploadItems(files: File[]): UploadItem[] {
  return files.map((file) => ({
    file,
    chord: parseChordFromFileName(file.name),
    status: parseChordFromFileName(file.name) ? "pending" : "error",
    progress: 0,
    message: parseChordFromFileName(file.name)
      ? undefined
      : "Tonalidade não identificada no nome do arquivo",
  }));
}

export const MAX_SAMPLE_BYTES = 100 * 1024 * 1024; // matches the bucket limit

/**
 * Uploads one sample with real progress. `supabase-js` has no progress events,
 * so the upload goes through the Storage REST endpoint via XHR.
 */
export async function uploadSample(
  file: File,
  chord: ChordId,
  packSlug: string,
  onProgress: (pct: number) => void,
): Promise<WorshipSample> {
  if (file.size > MAX_SAMPLE_BYTES) {
    throw new Error("Arquivo maior que 100 MB");
  }
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Entre na sua conta para enviar samples");
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sessão expirada, entre novamente");

  const { root, quality } = chordParts(chord);
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${user.id}/${packSlug}/${root.replace("#", "sharp")}-${quality}-${Date.now()}-${safeName}`;

  const baseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string;
  const url = `${baseUrl}/storage/v1/object/${SAMPLES_BUCKET}/${encodeURI(path)}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("Content-Type", file.type || "audio/mpeg");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(readError(xhr.responseText) ?? `Falha no envio (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Falha de rede durante o envio"));
    xhr.onabort = () => reject(new Error("Envio cancelado"));
    xhr.send(file);
  });

  // Replace any previous sample mapped to the same chord in this pack.
  const { data: previous } = await supabase
    .from("worship_pad_samples")
    .select("id, storage_path")
    .eq("user_id", user.id)
    .eq("pack_slug", packSlug)
    .eq("chord_id", chord)
    .maybeSingle();
  if (previous?.storage_path && previous.storage_path !== path) {
    await supabase.storage.from(SAMPLES_BUCKET).remove([previous.storage_path]);
    bufferCache.delete(previous.storage_path);
  }

  const { data, error } = await supabase
    .from("worship_pad_samples")
    .upsert(
      {
        user_id: user.id,
        pack_slug: packSlug,
        chord_id: chord,
        root_note: root,
        quality,
        file_name: file.name,
        storage_path: path,
        size_bytes: file.size,
        content_type: file.type || "audio/mpeg",
      },
      { onConflict: "user_id,pack_slug,chord_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as unknown as WorshipSample;
}

function readError(body: string): string | null {
  try {
    const j = JSON.parse(body);
    return j.message ?? j.error ?? null;
  } catch {
    return null;
  }
}

/* ----------------------------- lazy download ---------------------------- */

const bufferCache = new Map<string, ArrayBuffer>();
const inflight = new Map<string, Promise<ArrayBuffer | null>>();

/** Downloads a sample on demand. Nothing is prefetched at app startup. */
export async function fetchSampleData(storagePath: string): Promise<ArrayBuffer | null> {
  if (bufferCache.has(storagePath)) return bufferCache.get(storagePath)!;
  if (inflight.has(storagePath)) return inflight.get(storagePath)!;
  const p = (async () => {
    const { data, error } = await supabase.storage.from(SAMPLES_BUCKET).download(storagePath);
    if (error || !data) return null;
    const buf = await data.arrayBuffer();
    bufferCache.set(storagePath, buf);
    return buf;
  })().finally(() => inflight.delete(storagePath));
  inflight.set(storagePath, p);
  return p;
}
