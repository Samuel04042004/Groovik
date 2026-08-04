// React binding for Worship Pad Pro. Owns library state (built-in + user pads,
// kits, favorites, settings) and mirrors engine playback state into React.

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import * as engine from "./engine";
import { BUILTIN_PADS } from "./library";
import {
  bufferToDataUrl,
  dataUrlToBuffer,
  deleteBlob,
  getBlob,
  loadFavorites,
  loadKits,
  loadSettings,
  loadUserPads,
  putBlob,
  saveFavorites,
  saveKits,
  saveSettings,
  saveUserPads,
} from "./store";
import type { Favorites, Kit, KitBundleV1, PadDefinition, WorshipSettings } from "./types";

export function useEngineState() {
  const active = useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => activeSnapshotKey,
    () => "",
  );
  // `active` is only a version token; read the real list on each render.
  void active;
  return engine.getActive();
}

let activeSnapshotKey = "";
engine.subscribe(() => {
  activeSnapshotKey = engine
    .getActive()
    .map((a) => `${a.padId}:${a.midi}`)
    .sort()
    .join("|");
});

export function useWorship() {
  const [userPads, setUserPads] = useState<PadDefinition[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [favorites, setFavorites] = useState<Favorites>({ pads: [], kits: [] });
  const [settings, setSettings] = useState<WorshipSettings>(loadSettings());
  const activeVoices = useEngineState();

  useEffect(() => {
    setUserPads(loadUserPads());
    setKits(loadKits());
    setFavorites(loadFavorites());
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    engine.setMasterVolume(settings.masterVolume);
  }, [settings.masterVolume]);

  const pads = useMemo(() => [...BUILTIN_PADS, ...userPads], [userPads]);

  const persistPads = useCallback((next: PadDefinition[]) => {
    setUserPads(next);
    saveUserPads(next);
  }, []);

  const persistKits = useCallback((next: Kit[]) => {
    setKits(next);
    saveKits(next);
  }, []);

  const upsertPad = useCallback(
    (pad: PadDefinition) => {
      const next = userPads.some((p) => p.id === pad.id)
        ? userPads.map((p) => (p.id === pad.id ? pad : p))
        : [...userPads, pad];
      persistPads(next);
    },
    [userPads, persistPads],
  );

  const removePad = useCallback(
    async (padId: string) => {
      engine.stopPad(padId, 0.3);
      const pad = userPads.find((p) => p.id === padId);
      if (pad?.source.kind === "sample") await deleteBlob(pad.source.blobId).catch(() => void 0);
      if (pad?.imageBlobId) await deleteBlob(pad.imageBlobId).catch(() => void 0);
      persistPads(userPads.filter((p) => p.id !== padId));
      persistKits(kits.map((k) => ({ ...k, padIds: k.padIds.filter((id) => id !== padId) })));
    },
    [userPads, kits, persistPads, persistKits],
  );

  const upsertKit = useCallback(
    (kit: Kit) => {
      const next = kits.some((k) => k.id === kit.id)
        ? kits.map((k) => (k.id === kit.id ? kit : k))
        : [...kits, kit];
      persistKits(next);
    },
    [kits, persistKits],
  );

  const removeKit = useCallback(
    (kitId: string) => persistKits(kits.filter((k) => k.id !== kitId)),
    [kits, persistKits],
  );

  const toggleFavPad = useCallback(
    (padId: string) => {
      const next = {
        ...favorites,
        pads: favorites.pads.includes(padId)
          ? favorites.pads.filter((p) => p !== padId)
          : [...favorites.pads, padId],
      };
      setFavorites(next);
      saveFavorites(next);
    },
    [favorites],
  );

  const toggleFavKit = useCallback(
    (kitId: string) => {
      const next = {
        ...favorites,
        kits: favorites.kits.includes(kitId)
          ? favorites.kits.filter((k) => k !== kitId)
          : [...favorites.kits, kitId],
      };
      setFavorites(next);
      saveFavorites(next);
    },
    [favorites],
  );

  const updateSettings = useCallback((patch: Partial<WorshipSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  /* --------------------------- export / import --------------------------- */

  const exportKit = useCallback(
    async (kit: Kit) => {
      const kitPads = kit.padIds
        .map((id) => pads.find((p) => p.id === id))
        .filter((p): p is PadDefinition => !!p);
      const blobs: Record<string, string> = {};
      const ids = new Set<string>();
      if (kit.coverBlobId) ids.add(kit.coverBlobId);
      kitPads.forEach((p) => {
        if (p.imageBlobId) ids.add(p.imageBlobId);
        if (p.source.kind === "sample") ids.add(p.source.blobId);
      });
      for (const id of ids) {
        const entry = await getBlob(id);
        if (entry) blobs[id] = await bufferToDataUrl(entry.data, entry.type);
      }
      const bundle: KitBundleV1 = {
        format: "groovik.worship.kit",
        version: 1,
        exportedAt: new Date().toISOString(),
        kit,
        pads: kitPads,
        blobs,
      };
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(bundle)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kit.name.replace(/[^\w-]+/g, "-").toLowerCase()}.groovikkit.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [pads],
  );

  const importKit = useCallback(
    async (file: File) => {
      const bundle = JSON.parse(await file.text()) as KitBundleV1;
      if (bundle.format !== "groovik.worship.kit") throw new Error("Arquivo inválido");
      for (const [id, dataUrl] of Object.entries(bundle.blobs ?? {})) {
        const { data, type } = await dataUrlToBuffer(dataUrl);
        await putBlob({ id, type, name: id, data });
      }
      const incoming = bundle.pads.filter((p) => !p.builtIn);
      const merged = [...userPads];
      incoming.forEach((p) => {
        const idx = merged.findIndex((m) => m.id === p.id);
        if (idx >= 0) merged[idx] = p;
        else merged.push(p);
      });
      persistPads(merged);
      const kit: Kit = { ...bundle.kit, id: bundle.kit.id };
      persistKits(kits.some((k) => k.id === kit.id) ? kits.map((k) => (k.id === kit.id ? kit : k)) : [...kits, kit]);
      return kit;
    },
    [userPads, kits, persistPads, persistKits],
  );

  return {
    pads,
    userPads,
    kits,
    favorites,
    settings,
    activeVoices,
    upsertPad,
    removePad,
    upsertKit,
    removeKit,
    toggleFavPad,
    toggleFavKit,
    updateSettings,
    exportKit,
    importKit,
  };
}

/** Keeps the screen awake during performance mode (best effort). */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let sentinel: any = null;
    let cancelled = false;
    const request = async () => {
      try {
        sentinel = await (navigator as any).wakeLock.request("screen");
      } catch {
        /* denied or unsupported */
      }
    };
    void request();
    const onVisible = () => {
      if (document.visibilityState === "visible" && !cancelled) void request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      sentinel?.release?.().catch(() => void 0);
    };
  }, [enabled]);
}
