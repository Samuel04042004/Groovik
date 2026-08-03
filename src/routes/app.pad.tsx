import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getAudioCtx,
  playVoice,
  playSample,
  decodeSample,
  type KitVoice,
  type KitFlavor,
} from "@/lib/drum-audio";
import { listSamples, saveSample, deleteSample, type StoredSample } from "@/lib/sample-store";
import { useProgress } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Upload, Trash2, Zap, Play, Square } from "lucide-react";

export const Route = createFileRoute("/app/pad")({ component: DrumPadPage });

type Pad = { id: string; label: string; voice: KitVoice; key: string; tone: "warm" | "cool" | "gold" };

const BANKS: Record<KitFlavor, { label: string; desc: string; pads: Pad[] }> = {
  acoustic: {
    label: "Kit Acústico",
    desc: "Bateria acústica clássica — caixa worship, toms e pratos.",
    pads: [
      { id: "kick", label: "Bumbo", voice: "kick", key: "1", tone: "warm" },
      { id: "snare", label: "Caixa", voice: "snare", key: "2", tone: "warm" },
      { id: "rim", label: "Aro", voice: "rim", key: "3", tone: "warm" },
      { id: "hihat", label: "Chimbal", voice: "hihat", key: "4", tone: "cool" },
      { id: "openhat", label: "Chimbal aberto", voice: "openhat", key: "q", tone: "cool" },
      { id: "tom-high", label: "Tom agudo", voice: "tom-high", key: "w", tone: "warm" },
      { id: "tom-mid", label: "Tom médio", voice: "tom-mid", key: "e", tone: "warm" },
      { id: "tom-low", label: "Surdo", voice: "tom-low", key: "r", tone: "warm" },
      { id: "crash", label: "Crash", voice: "crash", key: "a", tone: "cool" },
      { id: "ride", label: "Ride", voice: "ride", key: "s", tone: "cool" },
      { id: "clap", label: "Palma", voice: "clap", key: "d", tone: "gold" },
      { id: "shaker", label: "Shaker", voice: "shaker", key: "f", tone: "gold" },
    ],
  },
  electronic: {
    label: "Kit Eletrônico",
    desc: "Sons processados, graves profundos e ataque rápido.",
    pads: [
      { id: "kick", label: "808 Kick", voice: "kick", key: "1", tone: "cool" },
      { id: "sub-drop", label: "Sub Drop", voice: "sub-drop", key: "2", tone: "cool" },
      { id: "snare", label: "Snare", voice: "snare", key: "3", tone: "cool" },
      { id: "clap", label: "Clap", voice: "clap", key: "4", tone: "gold" },
      { id: "hihat", label: "Hat", voice: "hihat", key: "q", tone: "cool" },
      { id: "openhat", label: "Open Hat", voice: "openhat", key: "w", tone: "cool" },
      { id: "rim", label: "Rim", voice: "rim", key: "e", tone: "warm" },
      { id: "tom-low", label: "Low Tom", voice: "tom-low", key: "r", tone: "warm" },
      { id: "tom-mid", label: "Mid Tom", voice: "tom-mid", key: "a", tone: "warm" },
      { id: "tom-high", label: "High Tom", voice: "tom-high", key: "s", tone: "warm" },
      { id: "crash", label: "Crash", voice: "crash", key: "d", tone: "cool" },
      { id: "shaker", label: "Shaker", voice: "shaker", key: "f", tone: "gold" },
    ],
  },
  worship: {
    label: "Worship Pads",
    desc: "Camadas ambientes e percussão suave para ministração.",
    pads: [
      { id: "pad-warm", label: "Pad Quente", voice: "pad-warm", key: "1", tone: "gold" },
      { id: "pad-air", label: "Pad Aéreo", voice: "pad-air", key: "2", tone: "gold" },
      { id: "sub-drop", label: "Sub", voice: "sub-drop", key: "3", tone: "cool" },
      { id: "kick", label: "Bumbo suave", voice: "kick", key: "4", tone: "warm" },
      { id: "snare", label: "Caixa worship", voice: "snare", key: "q", tone: "warm" },
      { id: "rim", label: "Cross stick", voice: "rim", key: "w", tone: "warm" },
      { id: "shaker", label: "Shaker", voice: "shaker", key: "e", tone: "gold" },
      { id: "hihat", label: "Chimbal", voice: "hihat", key: "r", tone: "cool" },
      { id: "ride", label: "Ride bell", voice: "ride", key: "a", tone: "cool" },
      { id: "crash", label: "Swell", voice: "crash", key: "s", tone: "cool" },
      { id: "tom-low", label: "Floor tom", voice: "tom-low", key: "d", tone: "warm" },
      { id: "clap", label: "Palma", voice: "clap", key: "f", tone: "gold" },
    ],
  },
};

const TONES: Record<Pad["tone"], string> = {
  warm: "from-[oklch(0.72_0.19_45/0.22)] to-transparent border-primary/40 text-primary",
  cool: "from-[oklch(0.62_0.18_250/0.22)] to-transparent border-secondary/40 text-secondary",
  gold: "from-[oklch(0.78_0.14_85/0.20)] to-transparent border-border text-foreground",
};

