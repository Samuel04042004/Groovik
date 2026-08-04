// Fullscreen live performance surface: huge targets, no chrome, landscape
// friendly, screen kept awake while it is open.

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { PadKeyboard } from "./PadKeyboard";
import { useWakeLock } from "@/lib/worship/useWorship";
import type { PadDefinition } from "@/lib/worship/types";

type Props = {
  pads: PadDefinition[];
  selectedId: string | null;
  activeVoices: { padId: string; midi: number }[];
  baseOctave: number;
  onOctave: (delta: number) => void;
  onSelectPad: (pad: PadDefinition) => void;
  onNoteDown: (midi: number) => void;
  onNoteUp: (midi: number) => void;
  onStopAll: () => void;
  onClose: () => void;
  keepAwake: boolean;
};

export function PerformanceMode({
  pads, selectedId, activeVoices, baseOctave, onOctave, onSelectPad,
  onNoteDown, onNoteUp, onStopAll, onClose, keepAwake,
}: Props) {
  useWakeLock(keepAwake);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const activeMidis = activeVoices.filter((v) => v.padId === selectedId).map((v) => v.midi);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[oklch(0.13_0.01_260)] text-foreground"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="font-display font-bold tracking-tight">Modo Performance</div>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={onStopAll}>
            <Square className="w-4 h-4 mr-1" /> Parar tudo
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Sair">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {pads.map((p) => {
            const playing = activeVoices.some((v) => v.padId === p.id);
            return (
              <button
                key={p.id}
                onPointerDown={() => onSelectPad(p)}
                className={cn(
                  "min-h-[92px] rounded-2xl border-2 p-4 text-left transition-transform active:scale-[0.98] select-none touch-none",
                  playing ? "border-primary" : "border-border/60",
                )}
                style={{ background: `linear-gradient(150deg, ${p.color}44, transparent)` }}
              >
                <div className="text-lg font-bold leading-tight">{p.name}</div>
                <div className="text-xs text-muted-foreground">{playing ? "tocando" : "toque para iniciar"}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border/60 px-3 py-3">
        <div className="mb-2 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onOctave(-1)}>− Oitava</Button>
          <span className="font-mono text-xs text-muted-foreground">C{baseOctave}</span>
          <Button variant="outline" size="sm" onClick={() => onOctave(1)}>+ Oitava</Button>
        </div>
        <PadKeyboard
          baseOctave={baseOctave}
          octaves={2}
          activeMidis={activeMidis}
          onNoteDown={onNoteDown}
          onNoteUp={onNoteUp}
          sustain
          large
        />
      </div>
    </div>
  );
}
