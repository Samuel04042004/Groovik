// Create / edit dialog for custom Worship pads: metadata, artwork, audio
// source (import or microphone), trim + normalize + loop points, preview,
// and the full per-pad FX chain.

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Mic, Play, Square, Upload, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS, DEFAULT_FX, PAD_CATEGORIES,
  type PadCategory, type PadDefinition, type PadFx,
} from "@/lib/worship/types";
import { BUILTIN_PADS } from "@/lib/worship/library";
import { decodeFile, encodeWav, normalizeBuffer, trimBuffer, waveformPeaks } from "@/lib/worship/audio-edit";
import { putBlob } from "@/lib/worship/store";
import * as engine from "@/lib/worship/engine";

const COLORS = ["#e8862f", "#4c8fd6", "#d9a441", "#8f7fd6", "#6fb5a0", "#d2685a", "#9aa7b8", "#5a5f7a"];
const ICONS = ["Sparkles", "Waves", "Music4", "Church", "Star", "Moon", "Wind", "Feather", "Piano", "Flame"];

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: PadDefinition | null;
  onSave: (pad: PadDefinition) => void;
};

function blankPad(): PadDefinition {
  return {
    id: `pad-${crypto.randomUUID()}`,
    name: "",
    description: "",
    category: "worship",
    tags: [],
    color: COLORS[0],
    icon: "Sparkles",
    loopMode: "loop",
    fx: { ...DEFAULT_FX },
    source: { kind: "synth", recipe: (BUILTIN_PADS[0].source as any).recipe },
    builtIn: false,
    createdAt: new Date().toISOString(),
  };
}

