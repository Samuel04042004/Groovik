// Kit editor — a kit is a full chord map (chord -> sampled pad).

import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PAD_COLORS } from "@/lib/worship/library";
import {
  CHORD_QUALITIES, chordId, chordLabel, emptyKit, NOTE_NAMES,
  type Kit, type PadDefinition,
} from "@/lib/worship/types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kit: Kit | null;
  pads: PadDefinition[];
  onSave: (kit: Kit) => void;
};

const NONE = "__none__";

export function KitEditor({ open, onOpenChange, kit, pads, onSave }: Props) {
  const [draft, setDraft] = useState<Kit>(emptyKit());
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) setDraft(kit ? structuredClone(kit) : emptyKit());
  }, [open, kit]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NOTE_NAMES.flatMap((root) =>
      CHORD_QUALITIES.map((quality) => ({
        id: chordId(root, quality),
        label: chordLabel(root, quality),
      })),
    ).filter((c) => !q || c.label.toLowerCase().includes(q));
  }, [query]);

  const mappedCount = Object.keys(draft.chordMap).length;

  function save() {
    if (!draft.name.trim()) return toast.error("Dê um nome ao kit");
    onSave({ ...draft, name: draft.name.trim() });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{kit ? "Editar kit" : "Novo kit"}</DialogTitle>
          <DialogDescription>
            Um kit guarda o mapeamento de cada acorde para um pad de áudio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do kit</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Ex.: Culto de Domingo"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
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

          <div className="rounded-xl border border-border">
            <div className="flex items-center gap-2 border-b border-border p-3">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar acorde (ex.: Cm7)"
                className="h-9"
              />
              <span className="shrink-0 text-xs font-mono text-muted-foreground">
                {mappedCount}/96
              </span>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-border">
              {pads.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">
                  Nenhum pad disponível ainda. Importe áudios reais na aba Pads.
                </div>
              )}
              {pads.length > 0 &&
                rows.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2">
                    <span className="w-16 shrink-0 font-mono text-sm font-bold">{c.label}</span>
                    <Select
                      value={draft.chordMap[c.id] ?? NONE}
                      onValueChange={(v) =>
                        setDraft((d) => {
                          const chordMap = { ...d.chordMap };
                          if (v === NONE) delete chordMap[c.id];
                          else chordMap[c.id] = v;
                          return { ...d, chordMap };
                        })
                      }
                    >
                      <SelectTrigger className="h-9"><SelectValue placeholder="Vazio" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Vazio</SelectItem>
                        {pads.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save}>Salvar kit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
