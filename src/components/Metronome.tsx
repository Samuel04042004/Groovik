import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAudioCtx, scheduleSnare } from "@/lib/drum-audio";

type Props = {
  /** "R"/"L" pattern. Defaults to alternating R L R L. */
  pattern?: string[];
  initialBpm?: number;
  accentFirst?: boolean;
  onTick?: (idx: number) => void;
};

export function Metronome({
  pattern = ["R", "L", "R", "L"],
  initialBpm = 80,
  accentFirst = true,
  onTick,
}: Props) {
  const [bpm, setBpm] = useState(initialBpm);
  const [playing, setPlaying] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [elapsed, setElapsed] = useState(0);

  const nextNoteTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const lookaheadRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

  const len = pattern.length || 1;

  // Scheduler — Web Audio precise timing
  useEffect(() => {
    if (!playing) return;
    const ac = getAudioCtx();
    if (!ac) return;

    nextNoteTimeRef.current = ac.currentTime + 0.06;
    currentStepRef.current = 0;
    startTimeRef.current = performance.now();

    const interval = () => 60 / bpm;
    const SCHEDULE_AHEAD = 0.12;

    const tick = () => {
      while (nextNoteTimeRef.current < ac.currentTime + SCHEDULE_AHEAD) {
        const step = currentStepRef.current % len;
        const accent = accentFirst && step === 0;
        scheduleSnare(nextNoteTimeRef.current, accent);

        const delay = (nextNoteTimeRef.current - ac.currentTime) * 1000;
        const stepCopy = step;
        window.setTimeout(() => {
          setActiveIdx(stepCopy);
          onTick?.(stepCopy);
        }, Math.max(0, delay));

        nextNoteTimeRef.current += interval();
        currentStepRef.current++;
      }
      lookaheadRef.current = window.setTimeout(tick, 25);
    };
    tick();

    const elapsedT = window.setInterval(() => {
      setElapsed(Math.floor((performance.now() - startTimeRef.current) / 1000));
    }, 500);

    return () => {
      if (lookaheadRef.current) window.clearTimeout(lookaheadRef.current);
      window.clearInterval(elapsedT);
      setActiveIdx(-1);
    };
  }, [playing, bpm, len, accentFirst, onTick]);

  const toggle = () => {
    getAudioCtx(); // unlock
    setPlaying((p) => !p);
    if (playing) setElapsed(0);
  };

  const presets = [60, 80, 100, 120, 140, 160];
  const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const seconds = (elapsed % 60).toString().padStart(2, "0");

  // Mapped UI labels: R -> D, L -> E
  const display = useMemo(() => pattern.map((h) => (h === "R" ? "D" : "E")), [pattern]);

  return (
    <div className="rounded-2xl border bg-card/80 backdrop-blur shadow-card p-6 md:p-8 space-y-8">
      {/* Beat visualization */}
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 min-h-[110px]">
        {display.map((label, i) => {
          const isRight = label === "D";
          const active = i === activeIdx;
          return (
            <div
              key={i}
              className={cn(
                "relative flex items-center justify-center rounded-full font-bold font-mono select-none transition-all duration-150",
                "w-14 h-14 md:w-20 md:h-20 text-xl md:text-3xl",
                isRight
                  ? "bg-[oklch(0.72_0.19_45/0.18)] text-primary border-2 border-primary/40"
                  : "bg-[oklch(0.62_0.18_250/0.18)] text-secondary border-2 border-secondary/40",
                active && (isRight ? "shadow-glow-orange scale-110" : "shadow-glow-blue scale-110"),
              )}
              style={{ color: isRight ? "var(--right-hand)" : "var(--left-hand)" }}
            >
              {label}
              {active && (
                <span
                  className="absolute inset-0 rounded-full animate-ripple"
                  style={{
                    border: `2px solid ${isRight ? "var(--right-hand)" : "var(--left-hand)"}`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* BPM Display */}
      <div className="text-center space-y-2">
        <div className="font-mono text-6xl md:text-7xl font-bold tabular-nums tracking-tight text-gradient">
          {bpm}
        </div>
        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">BPM</div>
      </div>

      {/* BPM controls */}
      <div className="flex items-center gap-3 md:gap-4">
        <Button size="icon" variant="outline" onClick={() => setBpm((b) => Math.max(30, b - 1))}>
          <Minus className="w-4 h-4" />
        </Button>
        <Slider
          value={[bpm]}
          min={30}
          max={240}
          step={1}
          onValueChange={(v) => setBpm(v[0])}
          className="flex-1"
        />
        <Button size="icon" variant="outline" onClick={() => setBpm((b) => Math.min(240, b + 1))}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 justify-center">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setBpm(p)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-mono border transition",
              bpm === p
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Play */}
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm text-muted-foreground tabular-nums">
          {minutes}:{seconds}
        </div>
        <Button
          size="lg"
          onClick={toggle}
          className={cn(
            "rounded-full h-16 w-16 p-0 shadow-glow-orange transition-transform active:scale-95",
            "bg-gradient-primary text-primary-foreground hover:opacity-95",
          )}
        >
          {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
        </Button>
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {playing ? "Tocando" : "Parado"}
        </div>
      </div>
    </div>
  );
}