export function PadEditor({ open, onOpenChange, editing, onSave }: Props) {
  const [pad, setPad] = useState<PadDefinition>(blankPad());
  const [tagText, setTagText] = useState("");
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [trim, setTrim] = useState<[number, number]>([0, 0]);
  const [loopPts, setLoopPts] = useState<[number, number]>([0, 0]);
  const [normalize, setNormalize] = useState(true);
  const [recording, setRecording] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<ArrayBuffer | null>(null);
  const [baseSynth, setBaseSynth] = useState(BUILTIN_PADS[0].id);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (!open) return;
    setPad(editing ? { ...editing } : blankPad());
    setTagText(editing?.tags.join(", ") ?? "");
    setBuffer(null);
    setPeaks([]);
    setPendingAudio(null);
  }, [open, editing]);

  const loadAudio = useCallback(async (data: ArrayBuffer) => {
    try {
      const buf = await decodeFile(data);
      setBuffer(buf);
      setPeaks(waveformPeaks(buf));
      setTrim([0, buf.duration]);
      setLoopPts([0, buf.duration]);
      setPendingAudio(data);
    } catch {
      toast.error("Não foi possível ler este áudio.");
    }
  }, []);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    await loadAudio(await f.arrayBuffer());
    setPad((p) => ({ ...p, name: p.name || f.name.replace(/\.[^.]+$/, "") }));
  };

  const onImage = async (f: File | undefined) => {
    if (!f) return;
    const id = `img-${crypto.randomUUID()}`;
    await putBlob({ id, type: f.type, name: f.name, data: await f.arrayBuffer() });
    setPad((p) => ({ ...p, imageBlobId: id }));
    toast.success("Imagem definida.");
  };

  const toggleRecord = async () => {
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: rec.mimeType });
        await loadAudio(await blob.arrayBuffer());
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch {
      toast.error("Microfone indisponível.");
    }
  };

  const buildPreviewPad = (): PadDefinition => pad;

  const preview = async () => {
    if (previewing) {
      engine.stopPad(pad.id, 0.4);
      setPreviewing(false);
      return;
    }
    let target = buildPreviewPad();
    if (pendingAudio && buffer) {
      const blobId = `aud-preview-${pad.id}`;
      await engine.decodeAndCache(blobId, renderProcessed(buffer));
      target = {
        ...pad,
        source: {
          kind: "sample",
          blobId,
          trimStart: 0,
          trimEnd: 0,
          loopStart: Math.max(0, loopPts[0] - trim[0]),
          loopEnd: Math.max(0, loopPts[1] - trim[0]),
        },
      };
    }
    setPreviewing(true);
    await engine.playNote(target, 60);
    window.setTimeout(() => {
      engine.stopPad(target.id, 0.6);
      setPreviewing(false);
    }, 6000);
  };

  const renderProcessed = (buf: AudioBuffer): ArrayBuffer => {
    let out = trimBuffer(buf, trim[0], trim[1]);
    if (normalize) out = normalizeBuffer(out);
    return encodeWav(out);
  };

  const save = async () => {
    if (!pad.name.trim()) {
      toast.error("Dê um nome ao pad.");
      return;
    }
    let source = pad.source;
    if (pendingAudio && buffer) {
      const blobId = `aud-${crypto.randomUUID()}`;
      const data = renderProcessed(buffer);
      await putBlob({ id: blobId, type: "audio/wav", name: pad.name, data });
      await engine.decodeAndCache(blobId, data);
      source = {
        kind: "sample",
        blobId,
        trimStart: 0,
        trimEnd: 0,
        loopStart: Math.max(0, loopPts[0] - trim[0]),
        loopEnd: Math.max(0, loopPts[1] - trim[0]),
      };
    } else if (source.kind === "synth") {
      const base = BUILTIN_PADS.find((b) => b.id === baseSynth);
      if (base && base.source.kind === "synth") source = { kind: "synth", recipe: base.source.recipe };
    }
    engine.stopPad(pad.id, 0.2);
    onSave({
      ...pad,
      source,
      tags: tagText.split(",").map((t) => t.trim()).filter(Boolean),
    });
    onOpenChange(false);
    toast.success("Pad salvo.");
  };

  const setFx = (patch: Partial<PadFx>) => setPad((p) => ({ ...p, fx: { ...p.fx, ...patch } }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar pad" : "Novo pad"}</DialogTitle>
          <DialogDescription>
            Crie pads ilimitados com som próprio, arte e processamento independente.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="info">Identidade</TabsTrigger>
            <TabsTrigger value="audio">Áudio</TabsTrigger>
            <TabsTrigger value="fx">Efeitos</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={pad.name} onChange={(e) => setPad({ ...pad, name: e.target.value })} placeholder="Ex.: Pad Domingo Manhã" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={pad.description} onChange={(e) => setPad({ ...pad, description: e.target.value })} rows={2} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={pad.category} onValueChange={(v) => setPad({ ...pad, category: v as PadCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAD_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ícone</Label>
                <Select value={pad.icon} onValueChange={(v) => setPad({ ...pad, icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tags (separadas por vírgula)</Label>
              <Input value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="worship, domingo, suave" />
            </div>
            <div className="space-y-2">
              <Label>Cor de fundo</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setPad({ ...pad, color: c })}
                    style={{ background: c }}
                    className={cn("w-8 h-8 rounded-full border-2", pad.color === c ? "border-foreground" : "border-transparent")}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Imagem personalizada</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => imgRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Escolher imagem
                </Button>
                {pad.imageBlobId && <span className="text-xs text-muted-foreground">Imagem definida</span>}
                <input ref={imgRef} type="file" accept="image/*" hidden onChange={(e) => onImage(e.target.files?.[0])} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audio" className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Importar MP3 / WAV / OGG
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="audio/mpeg,audio/wav,audio/ogg,audio/*"
                hidden
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <Button type="button" variant={recording ? "destructive" : "outline"} onClick={toggleRecord}>
                <Mic className="w-4 h-4 mr-2" /> {recording ? "Parar gravação" : "Gravar do microfone"}
              </Button>
            </div>

            {!buffer && (
              <div className="space-y-2">
                <Label>Ou use um motor sintetizado da biblioteca</Label>
                <Select value={baseSynth} onValueChange={setBaseSynth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUILTIN_PADS.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {buffer && (
              <div className="space-y-4">
                <div className="flex h-20 items-center gap-[1px] rounded-xl border border-border bg-background/50 px-2">
                  {peaks.map((p, i) => (
                    <span key={i} className="flex-1 bg-primary/70 rounded-sm" style={{ height: `${Math.max(2, p * 100)}%` }} />
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Corte (início / fim) — {trim[0].toFixed(2)}s a {trim[1].toFixed(2)}s</Label>
                  <Slider
                    min={0}
                    max={buffer.duration}
                    step={0.01}
                    value={trim}
                    onValueChange={(v) => setTrim([v[0], v[1]] as [number, number])}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pontos de loop — {loopPts[0].toFixed(2)}s a {loopPts[1].toFixed(2)}s</Label>
                  <Slider
                    min={0}
                    max={buffer.duration}
                    step={0.01}
                    value={loopPts}
                    onValueChange={(v) => setLoopPts([v[0], v[1]] as [number, number])}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={normalize} onCheckedChange={setNormalize} id="norm" />
                  <Label htmlFor="norm" className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4" /> Normalizar volume
                  </Label>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch
                id="loopmode"
                checked={pad.loopMode === "loop"}
                onCheckedChange={(v) => setPad({ ...pad, loopMode: v ? "loop" : "one-shot" })}
              />
              <Label htmlFor="loopmode">Loop infinito (desligado = one shot)</Label>
            </div>

            <Button type="button" variant="secondary" onClick={preview}>
              {previewing ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {previewing ? "Parar prévia" : "Ouvir prévia"}
            </Button>
          </TabsContent>

          <TabsContent value="fx" className="space-y-4 pt-4">
            <FxSlider label="Volume" value={pad.fx.volume} min={0} max={1.5} step={0.01} onChange={(v) => setFx({ volume: v })} />
            <FxSlider label="Pan" value={pad.fx.pan} min={-1} max={1} step={0.01} onChange={(v) => setFx({ pan: v })} />
            <FxSlider label="Afinação fina (cents)" value={pad.fx.pitch} min={-100} max={100} step={1} onChange={(v) => setFx({ pitch: v })} />
            <FxSlider label="Transpor (semitons)" value={pad.fx.transpose} min={-24} max={24} step={1} onChange={(v) => setFx({ transpose: v })} />
            <FxSlider label="EQ graves (dB)" value={pad.fx.eqLow} min={-18} max={18} step={0.5} onChange={(v) => setFx({ eqLow: v })} />
            <FxSlider label="EQ médios (dB)" value={pad.fx.eqMid} min={-18} max={18} step={0.5} onChange={(v) => setFx({ eqMid: v })} />
            <FxSlider label="EQ agudos (dB)" value={pad.fx.eqHigh} min={-18} max={18} step={0.5} onChange={(v) => setFx({ eqHigh: v })} />
            <FxSlider label="Reverb" value={pad.fx.reverb} min={0} max={1} step={0.01} onChange={(v) => setFx({ reverb: v })} />
            <FxSlider label="Delay" value={pad.fx.delay} min={0} max={1} step={0.01} onChange={(v) => setFx({ delay: v })} />
            <FxSlider label="Attack (s)" value={pad.fx.attack} min={0.01} max={8} step={0.05} onChange={(v) => setFx({ attack: v })} />
            <FxSlider label="Release (s)" value={pad.fx.release} min={0.05} max={10} step={0.05} onChange={(v) => setFx({ release: v })} />
            <FxSlider label="Velocidade de reprodução" value={pad.fx.speed} min={0.25} max={2} step={0.01} onChange={(v) => setFx({ speed: v })} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} className="bg-gradient-primary text-primary-foreground">Salvar pad</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FxSlider({
  label, value, min, max, step, onChange,
}: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <Label>{label}</Label>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">{value.toFixed(2)}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
