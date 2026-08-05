// Worship Pad Pro — professional live worship pad player.
//
// Chord-first performance surface: pick a key, then trigger chord pads with
// one touch. Playback lives in the module-level engine, so pads keep sounding
// while the user navigates the rest of Groovik.

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Download, Expand, Import, Layers, Pencil, Plus,
  Search, Square, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PadCard } from "@/components/worship/PadCard";
import { PadEditor } from "@/components/worship/PadEditor";
import { KitEditor } from "@/components/worship/KitEditor";
import { ChordGrid } from "@/components/worship/ChordGrid";
import { PerformanceMode } from "@/components/worship/PerformanceMode";
import { useWakeLock, useWorship } from "@/lib/worship/useWorship";
import * as engine from "@/lib/worship/engine";
import {
  CATEGORY_LABELS, chordIdLabel, NOTE_NAMES, PAD_CATEGORIES, emptyKit,
  type ChordId, type Kit, type NoteName, type PadCategory, type PadDefinition,
} from "@/lib/worship/types";

export const Route = createFileRoute("/app/worship")({ component: WorshipPadPro });

function WorshipPadPro() {
  const {
    pads, kits, favorites, settings, activeVoices,
    upsertPad, removePad, upsertKit, removeKit, assignChord,
    toggleFavPad, toggleFavKit, updateSettings, exportKit, importKit,
  } = useWorship();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PadCategory | "all" | "fav">("all");
  const [padEditorOpen, setPadEditorOpen] = useState(false);
  const [editingPad, setEditingPad] = useState<PadDefinition | null>(null);
  const [kitEditorOpen, setKitEditorOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [assigning, setAssigning] = useState<ChordId | null>(null);
  const [perf, setPerf] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useWakeLock(settings.keepAwake && activeVoices.length > 0);

  const activeKit = useMemo(
    () => kits.find((k) => k.id === settings.activeKitId) ?? kits[0] ?? null,
    [kits, settings.activeKitId],
  );
  const root = settings.currentKey;
  const playingChords = activeVoices.map((v) => v.chordId).filter((c): c is string => !!c);

  const padFor = (chord: ChordId): PadDefinition | null => {
    const id = activeKit?.chordMap[chord];
    return (id && pads.find((p) => p.id === id)) || null;
  };

  /** One touch starts, another stops; switching chords crossfades. */
  const triggerChord = async (chord: ChordId) => {
    const pad = padFor(chord);
    if (!pad) return;
    if (playingChords.includes(chord)) {
      engine.stopVoice(pad.id, chord, pad.fx.release);
      return;
    }
    const label = `${chordIdLabel(chord)} — ${pad.name}`;
    if (settings.crossfade) {
      await engine.crossfadeTo(pad, { chordId: chord, label }, settings.crossfadeTime);
    } else {
      await engine.playPad(pad, { chordId: chord, label });
    }
  };

  const shiftKey = (delta: number) => {
    const i = (NOTE_NAMES.indexOf(root) + delta + 12) % 12;
    updateSettings({ currentKey: NOTE_NAMES[i] as NoteName });
  };

  const ensureKit = (): Kit => {
    if (activeKit) return activeKit;
    const kit = emptyKit("Meu kit");
    upsertKit(kit);
    updateSettings({ activeKitId: kit.id });
    return kit;
  };

  const filteredPads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pads.filter((p) => {
      if (category === "fav" && !favorites.pads.includes(p.id)) return false;
      if (category !== "all" && category !== "fav" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        CATEGORY_LABELS[p.category].toLowerCase().includes(q)
      );
    });
  }, [pads, query, category, favorites.pads]);

  const filteredKits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return kits;
    return kits.filter(
      (k) =>
        k.name.toLowerCase().includes(q) ||
        k.description.toLowerCase().includes(q) ||
        Object.keys(k.chordMap).some((c) => chordIdLabel(c).toLowerCase().includes(q)),
    );
  }, [kits, query]);

  if (perf) {
    return (
      <PerformanceMode
        kitName={activeKit?.name ?? "Sem kit"}
        root={root}
        onRootChange={shiftKey}
        padFor={padFor}
        playingChords={playingChords}
        onTrigger={(c) => void triggerChord(c)}
        onStopAll={() => engine.stopAll()}
        onClose={() => setPerf(false)}
        keepAwake={settings.keepAwake}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-24">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight">Worship Pad Pro</h1>
          <p className="text-sm text-muted-foreground">
            Pads de adoração ao vivo, organizados por acordes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" size="lg" onClick={() => engine.stopAll()}>
            <Square className="w-4 h-4 mr-2" /> Parar tudo
          </Button>
          <Button size="lg" onClick={() => setPerf(true)}>
            <Expand className="w-4 h-4 mr-2" /> Performance
          </Button>
        </div>
      </header>

      <Tabs defaultValue="play">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="play">Tocar</TabsTrigger>
          <TabsTrigger value="pads">Pads</TabsTrigger>
          <TabsTrigger value="kits">Kits</TabsTrigger>
          <TabsTrigger value="mix">Ajustes</TabsTrigger>
        </TabsList>

        {/* ------------------------------ play ------------------------------ */}
        <TabsContent value="play" className="space-y-4 pt-4">
          <div className="rounded-2xl border border-border bg-card/60 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Kit atual
              </span>
              <Select
                value={activeKit?.id ?? ""}
                onValueChange={(v) => updateSettings({ activeKitId: v })}
              >
                <SelectTrigger className="h-10 w-56">
                  <SelectValue placeholder="Nenhum kit" />
                </SelectTrigger>
                <SelectContent>
                  {kits.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="lg" onClick={() => shiftKey(-1)} aria-label="Tom anterior">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-[84px] rounded-xl border-2 border-primary bg-primary/10 py-2 text-center">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tom</div>
                <div className="font-display text-3xl font-bold leading-none">{root}</div>
              </div>
              <Button variant="outline" size="lg" onClick={() => shiftKey(1)} aria-label="Próximo tom">
                <ChevronRight className="w-5 h-5" />
              </Button>
              <div className="flex-1 overflow-x-auto">
                <div className="flex min-w-max gap-1.5">
                  {NOTE_NAMES.map((n) => (
                    <button
                      key={n}
                      onClick={() => updateSettings({ currentKey: n as NoteName })}
                      className={cn(
                        "h-11 w-11 rounded-xl border text-sm font-bold",
                        n === root
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <ChordGrid
            root={root}
            padFor={padFor}
            playingChords={playingChords}
            onTrigger={(c) => void triggerChord(c)}
            onAssign={(c) => {
              ensureKit();
              setAssigning(c);
            }}
          />

          {pads.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                A biblioteca começa vazia por opção: o Worship Pad Pro só reproduz áudio real,
                sem sons sintetizados. Importe seus pads em MP3, WAV ou OGG — ou grave pelo
                microfone — para preencher os acordes.
              </p>
              <Button
                className="mt-3"
                size="lg"
                onClick={() => {
                  setEditingPad(null);
                  setPadEditorOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Criar primeiro pad
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ------------------------------ pads ------------------------------ */}
        <TabsContent value="pads" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 pl-9"
                placeholder="Buscar por nome ou categoria"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button
              size="lg"
              onClick={() => {
                setEditingPad(null);
                setPadEditorOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Novo pad
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["all", "fav", ...PAD_CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c as PadCategory | "all" | "fav")}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold",
                  category === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {c === "all" ? "Todos" : c === "fav" ? "Favoritos" : CATEGORY_LABELS[c as PadCategory]}
              </button>
            ))}
          </div>

          {filteredPads.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum pad encontrado. Importe um áudio real para criar o primeiro.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPads.map((p) => (
                <PadCard
                  key={p.id}
                  pad={p}
                  playing={activeVoices.some((v) => v.padId === p.id)}
                  selected={false}
                  favorite={favorites.pads.includes(p.id)}
                  onSelect={() => void engine.previewPad(p)}
                  onStop={() => engine.stopPad(p.id, p.fx.release)}
                  onToggleFav={() => toggleFavPad(p.id)}
                  onEdit={() => {
                    setEditingPad(p);
                    setPadEditorOpen(true);
                  }}
                  onDelete={() => void removePad(p.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ------------------------------ kits ------------------------------ */}
        <TabsContent value="kits" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 pl-9"
                placeholder="Buscar kit ou acorde (ex.: Cm7)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const k = await importKit(f);
                  toast.success(`Kit "${k.name}" importado`);
                } catch {
                  toast.error("Arquivo de kit inválido");
                }
              }}
            />
            <Button variant="outline" size="lg" onClick={() => importRef.current?.click()}>
              <Import className="w-4 h-4 mr-2" /> Importar
            </Button>
            <Button
              size="lg"
              onClick={() => {
                setEditingKit(null);
                setKitEditorOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Novo kit
            </Button>
          </div>

          {filteredKits.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum kit ainda. Crie um kit para mapear cada acorde ao seu áudio.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredKits.map((k) => (
                <div key={k.id} className="rounded-2xl border border-border bg-card/60 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 shrink-0" style={{ color: k.color }} />
                        <span className="font-bold truncate">{k.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {Object.keys(k.chordMap).length} acordes mapeados
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" onClick={() => void exportKit(k)} aria-label="Exportar">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" aria-label="Editar"
                        onClick={() => {
                          setEditingKit(k);
                          setKitEditorOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeKit(k.id)} aria-label="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {Object.keys(k.chordMap).slice(0, 8).map((c) => (
                      <span key={c} className="rounded-full border border-border px-2 py-0.5 text-[10px] font-mono">
                        {chordIdLabel(c)}
                      </span>
                    ))}
                  </div>
                  <Button
                    className="mt-3 w-full"
                    variant={activeKit?.id === k.id ? "secondary" : "outline"}
                    size="lg"
                    onClick={() => updateSettings({ activeKitId: k.id })}
                  >
                    {activeKit?.id === k.id ? "Kit ativo" : "Usar este kit"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ------------------------------ mix ------------------------------- */}
        <TabsContent value="mix" className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label>Volume geral</Label>
            <Slider
              value={[settings.masterVolume]}
              min={0} max={1.5} step={0.01}
              onValueChange={([v]) => updateSettings({ masterVolume: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <div className="text-sm font-semibold">Crossfade entre acordes</div>
              <div className="text-xs text-muted-foreground">
                O pad anterior desaparece suavemente enquanto o novo entra.
              </div>
            </div>
            <Switch
              checked={settings.crossfade}
              onCheckedChange={(v) => updateSettings({ crossfade: v })}
            />
          </div>
          <div className="space-y-2">
            <Label>Tempo de crossfade — {settings.crossfadeTime.toFixed(1)}s</Label>
            <Slider
              value={[settings.crossfadeTime]}
              min={0.5} max={10} step={0.1}
              onValueChange={([v]) => updateSettings({ crossfadeTime: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <div className="text-sm font-semibold">Manter tela ligada</div>
              <div className="text-xs text-muted-foreground">Durante a performance ao vivo.</div>
            </div>
            <Switch
              checked={settings.keepAwake}
              onCheckedChange={(v) => updateSettings({ keepAwake: v })}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* --------------------------- assign dialog --------------------------- */}
      <Dialog open={!!assigning} onOpenChange={(v) => !v && setAssigning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mapear {assigning ? chordIdLabel(assigning) : ""}</DialogTitle>
            <DialogDescription>
              Escolha o pad de áudio que este acorde deve tocar.
            </DialogDescription>
          </DialogHeader>
          {pads.length === 0 ? (
            <Button
              size="lg"
              onClick={() => {
                setAssigning(null);
                setEditingPad(null);
                setPadEditorOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Criar pad com áudio real
            </Button>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {pads.map((p) => (
                <button
                  key={p.id}
                  className="w-full rounded-xl border border-border p-3 text-left hover:border-primary"
                  onClick={() => {
                    const kit = ensureKit();
                    if (assigning) assignChord(kit.id, assigning, p.id);
                    setAssigning(null);
                  }}
                >
                  <div className="font-semibold text-sm">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{CATEGORY_LABELS[p.category]}</div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PadEditor
        open={padEditorOpen}
        onOpenChange={setPadEditorOpen}
        pad={editingPad}
        onSave={upsertPad}
      />
      <KitEditor
        open={kitEditorOpen}
        onOpenChange={setKitEditorOpen}
        kit={editingKit}
        pads={pads}
        onSave={upsertKit}
      />
    </div>
  );
}
