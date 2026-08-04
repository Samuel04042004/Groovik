// Local-first persistence for Worship Pad Pro.
// Structured data (pads, kits, settings, favorites) lives in localStorage for
// fast synchronous reads; binary assets (audio + images) live in IndexedDB.
// A future cloud-sync layer can mirror the same shapes without UI changes.

import type { Favorites, Kit, PadDefinition, WorshipSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const LS_PADS = "groovik_worship_pads_v1";
const LS_KITS = "groovik_worship_kits_v1";
const LS_SETTINGS = "groovik_worship_settings_v1";
const LS_FAVS = "groovik_worship_favs_v1";

const DB_NAME = "groovik_worship";
const DB_VERSION = 1;
const STORE_BLOBS = "blobs";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

/* ------------------------------- pads ---------------------------------- */

export function loadUserPads(): PadDefinition[] {
  return read<PadDefinition[]>(LS_PADS, []);
}

export function saveUserPads(pads: PadDefinition[]) {
  write(LS_PADS, pads);
}

/* ------------------------------- kits ---------------------------------- */

export function loadKits(): Kit[] {
  return read<Kit[]>(LS_KITS, []);
}

export function saveKits(kits: Kit[]) {
  write(LS_KITS, kits);
}

/* ---------------------------- settings/favs ----------------------------- */

export function loadSettings(): WorshipSettings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<WorshipSettings>>(LS_SETTINGS, {}) };
}

export function saveSettings(s: WorshipSettings) {
  write(LS_SETTINGS, s);
}

export function loadFavorites(): Favorites {
  return read<Favorites>(LS_FAVS, { pads: [], kits: [] });
}

export function saveFavorites(f: Favorites) {
  write(LS_FAVS, f);
}

/* ------------------------------- blobs ---------------------------------- */

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export type StoredBlob = { id: string; type: string; name: string; data: ArrayBuffer };

export async function putBlob(entry: StoredBlob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BLOBS, "readwrite");
    tx.objectStore(STORE_BLOBS).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getBlob(id: string): Promise<StoredBlob | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BLOBS, "readonly");
    const req = tx.objectStore(STORE_BLOBS).get(id);
    req.onsuccess = () => resolve(req.result as StoredBlob | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteBlob(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BLOBS, "readwrite");
    tx.objectStore(STORE_BLOBS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Object URL cache so cover images are not re-created on every render. */
const urlCache = new Map<string, string>();

export async function getBlobUrl(id: string): Promise<string | null> {
  if (urlCache.has(id)) return urlCache.get(id)!;
  const entry = await getBlob(id);
  if (!entry) return null;
  const url = URL.createObjectURL(new Blob([entry.data], { type: entry.type }));
  urlCache.set(id, url);
  return url;
}

export function bufferToDataUrl(data: ArrayBuffer, type: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(new Blob([data], { type }));
  });
}

export async function dataUrlToBuffer(dataUrl: string): Promise<{ data: ArrayBuffer; type: string }> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return { data: await blob.arrayBuffer(), type: blob.type };
}
