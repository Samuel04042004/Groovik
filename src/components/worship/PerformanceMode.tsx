// Fullscreen live performance surface: chord grid with huge targets, no
// chrome, screen kept awake while it is open.

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Square, ChevronLeft, ChevronRight } from "lucide-react";
import { ChordGrid } from "./ChordGrid";
import { useWakeLock } from "@/lib/worship/useWorship";
import type { ChordId, NoteName, PadDefinition } from "@/lib/worship/types";

type Props = {
  kitName: string;
  root: NoteName;
  onRootChange: (delta: number) => void;
  padFor: (chord: ChordId) => PadDefinition | null;
  playingChords: string[];
  onTrigger: (chord: ChordId) => void;
  onStopAll: () => void;
  onClose: () => void;
  keepAwake: boolean;
};

export function PerformanceMode({
  kitName, root, onRootChange, padFor, playingChords, onTrigger, onStopAll, onClose, keepAwake,
}: Props) {
  useWakeLock(keepAwake);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <div className="font-display font-bold tracking-tight truncate">Modo Performance</div>
          <div className="text-xs text-muted-foreground truncate">{kitName}</div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="destructive" size="lg" onClick={onStopAll}>
            <Square className="w-4 h-4 mr-1" /> Parar tudo
          </Button>
          <Button variant="ghost" size="lg" onClick={onClose} aria-label="Sair">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 px-4 pb-3">
        <Button variant="outline" size="lg" onClick={() => onRootChange(-1)} aria-label="Tom anterior">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="min-w-[96px] rounded-2xl border-2 border-primary bg-primary/10 py-3 text-center">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tom</div>
          <div className="font-display text-4xl font-bold leading-none">{root}</div>
        </div>
        <Button variant="outline" size="lg" onClick={() => onRootChange(1)} aria-label="Próximo tom">
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <ChordGrid
          root={root}
          padFor={padFor}
          playingChords={playingChords}
          onTrigger={onTrigger}
          size="large"
        />
      </div>
    </div>
  );
}
