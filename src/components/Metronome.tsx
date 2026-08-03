import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Plus, Minus, Hand, Volume2, Settings2, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAudioCtx,
  scheduleClick,
  setMasterVolume,
  CLICK_SOUNDS,
  type ClickSound,
} from "@/lib/drum-audio";
import { useProgress } from "@/lib/progress";
import { toast } from "sonner";

type Props = {
  /** "R"/"L" sticking. Defaults to alternating hands. */
  pattern?: string[];
  initialBpm?: number;
  accentFirst?: boolean;
  onTick?: (idx: number) => void;
  /** Module name recorded with the practice session. */
  exerciseType?: string;
  exerciseId?: string | null;
  /** Set false to disable automatic session recording. */
  trackProgress?: boolean;
};

const TIME_SIGNATURES = [
  { id: "2/4", beats: 2, unit: 4 },
  { id: "3/4", beats: 3, unit: 4 },
  { id: "4/4", beats: 4, unit: 4 },
  { id: "5/4", beats: 5, unit: 4 },
  { id: "6/8", beats: 6, unit: 8 },
  { id: "7/8", beats: 7, unit: 8 },
  { id: "9/8", beats: 9, unit: 8 },
  { id: "12/8", beats: 12, unit: 8 },
];

const SUBDIVISIONS = [
  { id: 1, label: "Semínima", sym: "♩" },
  { id: 2, label: "Colcheias", sym: "♫" },
  { id: 3, label: "Tercinas", sym: "3" },
  { id: 4, label: "Semicolcheias", sym: "♬" },
];

const MIN_BPM = 20;
const MAX_BPM = 300;

