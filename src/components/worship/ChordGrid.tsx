// Chord grid — the main live performance surface.
// One touch starts a chord, another touch stops it, and switching chords
// crossfades instead of restarting.

import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHORD_QUALITIES, chordId, chordLabel, QUALITY_LABELS,
  type ChordId, type NoteName, type PadDefinition,
} from "@/lib/worship/types";

type Props = {
  root: NoteName;
  padFor: (chord: ChordId) => PadDefinition | null;
  playingChords: string[];
  onTrigger: (chord: ChordId) => void;
  onAssign?: (chord: ChordId) => void;
  size?: "normal" | "large";
};

export function ChordGrid({ root, padFor, playingChords, onTrigger, onAssign, size = "normal" }: Props) {
  return (
    <div className={cn("grid gap-2 sm:gap-3", size === "large" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-4")}>
      {CHORD_QUALITIES.map((q) => {
        const id = chordId(root, q);
        const pad = padFor(id);
        const playing = playingChords.includes(id);
        const Icon = pad ? ((Icons as any)[pad.icon] ?? Icons.Waves) : Icons.Plus;
        return (
          <button
            key={id}
            onPointerDown={() => (pad ? onTrigger(id) : onAssign?.(id))}
            className={cn(
              "relative flex flex-col justify-between rounded-2xl border-2 p-4 text-left select-none touch-none",
              size === "large" ? "min-h-[128px]" : "min-h-[104px]",
              playing
                ? "border-primary bg-primary/15"
                : pad
                  ? "border-border bg-card hover:border-primary/60"
                  : "border-dashed border-border/70 bg-muted/20",
            )}
            style={pad && !playing ? { background: `linear-gradient(150deg, ${pad.color}22, transparent)` } : undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={cn("font-display font-bold tracking-tight", size === "large" ? "text-3xl" : "text-2xl")}>
                {chordLabel(root, q)}
              </span>
              <Icon className={cn("w-5 h-5 shrink-0", playing ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="mt-2 min-w-0">
              <div className="text-[11px] font-medium text-muted-foreground truncate">
                {QUALITY_LABELS[q]}
              </div>
              <div className={cn("text-xs truncate", pad ? "text-foreground/80" : "text-muted-foreground/70")}>
                {pad ? pad.name : "Vazio — toque para mapear"}
              </div>
            </div>
            {playing && (
              <span className="absolute right-3 bottom-3 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
