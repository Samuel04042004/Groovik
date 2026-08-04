// Kit create/edit dialog with cover, color, description and drag-and-drop
// ordering of the pads it contains.

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { GripVertical, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { putBlob } from "@/lib/worship/store";
import type { Kit, PadDefinition } from "@/lib/worship/types";
import { toast } from "sonner";

const COLORS = ["#e8862f", "#4c8fd6", "#d9a441", "#8f7fd6", "#6fb5a0", "#d2685a"];

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Kit | null;
  pads: PadDefinition[];
  onSave: (kit: Kit) => void;
};

function blankKit(): Kit {
  return {
    id: `kit-${crypto.randomUUID()}`,
    name: "",
    description: "",
    color: COLORS[0],
    padIds: [],
    createdAt: new Date().toISOString(),
  };
}

export function KitEditor({ open, onOpenChange, editing, pads, onSave }: Props) {
  const [kit, setKit] = useState<Kit>(blankKit());
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setKit(editing ? { ...editing } : blankKit());
  }, [open, editing]);

  const toggle = (padId: string) =>
    setKit((k) => ({
      ...k,
      padIds: k.padIds.includes(padId) ? k.padIds.filter((p) => p !== padId) : [...k.padIds, padId],
    }));

  const reorder = (from: number, to: number) =>
    setKit((k) => {
      const list = [...k.padIds];
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      return { ...k, padIds: list };
    });

  const onCover = async (f: File | undefined) => {
    if (!f) return;
    const id = `img-${crypto.randomUUID()}`;
    await putBlob({ id, type: f.type, name: f.name, data: await f.arrayBuffer() });
    setKit((k) => ({ ...k, coverBlobId: id }));
    toast.success("Capa definida.");
  };

  const save = () => {
    if (!kit.name.trim()) {
      toast.error("Dê um nome ao kit.");
      return;
    }
    onSave(kit);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar kit" : "Novo kit"}</DialogTitle>
          <DialogDescription>Organize pads para cada culto, ensaio ou evento.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={kit.name} onChange={(e) => setKit({ ...kit, name: e.target.value })} placeholder="Culto de Domingo" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea rows={2} value={kit.description} onChange={(e) => setKit({ ...kit, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setKit({ ...kit, color: c })}
                  style={{ background: c }}
                  className={cn("w-8 h-8 rounded-full border-2", kit.color === c ? "border-foreground" : "border-transparent")}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Capa</Label>
            <Button variant="outline" onClick={() => imgRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> {kit.coverBlobId ? "Trocar capa" : "Escolher capa"}
            </Button>
            <input ref={imgRef} type="file" accept="image/*" hidden onChange={(e) => onCover(e.target.files?.[0])} />
          </div>

          <div className="space-y-2">
            <Label>Pads do kit ({kit.padIds.length}) — arraste para reordenar</Label>
            <div className="space-y-1">
              {kit.padIds.map((id, i) => {
                const pad = pads.find((p) => p.id === id);
                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIdx !== null && dragIdx !== i) reorder(dragIdx, i);
                      setDragIdx(null);
                    }}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-sm cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{pad?.name ?? "Pad removido"}</span>
                    <button onClick={() => toggle(id)} aria-label="Remover">
                      <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                );
              })}
              {kit.padIds.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum pad adicionado ainda.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Adicionar pads</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {pads
                .filter((p) => !kit.padIds.includes(p.id))
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className="rounded-lg border border-border bg-background/40 px-3 py-2 text-left text-xs hover:border-primary/60 truncate"
                  >
                    {p.name}
                  </button>
                ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} className="bg-gradient-primary text-primary-foreground">Salvar kit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
