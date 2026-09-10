// Worship Pad Pro — bulk import of real MP3 pad samples.
//
// Files go straight to the private Supabase Storage bucket (up to 100 MB each)
// with real upload progress. The tonality is detected from the file name and
// everything else in the name is ignored. Nothing is synthesized here.

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, CloudUpload, Loader2, Music4, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PACK_SLUG, buildUploadItems, deleteSample, listSamples, uploadSample,
  type UploadItem, type WorshipSample,
} from "@/lib/worship/remote-samples";
import { chordIdLabel } from "@/lib/worship/types";

type Props = {
  packSlug?: string;
  packName?: string;
  onSamplesChange: (samples: WorshipSample[]) => void;
};

export function SampleImporter({
  packSlug = DEFAULT_PACK_SLUG,
  packName = "Worship Pack 01",
  onSamplesChange,
}: Props) {
  const [samples, setSamples] = useState<WorshipSample[]>([]);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await listSamples(packSlug);
      setSamples(list);
      setLoadError(null);
      onSamplesChange(list);
    } catch (e: any) {
      setLoadError(e?.message ?? "Não foi possível carregar seus samples");
    }
  }, [packSlug, onSamplesChange]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function pick(files: FileList | null) {
    if (!files?.length) return;
    setItems(buildUploadItems([...files]));
  }

  async function startUpload() {
    setBusy(true);
    const list = [...items];
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (!item.chord) continue;
      list[i] = { ...item, status: "uploading", progress: 0, message: undefined };
      setItems([...list]);
      try {
        await uploadSample(item.file, item.chord, packSlug, (pct) => {
          list[i] = { ...list[i], progress: pct };
          setItems([...list]);
        });
        list[i] = { ...list[i], status: "done", progress: 100 };
      } catch (e: any) {
        list[i] = { ...list[i], status: "error", message: e?.message ?? "Falha no envio" };
      }
      setItems([...list]);
    }
    setBusy(false);
    const ok = list.filter((i) => i.status === "done").length;
    const failed = list.filter((i) => i.status === "error").length;
    if (ok) toast.success(`${ok} sample(s) enviados para ${packName}`);
    if (failed) toast.error(`${failed} arquivo(s) não foram enviados`);
    await refresh();
  }

  async function remove(sample: WorshipSample) {
    try {
      await deleteSample(sample);
      toast.success("Sample removido");
      await refresh();
    } catch {
      toast.error("Não foi possível remover o sample");
    }
  }

  const ready = items.filter((i) => i.chord && i.status !== "done").length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-border p-5 text-center">
        <CloudUpload className="mx-auto w-8 h-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Envie seus MP3 reais de Worship Pad. A tonalidade é reconhecida pelo nome do arquivo
          (ex.: “PAD C - WORSHIP PAD.mp3” vira C maior, “PAD Am - ….mp3” vira A menor).
          Arquivos de até 100 MB, guardados na nuvem e baixados só quando o acorde é tocado.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,.mp3,.wav,.ogg"
          className="hidden"
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = "";
          }}
        />
        <Button className="mt-3" size="lg" onClick={() => inputRef.current?.click()} disabled={busy}>
          Escolher arquivos
        </Button>
      </div>

      {loadError && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          {loadError}
        </p>
      )}

      {items.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-border p-3">
          {items.map((item, idx) => (
            <div key={`${item.file.name}-${idx}`} className="space-y-1">
              <div className="flex items-center gap-2">
                {item.status === "uploading" ? (
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin text-primary" />
                ) : item.status === "done" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
                ) : item.status === "error" ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
                ) : (
                  <Music4 className="w-4 h-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1 truncate text-xs">{item.file.name}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px]",
                    item.chord ? "border-primary text-primary" : "border-destructive text-destructive",
                  )}
                >
                  {item.chord ? chordIdLabel(item.chord) : "?"}
                </span>
              </div>
              {item.status === "uploading" && <Progress value={item.progress} className="h-1.5" />}
              {item.message && (
                <p className="pl-6 text-[11px] text-destructive">{item.message}</p>
              )}
            </div>
          ))}
          <Button className="w-full" size="lg" disabled={busy || ready === 0} onClick={() => void startUpload()}>
            {busy ? "Enviando…" : `Enviar ${ready} arquivo(s)`}
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-between border-b border-border p-3">
          <span className="text-sm font-semibold">{packName}</span>
          <span className="font-mono text-xs text-muted-foreground">{samples.length}/24</span>
        </div>
        {samples.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Nenhum sample enviado ainda. Os acordes ficam vazios até você enviar os áudios.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {samples.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3">
                <span className="w-12 shrink-0 font-mono text-sm font-bold">
                  {chordIdLabel(s.chord_id)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs">{s.file_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {(s.size_bytes / (1024 * 1024)).toFixed(1)} MB
                  </div>
                </div>
                <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => void remove(s)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
