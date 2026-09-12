// React binding for Worship Pad Pro. Owns library state (user pads, kits,
// favorites, settings) and mirrors engine playback state into React.

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import * as engine from "./engine";
import { BUILTIN_PADS } from "./library";
import { loadDefaultPack } from "./default-pack";
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
import type {
  ChordId,
  Favorites,
  Kit,
  KitBundleV1,
  PadDefinition,
  WorshipSettings,
} from "./types";
import { DEFAULT_FX, emptyKit } from "./types";

type RemoteSampleLike = {
  id: string;
  chord_id: string;
  file_name: string;
  storage_path: string;
  created_at: string;
};


let activeSnapshotKey = "";
engine.subscribe(() => {
  activeSnapshotKey = engine
    .getActive()
    .map((a) => `${a.padId}:${a.chordId ?? ""}`)
    .sort()
    .join("|");
});

export function useEngineState() {
  useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => activeSnapshotKey,
    () => "",
  );
  return engine.getActive();
}

/** Legacy kits stored a flat `padIds` list; normalize them to a chord map. */
function normalizeKit(kit: Kit & { padIds?: string[] }): Kit {
  const { padIds, ...rest } = kit;
  return { ...rest, chordMap: kit.chordMap ?? {} };
}

export function useWorship() {
  const [userPads, setUserPads] = useState<PadDefinition[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [defaultPads, setDefaultPads] = useState<PadDefinition[]>([]);
  const [defaultKit, setDefaultKit] = useState<Kit | null>(null);
  const [favorites, setFavorites] = useState<Favorites>({ pads: [], kits: [] });
  const [settings, setSettings] = useState<WorshipSettings>(loadSettings());
  const activeVoices = useEngineState();

  useEffect(() => {
    setUserPads(loadUserPads());
    setKits(loadKits().map(normalizeKit));
    setFavorites(loadFavorites());
    setSettings(loadSettings());
  }, []);

  // Factory pack: only the catalogue is fetched here; the MP3s themselves are
  // downloaded lazily by the engine when a chord is first played.
  useEffect(() => {
    let cancelled = false;
    void loadDefaultPack().then((pack) => {
      if (cancelled || !pack) return;
      setDefaultPads(pack.pads);
      setDefaultKit(pack.kit);
      setSettings((prev) => {
        if (prev.activeKitId) return prev;
        const next = { ...prev, activeKitId: pack.kit.id };
        saveSettings(next);
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    engine.setMasterVolume(settings.masterVolume);
  }, [settings.masterVolume]);

  const pads = useMemo(
    () => [...BUILTIN_PADS, ...defaultPads, ...userPads],
    [defaultPads, userPads],
  );

  /** Local kits plus the read-only factory kit. */
  const allKits = useMemo(
    () => (defaultKit ? [defaultKit, ...kits.filter((k) => k.id !== defaultKit.id)] : kits),
    [defaultKit, kits],
  );

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
      if (pad) await deleteBlob(pad.source.blobId).catch(() => void 0);
      if (pad?.imageBlobId) await deleteBlob(pad.imageBlobId).catch(() => void 0);
      persistPads(userPads.filter((p) => p.id !== padId));
      persistKits(
        kits.map((k) => ({
          ...k,
          chordMap: Object.fromEntries(
            Object.entries(k.chordMap).filter(([, id]) => id !== padId),
          ),
        })),
      );
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

  /** Assigns (or clears, with `padId = null`) the pad used by a chord slot. */
  const assignChord = useCallback(
    (kitId: string, chord: ChordId, padId: string | null) => {
      persistKits(
        kits.map((k) => {
          if (k.id !== kitId) return k;
          const chordMap = { ...k.chordMap };
          if (padId) chordMap[chord] = padId;
          else delete chordMap[chord];
          return { ...k, chordMap };
        }),
      );
    },
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
      const kitPads = [...new Set(Object.values(kit.chordMap))]
        .map((id) => pads.find((p) => p.id === id))
        .filter((p): p is PadDefinition => !!p);
      const blobs: Record<string, string> = {};
      const ids = new Set<string>();
      if (kit.coverBlobId) ids.add(kit.coverBlobId);
      kitPads.forEach((p) => {
        if (p.imageBlobId) ids.add(p.imageBlobId);
        ids.add(p.source.blobId);
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
      const kit = normalizeKit(bundle.kit as Kit);
      persistKits(
        kits.some((k) => k.id === kit.id)
          ? kits.map((k) => (k.id === kit.id ? kit : k))
          : [...kits, kit],
      );
      return kit;
    },
    [userPads, kits, persistPads, persistKits],
  );

  /* --------------------------- cloud samples ----------------------------- */

  /**
   * Mirrors the cloud sample catalogue into local pads + a kit per pack.
   * Only references (storage paths) are stored — audio is fetched lazily by the
   * engine the first time a chord is played.
   */
  const syncRemoteSamples = useCallback(
    (samples: RemoteSampleLike[], packSlug: string, packName: string) => {
      const cloudPads: PadDefinition[] = samples.map((s) => {
        const id = `cloud-${s.id}`;
        const existing = userPads.find((p) => p.id === id);
        return {
          id,
          name: existing?.name ?? s.file_name.replace(/\.[a-z0-9]+$/i, ""),
          description: existing?.description ?? "Sample na nuvem",
          category: existing?.category ?? "worship",
          tags: existing?.tags ?? [],
          color: existing?.color ?? "#f59e0b",
          icon: existing?.icon ?? "Waves",
          loopMode: existing?.loopMode ?? "loop",
          fx: existing?.fx ?? { ...DEFAULT_FX },
          source: {
            kind: "sample" as const,
            blobId: "",
            storagePath: s.storage_path,
            loopStart: 0,
            loopEnd: 0,
            trimStart: 0,
            trimEnd: 0,
          },
          builtIn: false,
          createdAt: existing?.createdAt ?? s.created_at,
        };
      });

      const localOnly = userPads.filter((p) => !p.id.startsWith("cloud-"));
      persistPads([...localOnly, ...cloudPads]);

      const kitId = `cloud-${packSlug}`;
      const chordMap: Record<string, string> = {};
      samples.forEach((s) => {
        chordMap[s.chord_id] = `cloud-${s.id}`;
      });
      const existingKit = kits.find((k) => k.id === kitId);
      const kit: Kit = existingKit
        ? { ...existingKit, chordMap }
        : { ...emptyKit(packName), id: kitId, chordMap };
      persistKits(kits.some((k) => k.id === kitId) ? kits.map((k) => (k.id === kitId ? kit : k)) : [...kits, kit]);
      return kit;
    },
    [userPads, kits, persistPads, persistKits],
  );


  return {
    pads,
    userPads,
    kits: allKits,
    favorites,
    settings,
    activeVoices,
    upsertPad,
    removePad,
    upsertKit,
    removeKit,
    assignChord,
    toggleFavPad,
    toggleFavKit,
    updateSettings,
    exportKit,
    importKit,
    syncRemoteSamples,

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
