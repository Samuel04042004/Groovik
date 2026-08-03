import { createFileRoute } from "@tanstack/react-router";
import { Metronome } from "@/components/Metronome";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/coordination")({ component: Page });

const CHALLENGES = [
  { id: "indep-1", name: "Independência básica", pattern: ["R","L","R","L"], bpm: 70 },
  { id: "indep-2", name: "Mãos cruzadas", pattern: ["L","R","L","R","R","L"], bpm: 80 },
  { id: "indep-3", name: "4 contra 3", pattern: ["R","L","L","R","L","R","R","L"], bpm: 90 },
];

function Page() {
  const [sel, setSel] = useState(CHALLENGES[0]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Coordenação</h1>
        <p className="text-muted-foreground mt-1">Desafios progressivos de independência.</p>
      </header>
      <div className="grid sm:grid-cols-3 gap-3">
        {CHALLENGES.map((c) => (
          <button key={c.id} onClick={() => setSel(c)}
            className={cn("text-left rounded-2xl border p-4 transition", sel.id === c.id ? "border-primary bg-primary/10" : "border-border bg-card/60 hover:border-primary/50")}>
            <div className="font-bold">{c.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.bpm} BPM</div>
          </button>
        ))}
      </div>
      <Metronome key={sel.id} pattern={sel.pattern} initialBpm={sel.bpm} exerciseType={sel.id.startsWith("indep") ? "coordination" : "rhythm"} exerciseId={sel.id} />
    </div>
  );
}
