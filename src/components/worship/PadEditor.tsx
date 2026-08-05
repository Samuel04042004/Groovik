// Pad editor — create/edit a sampled worship pad.
// Audio can only come from a real file (MP3/WAV/OGG) or a microphone
// recording. There is no synthesis option by design.

import { useEffect, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Mic, Music, Play, Square, Upload, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as engine from "@/lib/worship/engine";
import { putBlob } from "@/lib/worship/store";
import { decodeFile, encodeWav, normalizeBuffer, trimBuffer, waveformPeaks } from "@/lib/worship/audio-edit";
import { PAD_COLORS, PAD_ICONS } from "@/lib/worship/library";
import {
  CATEGORY_LABELS, DEFAULT_FX, PAD_CATEGORIES,
  type PadCategory, type PadDefinition, type PadFx,
} from "@/lib/worship/types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pad: PadDefinition | null;
  onSave: (pad: PadDefinition) => void;
};

function blankPad(): PadDefinition {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    category: "worship",
    tags: [],
    color: PAD_COLORS[0],
    icon: "Waves",
    loopMode: "loop",
    fx: { ...DEFAULT_FX },
    source: { kind: "sample", blobId: "", loopStart: 0, loopEnd: 0, trimStart: 0, trimEnd: 0 },
    builtIn: false,
    createdAt: new Date().toISOString(),
  };
}

