// Chord grid — the main live performance surface.
// Exactly 24 slots exist: 12 major chords and 12 minor chords.
// One touch starts a chord, another touch stops it, and switching chords
// crossfades instead of restarting.

import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import {
  chordId, chordLabel, NOTE_NAMES,
  type ChordId, type ChordQuality, type NoteName, type PadDefinition,
} from "@/lib/worship/types";

type Props = {
  root: NoteName;
  padFor: (chord: ChordId) => PadDefinition | null;
  playingChords: string[];
  onTrigger: (chord: ChordId) => void;
  onAssign?: (chord: ChordId) => void;
  size?: "normal" | "large";
  /** Restrict the grid to one quality; omit to show all 24 slots. */
  quality?: ChordQuality;
};

export function ChordGrid({ root, padFor, playingChords, onTrigger, onAssign, size = "normal", quality }: Props) {
  const qualities: ChordQuality[] = quality ? [quality] : ["maj", "min"];
  const slots = qualities.flatMap((q) =>
    NOTE_NAMES.map((n) => ({ q, note: n as NoteName })),
  );
  return (
    <div className={cn("grid gap-2 sm:gap-3", size === "large" ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-3 sm:grid-cols-6")}>
      {slots.map(({ q, note }) => {
        const id = chordId(note, q);
        const pad = padFor(id);
        const playing = playingChords.includes(id);
        const Icon = pad ? ((Icons as any)[pad.icon] ?? Icons.Waves) : Icons.Plus;
        const isRoot = note === root;

        return (
          <button
            key={id}
            onPointerDown={() => (pad ? onTrigger(id) : onAssign?.(id))}
            className={cn(
              "relative flex flex-col justify-between rounded-2xl border-2 p-3 text-left select-none touch-none",
              size === "large" ? "min-h-[104px]" : "min-h-[88px]",
              playing
                ? "border-primary bg-primary/15"
                : pad
                  ? "border-border bg-card hover:border-primary/60"
                  : "border-dashed border-border/70 bg-muted/20",
              !playing && isRoot && "ring-1 ring-primary/50",
            )}
            style={pad && !playing ? { background: `linear-gradient(150deg, ${pad.color}22, transparent)` } : undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={cn("font-display font-bold tracking-tight", size === "large" ? "text-2xl" : "text-xl")}>
                {chordLabel(note, q)}
              </span>
              <Icon className={cn("w-4 h-4 shrink-0", playing ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="mt-2 min-w-0">
              <div className={cn("text-[11px] truncate", pad ? "text-foreground/80" : "text-muted-foreground/70")}>
                {pad ? pad.name : "Vazio"}
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