function DrumPadPage() {
  const { recordSession } = useProgress();
  const [bank, setBank] = useState<KitFlavor>("acoustic");
  const [perf, setPerf] = useState(false);
  const [hits, setHits] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const [samples, setSamples] = useState<StoredSample[]>([]);
  const [recording, setRecording] = useState(false);
  const startRef = useRef<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const pads = BANKS[bank].pads;

  useEffect(() => {
    listSamples()
      .then(async (list) => {
        setSamples(list);
        for (const s of list) await decodeSample(s.id, s.data);
      })
      .catch(() => void 0);
  }, []);

  const hit = useCallback(
    (padId: string, voice: KitVoice, custom = false) => {
      getAudioCtx();
      if (custom) playSample(padId);
      else playVoice(voice, bank);
      setHits((h) => h + 1);
      if (!perf) {
        setActive(padId);
        window.setTimeout(() => setActive((a) => (a === padId ? null : a)), 90);
      }
    },
    [bank, perf],
  );

  // Keyboard mapping
  useEffect(() => {
    const map = new Map(pads.map((p) => [p.key, p]));
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const p = map.get(e.key.toLowerCase());
      if (p) {
        e.preventDefault();
        hit(p.id, p.voice);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pads, hit]);

  const toggleRecording = async () => {
    if (!recording) {
      getAudioCtx();
      startRef.current = performance.now();
      setHits(0);
      setRecording(true);
      return;
    }
    setRecording(false);
    const seconds = Math.floor((performance.now() - startRef.current) / 1000);
    const res = await recordSession({
      exercise_type: "drum-pad",
      exercise_id: `pad-${bank}`,
      duration_seconds: seconds,
    });
    if (res) {
      toast.success(`+${res.xp_earned} XP`, { description: `${hits} toques em ${seconds}s` });
    } else {
      toast.info("Sessão muito curta para pontuar.");
    }
  };

  const onImport = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files).slice(0, 12)) {
      try {
        const buf = await file.arrayBuffer();
        const id = `custom-${crypto.randomUUID()}`;
        await decodeSample(id, buf);
        await saveSample({ id, name: file.name.replace(/\.[^.]+$/, ""), data: buf });
      } catch {
        toast.error(`Não foi possível importar ${file.name}`);
      }
    }
    setSamples(await listSamples());
    toast.success("Samples importados!");
  };

  const removeCustom = async (id: string) => {
    await deleteSample(id);
    setSamples(await listSamples());
  };

  const gridCls = useMemo(
    () => cn("grid gap-2 sm:gap-3", perf ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-4"),
    [perf],
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Drum Pad</h1>
        <p className="text-muted-foreground mt-1">
          Toque com os dedos ou pelo teclado. Bancos de sons, pads worship e seus próprios samples.
        </p>
      </header>

      {/* Banks */}
      <div className="grid sm:grid-cols-3 gap-3">
        {(Object.keys(BANKS) as KitFlavor[]).map((k) => (
          <button
            key={k}
            onClick={() => setBank(k)}
            className={cn(
              "text-left rounded-2xl border p-4 transition",
              bank === k ? "border-primary bg-primary/10" : "border-border bg-card/60 hover:border-primary/50",
            )}
          >
            <div className="font-bold">{BANKS[k].label}</div>
            <div className="text-xs text-muted-foreground mt-1">{BANKS[k].desc}</div>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card/60 p-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm">Modo performance</span>
          <Switch checked={perf} onCheckedChange={setPerf} />
        </div>
        <span className="text-xs text-muted-foreground flex-1 min-w-[180px]">
          Desativa animações para latência mínima.
        </span>
        <Button
          onClick={toggleRecording}
          className={cn(
            "rounded-full",
            recording ? "bg-destructive text-destructive-foreground" : "bg-gradient-primary text-primary-foreground",
          )}
        >
          {recording ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {recording ? "Encerrar sessão" : "Gravar sessão"}
        </Button>
        <div className="font-mono text-sm text-muted-foreground tabular-nums">{hits} toques</div>
      </div>

      {/* Pads */}
      <div className={gridCls}>
        {pads.map((p) => (
          <button
            key={p.id}
            onPointerDown={(e) => {
              e.preventDefault();
              hit(p.id, p.voice);
            }}
            className={cn(
              "relative aspect-square rounded-2xl border-2 bg-gradient-to-b flex flex-col items-center justify-center gap-1 select-none touch-none",
              TONES[p.tone],
              !perf && "transition-transform duration-75",
              active === p.id && "scale-95 brightness-150",
            )}
          >
            <span className="font-bold text-sm sm:text-base text-center px-1 leading-tight">{p.label}</span>
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">{p.key}</span>
          </button>
        ))}
      </div>

      {/* Custom samples */}
      <section className="rounded-2xl border bg-card/60 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-bold">Meus samples</div>
            <div className="text-xs text-muted-foreground">
              Importe arquivos .wav ou .mp3 do seu dispositivo. Ficam salvos offline.
            </div>
          </div>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> Importar
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            multiple
            hidden
            onChange={(e) => onImport(e.target.files)}
          />
        </div>

        {samples.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum sample importado ainda.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {samples.map((s) => (
              <div key={s.id} className="rounded-xl border border-border bg-background/40 p-2 flex flex-col gap-2">
                <button
                  onPointerDown={() => hit(s.id, "snare", true)}
                  className="flex-1 rounded-lg bg-gradient-to-b from-primary/15 to-transparent border border-primary/30 py-4 text-xs font-semibold truncate px-2"
                >
                  {s.name}
                </button>
                <button
                  onClick={() => removeCustom(s.id)}
                  className="text-[11px] text-muted-foreground hover:text-destructive inline-flex items-center gap-1 justify-center"
                >
                  <Trash2 className="w-3 h-3" /> Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
