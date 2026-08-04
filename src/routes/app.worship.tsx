// Worship Pad Pro — professional ambient pad player for live worship.
// Playback lives in the module-level engine, so pads keep sounding while the
// user navigates the rest of Groovik.

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Download, Expand, Heart, Import, Plus, Search, Square, Layers, Pencil, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PadCard } from "@/components/worship/PadCard";
import { PadEditor } from "@/components/worship/PadEditor";
import { KitEditor } from "@/components/worship/KitEditor";
import { PadKeyboard } from "@/components/worship/PadKeyboard";
import { PerformanceMode } from "@/components/worship/PerformanceMode";
import { useWakeLock, useWorship } from "@/lib/worship/useWorship";
import * as engine from "@/lib/worship/engine";
import { CATEGORY_LABELS, PAD_CATEGORIES, type Kit, type PadCategory, type PadDefinition } from "@/lib/worship/types";

export const Route = createFileRoute("/app/worship")({ component: WorshipPadPro });

function WorshipPadPro() {
  const {
    pads, kits, favorites, settings, activeVoices,
    upsertPad, removePad, upsertKit, removeKit,
    toggleFavPad, toggleFavKit, updateSettings, exportKit, importKit,
  } = useWorship();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PadCategory | "all" | "fav">("all");
  const [selected, setSelected] = useState<PadDefinition | null>(null);
  const [padEditorOpen, setPadEditorOpen] = useState(false);
  const [editingPad, setEditingPad] = useState<PadDefinition | null>(null);
  const [kitEditorOpen, setKitEditorOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [perf, setPerf] = useState(false);
  const [sustain, setSustain] = useState(true);
  const [octave, setOctave] = useState(settings.baseOctave);
  const importRef = useRef<HTMLInputElement>(null);

  useWakeLock(settings.keepAwake && activeVoices.length > 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pads.filter((p) => {
      if (category === "fav" && !favorites.pads.includes(p.id)) return false;
      if (category !== "all" && category !== "fav" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        CATEGORY_LABELS[p.category].toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [pads, query, category, favorites.pads]);

  const activeMidis = activeVoices.filter((v) => v.padId === selected?.id).map((v) => v.midi);

  const selectPad = async (pad: PadDefinition) => {
    setSelected(pad);
    const midi = engine.midiFromNote("C", octave);
    if (settings.crossfade && activeVoices.length > 0) {
      await engine.crossfadeTo(pad, midi, settings.crossfadeTime);
    } else {
      await engine.playNote(pad, midi);
    }
  };

  const noteDown = async (midi: number) => {
    if (!selected) {
      toast.info("Escolha um pad primeiro.");
      return;
    }
    await engine.playNote(selected, midi);
  };
  const noteUp = (midi: number) => selected && engine.stopNote(selected.id, midi, selected.fx.release);

  const onImportKit = async (file: File | undefined) => {
    if (!file) return;
    try {
      const kit = await importKit(file);
      toast.success(`Kit "${kit.name}" importado.`);
    } catch {
      toast.error("Arquivo de kit inválido.");
    }
  };

  if (perf) {
    return (
      <PerformanceMode
        pads={filtered}
        selectedId={selected?.id ?? null}
        activeVoices={activeVoices}
        baseOctave={octave}
        onOctave={(d) => setOctave((o) => Math.max(0, Math.min(8, o + d)))}
        onSelectPad={selectPad}
        onNoteDown={noteDown}
        onNoteUp={noteUp}
        onStopAll={() => engine.stopAll()}
        onClose={() => setPerf(false)}
        keepAwake={settings.keepAwake}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Worship Pad Pro</h1>
          <p className="text-muted-foreground mt-1">
            Pads ambientes profissionais para cultos, ensaios e apresentações ao vivo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPerf(true)}>
            <Expand className="w-4 h-4 mr-2" /> Performance
          </Button>
          <Button variant="destructive" onClick={() => engine.stopAll()}>
            <Square className="w-4 h-4 mr-2" /> Parar tudo
          </Button>
        </div>
      </header>

      <Tabs defaultValue="pads">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="pads">Pads</TabsTrigger>
          <TabsTrigger value="kits">Kits</TabsTrigger>
          <TabsTrigger value="settings">Ajustes</TabsTrigger>
        </TabsList>

        {/* ------------------------------ PADS ------------------------------ */}
        <TabsContent value="pads" className="space-y-5 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, categoria ou tag"
                className="pl-9"
              />
            </div>
            <Button onClick={() => { setEditingPad(null); setPadEditorOpen(true); }} className="bg-gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Novo pad
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "fav", ...PAD_CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c as any)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition",
                  category === c ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                {c === "all" ? "Todos" : c === "fav" ? "Favoritos" : CATEGORY_LABELS[c as PadCategory]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <PadCard
                key={p.id}
                pad={p}
                playing={activeVoices.some((v) => v.padId === p.id)}
                selected={selected?.id === p.id}
                favorite={favorites.pads.includes(p.id)}
                onSelect={() => selectPad(p)}
                onStop={() => engine.stopPad(p.id, p.fx.release)}
                onToggleFav={() => toggleFavPad(p.id)}
                onEdit={!p.builtIn ? () => { setEditingPad(p); setPadEditorOpen(true); } : undefined}
                onDelete={!p.builtIn ? () => removePad(p.id) : undefined}
              />
            ))}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pad encontrado.</p>}
          </div>

          {/* Keyboard */}
          <section className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="font-bold text-sm flex-1 min-w-[160px]">
                Teclado {selected ? `— ${selected.name}` : "— selecione um pad"}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setOctave((o) => Math.max(0, o - 1))}>−</Button>
                <span className="font-mono text-xs text-muted-foreground">Oitava C{octave}</span>
                <Button variant="outline" size="sm" onClick={() => setOctave((o) => Math.min(8, o + 1))}>+</Button>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="sustain" checked={sustain} onCheckedChange={setSustain} />
                <Label htmlFor="sustain" className="text-xs">Sustain</Label>
              </div>
            </div>
            <PadKeyboard
              baseOctave={octave}
              octaves={3}
              activeMidis={activeMidis}
              onNoteDown={noteDown}
              onNoteUp={noteUp}
              sustain={sustain}
            />
            <p className="text-xs text-muted-foreground">
              Toque várias notas para formar acordes. Com sustain ativo, toque novamente para desligar a nota.
            </p>
          </section>
        </TabsContent>

        {/* ------------------------------ KITS ------------------------------ */}
        <TabsContent value="kits" className="space-y-4 pt-5">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setEditingKit(null); setKitEditorOpen(true); }} className="bg-gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Novo kit
            </Button>
            <Button variant="outline" onClick={() => importRef.current?.click()}>
              <Import className="w-4 h-4 mr-2" /> Importar kit
            </Button>
            <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(e) => onImportKit(e.target.files?.[0])} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {kits.map((k) => (
              <div key={k.id} className="rounded-2xl border border-border bg-card/60 p-4 space-y-3"
                style={{ background: `linear-gradient(160deg, ${k.color}22, transparent)` }}>
                <div className="flex items-start gap-2">
                  <Layers className="w-5 h-5 mt-0.5" style={{ color: k.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{k.name}</div>
                    <div className="text-xs text-muted-foreground">{k.description || `${k.padIds.length} pad(s)`}</div>
                  </div>
                  <button onClick={() => toggleFavKit(k.id)} aria-label="Favoritar kit">
                    <Heart className={cn("w-4 h-4", favorites.kits.includes(k.id) ? "fill-primary text-primary" : "text-muted-foreground")} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {k.padIds.slice(0, 6).map((id) => {
                    const pad = pads.find((p) => p.id === id);
                    if (!pad) return null;
                    return (
                      <button key={id} onClick={() => selectPad(pad)}
                        className="rounded-full border border-border px-2 py-0.5 text-[11px] hover:border-primary/60">
                        {pad.name}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditingKit(k); setKitEditorOpen(true); }}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exportKit(k)}>
                    <Download className="w-3.5 h-3.5 mr-1" /> Exportar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeKit(k.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {kits.length === 0 && <p className="text-sm text-muted-foreground">Nenhum kit criado ainda.</p>}
          </div>
        </TabsContent>

        {/* ---------------------------- SETTINGS ---------------------------- */}
        <TabsContent value="settings" className="space-y-5 pt-5 max-w-md">
          <div className="space-y-2">
            <Label>Volume geral</Label>
            <Slider min={0} max={1.5} step={0.01} value={[settings.masterVolume]}
              onValueChange={(v) => updateSettings({ masterVolume: v[0] })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cf">Crossfade entre pads</Label>
            <Switch id="cf" checked={settings.crossfade} onCheckedChange={(v) => updateSettings({ crossfade: v })} />
          </div>
          <div className="space-y-2">
            <Label>Tempo de crossfade — {settings.crossfadeTime.toFixed(1)}s</Label>
            <Slider min={0.2} max={10} step={0.1} value={[settings.crossfadeTime]}
              onValueChange={(v) => updateSettings({ crossfadeTime: v[0] })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="awake">Manter tela ligada</Label>
            <Switch id="awake" checked={settings.keepAwake} onCheckedChange={(v) => updateSettings({ keepAwake: v })} />
          </div>
          <p className="text-xs text-muted-foreground">
            Tudo (pads, kits, imagens, áudios e ajustes) fica salvo no próprio dispositivo e funciona offline.
          </p>
        </TabsContent>
      </Tabs>

      <PadEditor open={padEditorOpen} onOpenChange={setPadEditorOpen} editing={editingPad} onSave={upsertPad} />
      <KitEditor open={kitEditorOpen} onOpenChange={setKitEditorOpen} editing={editingKit} pads={pads} onSave={upsertKit} />
    </div>
  );
}