export function Metronome({
  pattern,
  initialBpm = 90,
  accentFirst = true,
  onTick,
  exerciseType = "metronome",
  exerciseId = null,
  trackProgress = true,
}: Props) {
  const { recordSession } = useProgress();

  const [bpm, setBpm] = useState(Math.min(MAX_BPM, Math.max(MIN_BPM, initialBpm)));
  const [playing, setPlaying] = useState(false);
  const [sigId, setSigId] = useState("4/4");
  const [sub, setSub] = useState(1);
  const [sound, setSound] = useState<ClickSound>("snare");
  const [volume, setVolume] = useState(0.9);
  const [countInBars, setCountInBars] = useState(0);
  const [countingIn, setCountingIn] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [tapHint, setTapHint] = useState<string | null>(null);

  const sig = TIME_SIGNATURES.find((s) => s.id === sigId) ?? TIME_SIGNATURES[2];
  const beats = sig.beats;

  // accents[beat]: 2 = accent, 1 = normal, 0 = muted
  const [accents, setAccents] = useState<number[]>(() =>
    Array.from({ length: 4 }, (_, i) => (i === 0 && accentFirst ? 2 : 1)),
  );

  useEffect(() => {
    setAccents((prev) =>
      Array.from({ length: beats }, (_, i) => prev[i] ?? (i === 0 && accentFirst ? 2 : 1)),
    );
  }, [beats, accentFirst]);

  useEffect(() => setMasterVolume(volume), [volume]);

  // Live values for the scheduler (avoids restarting the audio clock).
  const live = useRef({ bpm, beats, sub, sound, accents, unit: sig.unit });
  live.current = { bpm, beats, sub, sound, accents, unit: sig.unit };

  const nextNoteTimeRef = useRef(0);
  const stepRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const countInStepsRef = useRef(0);

  const totalSteps = beats * sub;

  const hands = useMemo(() => {
    const len = totalSteps;
    if (pattern && pattern.length) {
      return Array.from({ length: len }, (_, i) => (pattern[i % pattern.length] === "R" ? "D" : "E"));
    }
    return Array.from({ length: len }, (_, i) => (i % 2 === 0 ? "D" : "E"));
  }, [pattern, totalSteps]);

  /* --------------------------- Scheduler --------------------------- */
  useEffect(() => {
    if (!playing) return;
    const ac = getAudioCtx();
    if (!ac) return;

    nextNoteTimeRef.current = ac.currentTime + 0.08;
    stepRef.current = 0;
    startTimeRef.current = performance.now();
    countInStepsRef.current = countInBars * beats * sub;
    setCountingIn(countInBars > 0 ? countInBars * beats : 0);

    const SCHEDULE_AHEAD = 0.15;

    const tick = () => {
      const l = live.current;
      const stepsPerBar = l.beats * l.sub;
      // Note value scaling: an 8-based signature counts eighth notes.
      const beatSeconds = (60 / l.bpm) * (l.unit === 8 ? 0.5 : 1);
      const stepSeconds = beatSeconds / l.sub;

      while (nextNoteTimeRef.current < ac.currentTime + SCHEDULE_AHEAD) {
        const abs = stepRef.current;
        const inCountIn = abs < countInStepsRef.current;
        const local = (abs - (inCountIn ? 0 : countInStepsRef.current)) % stepsPerBar;
        const beatIdx = Math.floor(local / l.sub);
        const isBeat = local % l.sub === 0;
        const accent = l.accents[beatIdx] ?? 1;

        if (inCountIn) {
          if (isBeat) scheduleClick(nextNoteTimeRef.current, "click", beatIdx === 0 ? "accent" : "normal");
        } else if (isBeat) {
          if (accent > 0) {
            scheduleClick(nextNoteTimeRef.current, l.sound, accent === 2 ? "accent" : "normal");
          }
        } else {
          scheduleClick(nextNoteTimeRef.current, l.sound, "sub");
        }

        const delay = (nextNoteTimeRef.current - ac.currentTime) * 1000;
        const localCopy = local;
        const countInCopy = inCountIn;
        const absCopy = abs;
        window.setTimeout(() => {
          if (countInCopy) {
            setCountingIn(Math.max(0, countInStepsRef.current / l.sub - Math.floor(absCopy / l.sub) - 1) + 1);
            setActiveStep(-1);
          } else {
            setCountingIn(0);
            setActiveStep(localCopy);
            onTick?.(localCopy);
          }
        }, Math.max(0, delay));

        nextNoteTimeRef.current += stepSeconds;
        stepRef.current++;
      }
      timerRef.current = window.setTimeout(tick, 25);
    };
    tick();

    const elapsedT = window.setInterval(() => {
      setElapsed(Math.floor((performance.now() - startTimeRef.current) / 1000));
    }, 500);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.clearInterval(elapsedT);
      setActiveStep(-1);
      setCountingIn(0);
    };
    // Only (re)start on play/stop — everything else is read live from refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  /* ------------------------- Session saving ------------------------ */
  const finishSession = useCallback(
    async (seconds: number) => {
      if (!trackProgress || seconds < 5) return;
      const res = await recordSession({
        exercise_type: exerciseType,
        exercise_id: exerciseId,
        bpm,
        duration_seconds: seconds,
      });
      if (res) {
        toast.success(`+${res.xp_earned} XP`, {
          description: `Nível ${res.level} · sequência de ${res.streak_days} dia(s)`,
        });
      }
    },
    [trackProgress, recordSession, exerciseType, exerciseId, bpm],
  );

  const toggle = () => {
    getAudioCtx();
    if (playing) {
      const seconds = Math.floor((performance.now() - startTimeRef.current) / 1000);
      setPlaying(false);
      setElapsed(0);
      void finishSession(seconds);
    } else {
      setElapsed(0);
      setPlaying(true);
    }
  };

  // Save progress if the user leaves mid-session.
  useEffect(() => {
    return () => {
      if (playing) {
        const seconds = Math.floor((performance.now() - startTimeRef.current) / 1000);
        void finishSession(seconds);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  /* ---------------------------- Tap tempo -------------------------- */
  const tapsRef = useRef<number[]>([]);
  const tap = () => {
    getAudioCtx();
    const now = performance.now();
    const taps = tapsRef.current.filter((t) => now - t < 2500);
    taps.push(now);
    tapsRef.current = taps.slice(-6);
    if (tapsRef.current.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < tapsRef.current.length; i++) {
        gaps.push(tapsRef.current[i] - tapsRef.current[i - 1]);
      }
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const next = Math.round(60000 / avg);
      if (next >= MIN_BPM && next <= MAX_BPM) {
        setBpm(next);
        setTapHint(`${next} BPM`);
      }
    } else {
      setTapHint("Continue tocando…");
    }
    if (!playing) scheduleClick((getAudioCtx()?.currentTime ?? 0) + 0.001, "click", "normal");
  };

  const cycleAccent = (i: number) =>
    setAccents((a) => a.map((v, idx) => (idx === i ? (v + 1) % 3 : v)));

  const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const seconds = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div className="rounded-2xl border bg-card/80 backdrop-blur shadow-card p-4 sm:p-6 md:p-8 space-y-7">
      {/* Beat visualization */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 min-h-[96px]">
        {countingIn > 0 ? (
          <div className="font-display text-6xl font-bold text-primary animate-pulse tabular-nums">
            {countingIn}
          </div>
        ) : (
          hands.map((label, i) => {
            const isRight = label === "D";
            const active = i === activeStep;
            const isBeat = i % sub === 0;
            const muted = (accents[Math.floor(i / sub)] ?? 1) === 0 && isBeat;
            return (
              <div
                key={i}
                className={cn(
                  "relative flex items-center justify-center rounded-full font-bold font-mono select-none transition-all duration-150",
                  isBeat ? "w-12 h-12 md:w-16 md:h-16 text-lg md:text-2xl" : "w-8 h-8 md:w-10 md:h-10 text-xs md:text-sm opacity-70",
                  isRight
                    ? "bg-[oklch(0.72_0.19_45/0.18)] border-2 border-primary/40"
                    : "bg-[oklch(0.62_0.18_250/0.18)] border-2 border-secondary/40",
                  muted && "opacity-25",
                  active && (isRight ? "shadow-glow-orange scale-110" : "shadow-glow-blue scale-110"),
                )}
                style={{ color: isRight ? "var(--right-hand)" : "var(--left-hand)" }}
              >
                {label}
                {active && (
                  <span
                    className="absolute inset-0 rounded-full animate-ripple"
                    style={{ border: `2px solid ${isRight ? "var(--right-hand)" : "var(--left-hand)"}` }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* BPM */}
      <div className="text-center space-y-1">
        <div className="font-mono text-5xl md:text-7xl font-bold tabular-nums tracking-tight text-gradient">
          {bpm}
        </div>
        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          BPM · {sigId} · {SUBDIVISIONS.find((s) => s.id === sub)?.sym}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button size="icon" variant="outline" onClick={() => setBpm((b) => Math.max(MIN_BPM, b - 1))}>
          <Minus className="w-4 h-4" />
        </Button>
        <Slider
          value={[bpm]}
          min={MIN_BPM}
          max={MAX_BPM}
          step={1}
          onValueChange={(v) => setBpm(v[0])}
          className="flex-1"
        />
        <Button size="icon" variant="outline" onClick={() => setBpm((b) => Math.min(MAX_BPM, b + 1))}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Presets + tap */}
      <div className="flex flex-wrap gap-2 justify-center items-center">
        {[60, 80, 100, 120, 160, 200].map((p) => (
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
        <button
          onClick={tap}
          className="px-4 py-1.5 rounded-full text-sm font-semibold border border-secondary/50 text-secondary hover:bg-secondary/10 transition inline-flex items-center gap-1.5 active:scale-95"
        >
          <Hand className="w-3.5 h-3.5" /> Tap tempo
        </button>
        {tapHint && <span className="text-xs font-mono text-muted-foreground">{tapHint}</span>}
      </div>

      {/* Transport */}
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm text-muted-foreground tabular-nums flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5" /> {minutes}:{seconds}
        </div>
        <Button
          size="lg"
          onClick={toggle}
          className={cn(
            "rounded-full h-16 w-16 p-0 shadow-glow-orange transition-transform active:scale-95",
            "bg-gradient-primary text-primary-foreground hover:opacity-95",
          )}
          aria-label={playing ? "Parar" : "Tocar"}
        >
          {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
        </Button>
        <button
          onClick={() => setShowAdvanced((s) => !s)}
          className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary inline-flex items-center gap-1.5"
        >
          <Settings2 className="w-3.5 h-3.5" /> Ajustes
        </button>
      </div>

      {/* Advanced panel */}
      {showAdvanced && (
        <div className="space-y-6 border-t border-border/60 pt-6">
          {/* Time signature */}
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Compasso</div>
            <div className="flex flex-wrap gap-2">
              {TIME_SIGNATURES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSigId(s.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-mono border transition",
                    sigId === s.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {s.id}
                </button>
              ))}
            </div>
          </div>

          {/* Subdivision */}
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Subdivisão</div>
            <div className="flex flex-wrap gap-2">
              {SUBDIVISIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSub(s.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm border transition",
                    sub === s.id
                      ? "bg-secondary text-secondary-foreground border-secondary"
                      : "border-border text-muted-foreground hover:border-secondary/50",
                  )}
                >
                  <span className="font-mono mr-1.5">{s.sym}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accent pattern */}
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Acentos (toque para alternar: forte · normal · mudo)
            </div>
            <div className="flex flex-wrap gap-2">
              {accents.map((a, i) => (
                <button
                  key={i}
                  onClick={() => cycleAccent(i)}
                  className={cn(
                    "w-10 h-10 rounded-lg border font-mono text-sm font-bold transition",
                    a === 2 && "bg-primary text-primary-foreground border-primary",
                    a === 1 && "border-border text-foreground",
                    a === 0 && "border-dashed border-border text-muted-foreground/40",
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Sound */}
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Som do clique</div>
            <div className="flex flex-wrap gap-2">
              {CLICK_SOUNDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSound(s.id);
                    const ac = getAudioCtx();
                    if (ac) scheduleClick(ac.currentTime + 0.01, s.id, "accent");
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm border transition",
                    sound === s.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Count-in */}
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Contagem inicial</div>
            <div className="flex gap-2">
              {[0, 1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => setCountInBars(n)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm border transition",
                    countInBars === n
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {n === 0 ? "Desligada" : `${n} compasso${n > 1 ? "s" : ""}`}
                </button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> Volume
            </div>
            <Slider value={[volume]} min={0} max={1.4} step={0.05} onValueChange={(v) => setVolume(v[0])} />
          </div>
        </div>
      )}
    </div>
  );
}
