import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { getRudiment, RUDIMENT_CATEGORIES, type Rudiment } from "@/lib/rudiments";
import { getAudioCtx, scheduleSnare } from "@/lib/drum-audio";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Play, Pause, Plus, Minus, Repeat, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/rudiments/$id")({
  component: RudimentDetail,
  loader: ({ params }) => {
    const r = getRudiment(params.id);
    if (!r) throw notFound();
    return { rudiment: r };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${(loaderData as any)?.rudiment?.name ?? "Rudimento"} — Groovik Beta` }],
  }),
});

function RudimentDetail() {
  const { rudiment } = Route.useLoaderData() as { rudiment: Rudiment };
  const [bpm, setBpm] = useState(rudiment.defaultBpm);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [reps, setReps] = useState(0);

  const nextNoteTimeRef = useRef(0);
  const stepRef = useRef(0);
  const lookaheadRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

  const pattern = rudiment.pattern;
  const len = pattern.length;
  const display = useMemo(() => pattern.map((h) => (h === "R" ? "D" : "E")), [pattern]);

  // Scheduler
  useEffect(() => {
    if (!playing) return;
    const ac = getAudioCtx();
    if (!ac) return;

    nextNoteTimeRef.current = ac.currentTime + 0.06;
    stepRef.current = 0;
    startTimeRef.current = performance.now();

    const interval = () => 60 / bpm;
    const SCHEDULE_AHEAD = 0.12;

    const tick = () => {
      while (nextNoteTimeRef.current < ac.currentTime + SCHEDULE_AHEAD) {
        const stepIdx = stepRef.current;
        const localStep = stepIdx % len;
        const accent = localStep === 0;

        // Loop / one-shot control
        if (!loop && stepIdx >= len) {
          setPlaying(false);
          return;
        }

        scheduleSnare(nextNoteTimeRef.current, accent);

        const delay = (nextNoteTimeRef.current - ac.currentTime) * 1000;
        const stepCopy = localStep;
        window.setTimeout(() => {
          setActiveIdx(stepCopy);
          if (stepCopy === len - 1) setReps((r) => r + 1);
        }, Math.max(0, delay));

        nextNoteTimeRef.current += interval();
        stepRef.current++;
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
  }, [playing, bpm, len, loop]);

  const toggle = () => {
    getAudioCtx();
    if (playing) {
      setPlaying(false);
      setElapsed(0);
    } else {
      setReps(0);
      setPlaying(true);
    }
  };

  const reset = () => {
    setPlaying(false);
    setElapsed(0);
    setReps(0);
    setActiveIdx(-1);
  };

  const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const seconds = (elapsed % 60).toString().padStart(2, "0");
  const presets = [60, 80, 100, 120, 140, 160];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link to="/app/rudiments" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="w-4 h-4" /> Todos os rudimentos
      </Link>

      <header>
        <div className="text-xs font-mono uppercase tracking-widest text-primary mb-2">
          {RUDIMENT_CATEGORIES[rudiment.category]}
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">{rudiment.name}</h1>
        <p className="text-muted-foreground mt-2">{rudiment.description}</p>
      </header>

      {/* Sticking pattern preview */}
      <div className="rounded-2xl border bg-card/60 p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Padrão de mãos</div>
        <div className="flex flex-wrap gap-2 font-mono">
          {display.map((h, i) => (
            <span
              key={i}
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
              style={{
                color: h === "D" ? "var(--right-hand)" : "var(--left-hand)",
                background: h === "D" ? "oklch(0.72 0.19 45 / 0.15)" : "oklch(0.62 0.18 250 / 0.15)",
                border: `2px solid ${h === "D" ? "var(--right-hand)" : "var(--left-hand)"}`,
              }}
            >
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* Interactive practice */}
      <div className="rounded-2xl border bg-card/80 backdrop-blur shadow-card p-6 md:p-8 space-y-8">
        {/* Animated sticking */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 min-h-[110px]">
          {display.map((label, i) => {
            const isRight = label === "D";
            const active = i === activeIdx;
            return (
              <div
                key={i}
                className={cn(
                  "relative flex items-center justify-center rounded-full font-bold font-mono select-none transition-all duration-150",
                  "w-12 h-12 md:w-16 md:h-16 text-lg md:text-2xl",
                  active && "scale-110",
                )}
                style={{
                  color: isRight ? "var(--right-hand)" : "var(--left-hand)",
                  background: isRight ? "oklch(0.72 0.19 45 / 0.18)" : "oklch(0.62 0.18 250 / 0.18)",
                  border: `2px solid ${isRight ? "var(--right-hand)" : "var(--left-hand)"}`,
                  boxShadow: active
                    ? `0 0 28px ${isRight ? "oklch(0.72 0.19 45 / 0.7)" : "oklch(0.62 0.18 250 / 0.7)"}`
                    : "none",
                }}
              >
                {label}
                {active && (
                  <span
                    className="absolute inset-0 rounded-full animate-ripple pointer-events-none"
                    style={{ border: `2px solid ${isRight ? "var(--right-hand)" : "var(--left-hand)"}` }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* BPM */}
        <div className="text-center space-y-2">
          <div className="font-mono text-6xl md:text-7xl font-bold tabular-nums tracking-tight text-gradient">{bpm}</div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">BPM</div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <Button size="icon" variant="outline" onClick={() => setBpm((b) => Math.max(30, b - 1))}>
            <Minus className="w-4 h-4" />
          </Button>
          <Slider value={[bpm]} min={30} max={240} step={1} onValueChange={(v) => setBpm(v[0])} className="flex-1" />
          <Button size="icon" variant="outline" onClick={() => setBpm((b) => Math.min(240, b + 1))}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setBpm(p)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-mono border transition",
                bpm === p ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="font-mono text-sm text-muted-foreground tabular-nums">
            <div>{minutes}:{seconds}</div>
            <div className="text-[10px] uppercase tracking-widest">{reps} repetições</div>
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

          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant={loop ? "default" : "outline"}
              onClick={() => setLoop((l) => !l)}
              className="h-8"
            >
              <Repeat className="w-3 h-3 mr-1" /> Loop
            </Button>
            <Button size="sm" variant="outline" onClick={reset} className="h-8">
              <RotateCcw className="w-3 h-3 mr-1" /> Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
