// Pad tile used across library, kit and favorites views.

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Heart, Pencil, Square, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBlobUrl } from "@/lib/worship/store";
import { CATEGORY_LABELS, type PadDefinition } from "@/lib/worship/types";

type Props = {
  pad: PadDefinition;
  playing: boolean;
  selected: boolean;
  favorite: boolean;
  onSelect: () => void;
  onStop: () => void;
  onToggleFav: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function PadCard({
  pad, playing, selected, favorite, onSelect, onStop, onToggleFav, onEdit, onDelete,
}: Props) {
  const [cover, setCover] = useState<string | null>(null);
  const Icon = (Icons as any)[pad.icon] ?? Icons.Sparkles;

  useEffect(() => {
    let alive = true;
    if (pad.imageBlobId) getBlobUrl(pad.imageBlobId).then((u) => alive && setCover(u));
    return () => {
      alive = false;
    };
  }, [pad.imageBlobId]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur transition-all",
        selected ? "border-primary shadow-glow-orange" : "border-border hover:border-primary/50",
      )}
    >
      <button onClick={onSelect} className="block w-full text-left">
        <div
          className="relative h-24 w-full"
          style={{
            background: cover
              ? `center/cover url(${cover})`
              : `linear-gradient(160deg, ${pad.color}55, transparent)`,
          }}
        >
          <Icon className="absolute bottom-2 left-3 w-6 h-6" style={{ color: pad.color }} />
          {playing && (
            <span className="absolute top-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground animate-pulse">
              TOCANDO
            </span>
          )}
        </div>
        <div className="p-3">
          <div className="font-bold text-sm truncate">{pad.name}</div>
          <div className="text-[11px] text-muted-foreground truncate">{pad.description || CATEGORY_LABELS[pad.category]}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
              {CATEGORY_LABELS[pad.category]}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
              {pad.loopMode === "loop" ? "Loop" : "One shot"}
            </span>
          </div>
        </div>
      </button>

      <div className="flex items-center gap-1 border-t border-border px-2 py-1.5">
        <button onClick={onToggleFav} aria-label="Favoritar" className="p-1.5 rounded-lg hover:bg-accent">
          <Heart className={cn("w-4 h-4", favorite ? "fill-primary text-primary" : "text-muted-foreground")} />
        </button>
        {playing && (
          <button onClick={onStop} aria-label="Parar" className="p-1.5 rounded-lg hover:bg-accent">
            <Square className="w-4 h-4 text-destructive" />
          </button>
        )}
        <span className="flex-1" />
        {onEdit && (
          <button onClick={onEdit} aria-label="Editar" className="p-1.5 rounded-lg hover:bg-accent">
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} aria-label="Excluir" className="p-1.5 rounded-lg hover:bg-accent">
            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
          </button>
        )}
      </div>
    </div>
  );
}
