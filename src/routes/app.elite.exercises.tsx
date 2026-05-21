import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ELITE_EXERCISES } from "@/lib/elite-content";
import { Target, Timer, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/elite/exercises")({
  component: ExercisesPage,
});

const CATS = ["Todos", "Rudimentos Avançados", "Velocidade", "Coordenação", "Independência", "Resistência", "Timing"] as const;

function ExercisesPage() {
  const [filter, setFilter] = useState<typeof CATS[number]>("Todos");
  const list = useMemo(
    () => (filter === "Todos" ? ELITE_EXERCISES : ELITE_EXERCISES.filter((e) => e.category === filter)),
    [filter],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-elite-gold" /> Exercícios VIP
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Treinos progressivos para destravar velocidade, independência e timing profissional.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition",
              filter === c
                ? "bg-elite-gold text-elite-foreground border-elite-gold"
                : "border-border text-muted-foreground hover:text-foreground hover:border-elite-gold/40",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {list.map((e) => (
          <article
            key={e.id}
            className="rounded-2xl border border-elite-gold/20 bg-card/60 backdrop-blur p-5 hover:border-elite-gold/60 transition-all"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-elite-gold/15 text-elite-gold">{e.category}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" /> {e.durationMin} min</span>
            </div>
            <h3 className="font-display font-bold text-lg leading-tight">{e.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{e.description}</p>

            <div className="mt-4 flex items-center gap-2 text-xs">
              <Gauge className="w-3.5 h-3.5 text-elite-gold" />
              <div className="flex-1 h-1.5 rounded-full bg-accent/60 overflow-hidden">
                <div className="h-full bg-gradient-gold" style={{ width: `${Math.min(100, (e.bpmStart / e.bpmTarget) * 100)}%` }} />
              </div>
              <span className="font-mono tabular-nums">{e.bpmStart} → {e.bpmTarget} BPM</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