export function PadEditor({ open, onOpenChange, pad, onSave }: Props) {
  const [draft, setDraft] = useState<PadDefinition>(blankPad());
  const [peaks, setPeaks] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const [recording, setRecording] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (!open) return;
    const next = pad ? structuredClone(pad) : blankPad();
    setDraft(next);
    setPeaks([]);
    setDuration(0);
    if (next.source.blobId) {
      const cached = engine.getCachedBuffer(next.source.blobId);
      if (cached) {
        setPeaks(waveformPeaks(cached));
        setDuration(cached.duration);
      }
    }
  }, [open, pad]);

  const patchFx = (patch: Partial<PadFx>) =>
    setDraft((d) => ({ ...d, fx: { ...d.fx, ...patch } }));

  async function ingestAudio(data: ArrayBuffer, type: string, name: string) {
    try {
      const buf = await decodeFile(data);
      const blobId = crypto.randomUUID();
      await putBlob({ id: blobId, type, name, data });
      await engine.decodeAndCache(blobId, data);
      setPeaks(waveformPeaks(buf));
      setDuration(buf.duration);
      setDraft((d) => ({
        ...d,
        name: d.name || name.replace(/\.[^.]+$/, ""),
        source: { kind: "sample", blobId, loopStart: 0, loopEnd: buf.duration, trimStart: 0, trimEnd: buf.duration },
      }));
      toast.success("Áudio carregado");
    } catch {
      toast.error("Não foi possível ler este arquivo de áudio");
    }
  }

  async function onPickFile(file?: File) {
    if (!file) return;
    await ingestAudio(await file.arrayBuffer(), file.type || "audio/wav", file.name);
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
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
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        await ingestAudio(await blob.arrayBuffer(), blob.type, "Gravação");
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      toast.error("Microfone indisponível");
    }
  }

  /** Destructively bakes trim + normalization into a new WAV blob. */
  async function applyEdits(normalize: boolean) {
    if (!draft.source.blobId) return;
    const cached = engine.getCachedBuffer(draft.source.blobId);
    if (!cached) return toast.error("Carregue o áudio novamente");
    let buf = trimBuffer(cached, draft.source.trimStart, draft.source.trimEnd || cached.duration);
    if (normalize) buf = normalizeBuffer(buf);
    const wav = encodeWav(buf);
    const blobId = crypto.randomUUID();
    await putBlob({ id: blobId, type: "audio/wav", name: `${draft.name || "pad"}.wav`, data: wav });
    await engine.decodeAndCache(blobId, wav);
    setPeaks(waveformPeaks(buf));
    setDuration(buf.duration);
    setDraft((d) => ({
      ...d,
      source: { kind: "sample", blobId, loopStart: 0, loopEnd: buf.duration, trimStart: 0, trimEnd: buf.duration },
    }));
    toast.success(normalize ? "Áudio cortado e normalizado" : "Áudio cortado");
  }

  async function onPickImage(file?: File) {
    if (!file) return;
    const id = crypto.randomUUID();
    await putBlob({ id, type: file.type, name: file.name, data: await file.arrayBuffer() });
    setDraft((d) => ({ ...d, imageBlobId: id }));
  }

  function togglePreview() {
    if (previewing) {
      engine.stopVoice(draft.id, null, 0.4);
      setPreviewing(false);
      return;
    }
    if (!draft.source.blobId) return toast.error("Importe um áudio primeiro");
    void engine.playPad(draft, { label: `Prévia — ${draft.name || "Pad"}` });
    setPreviewing(true);
  }

  function save() {
    if (!draft.name.trim()) return toast.error("Dê um nome ao pad");
    if (!draft.source.blobId) return toast.error("Um pad precisa de um áudio real");
    engine.stopVoice(draft.id, null, 0.3);
    onSave({ ...draft, name: draft.name.trim() });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pad ? "Editar pad" : "Novo pad"}</DialogTitle>
          <DialogDescription>
            Somente áudio real: importe MP3, WAV ou OGG, ou grave pelo microfone.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="audio">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="audio">Áudio</TabsTrigger>
            <TabsTrigger value="info">Identidade</TabsTrigger>
            <TabsTrigger value="fx">Mixagem</TabsTrigger>
          </TabsList>

          {/* ------------------------------ audio ----------------------------- */}
          <TabsContent value="audio" className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="audio/mpeg,audio/wav,audio/ogg,audio/*"
                className="hidden"
                onChange={(e) => void onPickFile(e.target.files?.[0])}
              />
              <Button variant="outline" size="lg" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Importar áudio
              </Button>
              <Button
                variant={recording ? "destructive" : "outline"}
                size="lg"
                onClick={() => void toggleRecording()}
              >
                <Mic className="w-4 h-4 mr-2" /> {recording ? "Parar gravação" : "Gravar"}
              </Button>
              <Button variant="secondary" size="lg" onClick={togglePreview}>
                {previewing ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {previewing ? "Parar" : "Ouvir"}
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              {peaks.length > 0 ? (
                <div className="flex h-20 items-center gap-[1px]">
                  {peaks.map((p, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-sm bg-primary/70"
                      style={{ height: `${Math.max(3, p * 100)}%` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-20 items-center justify-center text-xs text-muted-foreground">
                  <Music className="w-4 h-4 mr-2" />
                  {draft.source.blobId ? "Áudio salvo neste pad" : "Nenhum áudio carregado"}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <div className="text-sm font-semibold">Modo loop</div>
                <div className="text-xs text-muted-foreground">
                  Loop contínuo até você parar, ou one-shot.
                </div>
              </div>
              <Switch
                checked={draft.loopMode === "loop"}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, loopMode: v ? "loop" : "one-shot" }))}
              />
            </div>

            {duration > 0 && (
              <div className="space-y-4 rounded-xl border border-border p-3">
                <SliderRow
                  label="Início do corte"
                  value={draft.source.trimStart}
                  min={0}
                  max={duration}
                  step={0.01}
                  suffix="s"
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, source: { ...d.source, trimStart: v } }))
                  }
                />
                <SliderRow
                  label="Fim do corte"
                  value={draft.source.trimEnd || duration}
                  min={0}
                  max={duration}
                  step={0.01}
                  suffix="s"
                  onChange={(v) => setDraft((d) => ({ ...d, source: { ...d.source, trimEnd: v } }))}
                />
                <SliderRow
                  label="Loop início"
                  value={draft.source.loopStart}
                  min={0}
                  max={duration}
                  step={0.01}
                  suffix="s"
                  onChange={(v) => setDraft((d) => ({ ...d, source: { ...d.source, loopStart: v } }))}
                />
                <SliderRow
                  label="Loop fim"
                  value={draft.source.loopEnd || duration}
                  min={0}
                  max={duration}
                  step={0.01}
                  suffix="s"
                  onChange={(v) => setDraft((d) => ({ ...d, source: { ...d.source, loopEnd: v } }))}
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => void applyEdits(false)}>
                    Aplicar corte
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => void applyEdits(true)}>
                    <Wand2 className="w-4 h-4 mr-2" /> Cortar e normalizar
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ------------------------------ info ------------------------------ */}
          <TabsContent value="info" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Ex.: Ambiente Adoração"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={draft.category}
                onValueChange={(v) => setDraft((d) => ({ ...d, category: v as PadCategory }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAD_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cor de fundo</Label>
              <div className="flex flex-wrap gap-2">
                {PAD_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setDraft((d) => ({ ...d, color: c }))}
                    className={cn(
                      "h-9 w-9 rounded-lg border-2",
                      draft.color === c ? "border-foreground" : "border-transparent",
                    )}
                    style={{ background: c }}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <Select value={draft.icon} onValueChange={(v) => setDraft((d) => ({ ...d, icon: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAD_ICONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Imagem de capa</Label>
              <input
                ref={imageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onPickImage(e.target.files?.[0])}
              />
              <Button variant="outline" onClick={() => imageRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                {draft.imageBlobId ? "Trocar imagem" : "Escolher imagem"}
              </Button>
            </div>
          </TabsContent>

          {/* ------------------------------- fx -------------------------------- */}
          <TabsContent value="fx" className="space-y-4 pt-4">
            <SliderRow label="Volume" value={draft.fx.volume} min={0} max={1.5} step={0.01}
              onChange={(v) => patchFx({ volume: v })} />
            <SliderRow label="Pan" value={draft.fx.pan} min={-1} max={1} step={0.01}
              onChange={(v) => patchFx({ pan: v })} />
            <SliderRow label="Fade in (attack)" value={draft.fx.attack} min={0} max={10} step={0.1} suffix="s"
              onChange={(v) => patchFx({ attack: v })} />
            <SliderRow label="Fade out (release)" value={draft.fx.release} min={0.1} max={12} step={0.1} suffix="s"
              onChange={(v) => patchFx({ release: v })} />
            <SliderRow label="Transpose" value={draft.fx.transpose} min={-24} max={24} step={1} suffix=" st"
              onChange={(v) => patchFx({ transpose: v })} />
            <SliderRow label="Afinação fina" value={draft.fx.pitch} min={-100} max={100} step={1} suffix=" ct"
              onChange={(v) => patchFx({ pitch: v })} />
            <SliderRow label="EQ graves" value={draft.fx.eqLow} min={-18} max={18} step={0.5} suffix=" dB"
              onChange={(v) => patchFx({ eqLow: v })} />
            <SliderRow label="EQ médios" value={draft.fx.eqMid} min={-18} max={18} step={0.5} suffix=" dB"
              onChange={(v) => patchFx({ eqMid: v })} />
            <SliderRow label="EQ agudos" value={draft.fx.eqHigh} min={-18} max={18} step={0.5} suffix=" dB"
              onChange={(v) => patchFx({ eqHigh: v })} />
            <SliderRow label="Reverb" value={draft.fx.reverb} min={0} max={1} step={0.01}
              onChange={(v) => patchFx({ reverb: v })} />
            <SliderRow label="Delay" value={draft.fx.delay} min={0} max={1} step={0.01}
              onChange={(v) => patchFx({ delay: v })} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save}>Salvar pad</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SliderRow({
  label, value, min, max, step, suffix = "", onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  suffix?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-muted-foreground">
          {value.toFixed(step < 1 ? 2 : 0)}{suffix}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
