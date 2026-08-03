import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useProgress } from "@/lib/progress";
import { Flame, Zap, Trophy, Timer, Activity, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/progress")({ component: ProgressPage });

const MODULE_LABELS: Record<string, string> = {
  metronome: "Metrônomo",
  rudiment: "Rudimento",
  rhythm: "Ritmo",
  coordination: "Coordenação",
  speed: "Velocidade",
  practice: "Prática livre",
  notation: "Notação",
  "drum-pad": "Drum Pad",
};

function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

function ProgressPage() {
  const { profile, isGuest } = useAuth();
  const { stats, loading } = useProgress();

  const xpInLevel = (profile?.xp ?? 0) % 100;
  const maxDay = Math.max(1, ...stats.perDay.map((d) => d.seconds));

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Meu Progresso</h1>
        <p className="text-muted-foreground mt-1">
          {isGuest
            ? "Seu progresso está salvo apenas neste dispositivo (modo visitante)."
            : "Seu progresso é sincronizado com a sua conta."}
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card icon={Zap} label="XP total" value={profile?.xp ?? 0} />
        <Card icon={Trophy} label="Nível" value={profile?.level ?? 1} hint={`${xpInLevel}/100`} />
        <Card icon={Flame} label="Sequência" value={`${profile?.streak_days ?? 0}d`} />
        <Card icon={Timer} label="Tempo total" value={fmtDuration(stats.totalSeconds)} />
      </div>

      {/* Weekly chart */}
      <section className="rounded-2xl border bg-card/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h2 className="font-display font-bold">Últimos 7 dias</h2>
        </div>
        <div className="flex items-end gap-2 h-36">
          {stats.perDay.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex-1 flex items-end">
                <div
                  className={cn(
                    "w-full rounded-t-lg bg-gradient-primary transition-all",
                    d.seconds === 0 && "bg-none bg-border/50",
                  )}
                  style={{ height: `${Math.max(4, (d.seconds / maxDay) * 100)}%` }}
                  title={`${fmtDuration(d.seconds)} · ${d.xp} XP`}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* BPM records */}
      {Object.keys(stats.bestBpm).length > 0 && (
        <section className="rounded-2xl border bg-card/60 p-5">
          <h2 className="font-display font-bold mb-3">Recordes de BPM</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.bestBpm).map(([id, bpm]) => (
              <span key={id} className="px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs font-mono">
                {id} · {bpm} BPM
              </span>
            ))}
          </div>
        </section>
      )}

      {/* History */}
      <section className="rounded-2xl border bg-card/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="font-display font-bold">Histórico de sessões</h2>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : stats.sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma sessão registrada ainda. Toque o metrônomo por pelo menos 5 segundos para ganhar XP.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {stats.sessions.slice(0, 25).map((s) => (
              <li key={s.id} className="py-2.5 flex items-center gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {MODULE_LABELS[s.exercise_type] ?? s.exercise_type}
                    {s.exercise_id ? <span className="text-muted-foreground"> · {s.exercise_id}</span> : null}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {new Date(s.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    {s.bpm ? ` · ${s.bpm} BPM` : ""}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-xs text-muted-foreground">{fmtDuration(s.duration_seconds)}</div>
                  <div className="font-mono text-xs text-primary font-bold">+{s.xp_earned} XP</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({ icon: Icon, label, value, hint }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4">
      <Icon className="w-4 h-4 text-primary mb-2" />
      <div className="font-display text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">
        {label} {hint && <span className="opacity-60">{hint}</span>}
      </div>
    </div>
  );
}
