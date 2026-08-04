// Infinite piano keyboard for Worship Pad Pro.
// Octaves are virtual: the strip renders a window of octaves and the user can
// scroll or shift the window in either direction without limits.

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { NOTE_NAMES } from "@/lib/worship/types";
import { midiFromNote, noteLabel } from "@/lib/worship/engine";

const WHITE = ["C", "D", "E", "F", "G", "A", "B"] as const;
const BLACK_AFTER: Record<string, string | null> = { C: "C#", D: "D#", E: null, F: "F#", G: "G#", A: "A#", B: null };

export type KeyboardProps = {
  baseOctave: number;
  octaves: number;
  activeMidis: number[];
  onNoteDown: (midi: number) => void;
  onNoteUp: (midi: number) => void;
  /** Sustain: a key press toggles the note instead of requiring hold. */
  sustain: boolean;
  large?: boolean;
};

export function PadKeyboard({
  baseOctave,
  octaves,
  activeMidis,
  onNoteDown,
  onNoteUp,
  sustain,
  large,
}: KeyboardProps) {
  const octaveList = useMemo(
    () => Array.from({ length: octaves }, (_, i) => baseOctave + i),
    [baseOctave, octaves],
  );

  const isActive = (midi: number) => activeMidis.includes(midi);

  const trigger = (midi: number) => {
    if (sustain) {
      if (isActive(midi)) onNoteUp(midi);
      else onNoteDown(midi);
    } else {
      onNoteDown(midi);
    }
  };

  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex min-w-max gap-3">
        {octaveList.map((oct) => (
          <div key={oct} className="relative">
            <div className="flex">
              {WHITE.map((n) => {
                const midi = midiFromNote(n as any, oct);
                return (
                  <button
                    key={n}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      trigger(midi);
                    }}
                    onPointerUp={() => !sustain && onNoteUp(midi)}
                    onPointerLeave={(e) => {
                      if (!sustain && e.buttons === 1) onNoteUp(midi);
                    }}
                    className={cn(
                      "relative select-none touch-none rounded-b-lg border border-border/70 bg-card text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-end justify-center pb-2 transition-colors",
                      large ? "w-14 h-52 sm:w-16 sm:h-64" : "w-10 h-32 sm:w-12 sm:h-40",
                      isActive(midi) && "bg-primary/80 text-primary-foreground border-primary",
                    )}
                  >
                    {n}
                    {oct}
                  </button>
                );
              })}
            </div>
            <div className="absolute top-0 left-0 flex pointer-events-none">
              {WHITE.map((n, i) => {
                const sharp = BLACK_AFTER[n];
                const w = large ? 56 : 40;
                if (!sharp) return <span key={n} style={{ width: w }} />;
                const midi = midiFromNote(sharp as any, oct);
                return (
                  <span key={n} style={{ width: w }} className="relative">
                    <button
                      onPointerDown={(e) => {
                        e.preventDefault();
                        trigger(midi);
                      }}
                      onPointerUp={() => !sustain && onNoteUp(midi)}
                      className={cn(
                        "pointer-events-auto absolute -right-[14px] sm:-right-4 top-0 z-10 rounded-b-md border border-border bg-background text-[9px] font-mono text-muted-foreground flex items-end justify-center pb-1 select-none touch-none",
                        large ? "w-7 h-32 sm:w-8 sm:h-40" : "w-5 h-20 sm:w-6 sm:h-24",
                        isActive(midi) && "bg-secondary text-secondary-foreground border-secondary",
                      )}
                      aria-label={noteLabel(midi)}
                    >
                      {sharp}
                    </button>
                    {i < 0 && null}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground font-mono">
        Notas: {NOTE_NAMES.join(" · ")}
      </div>
    </div>
  );
}
