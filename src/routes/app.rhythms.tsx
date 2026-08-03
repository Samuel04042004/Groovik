import { createFileRoute } from "@tanstack/react-router";
import { Metronome } from "@/components/Metronome";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/rhythms")({ component: Page });

const GROOVES = [
  { id: "rock-basic", name: "Rock Básico", level: "Iniciante", pattern: ["R","L","R","L","R","L","R","L"], bpm: 90 },
  { id: "shuffle", name: "Shuffle", level: "Intermediário", pattern: ["R","R","L","R","R","L"], bpm: 100 },
  { id: "samba", name: "Samba", level: "Intermediário", pattern: ["R","L","R","L","R","L","R","L"], bpm: 120 },
  { id: "funk-16", name: "Funk em 16", level: "Avançado", pattern: ["R","L","R","L","R","L","R","L","R","L","R","L","R","L","R","L"], bpm: 95 },
];

function Page() {
  const [sel, setSel] = useState(GROOVES[0]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Ritmos</h1>
        <p className="text-muted-foreground mt-1">Pratique grooves com visualização D/E.</p>
      </header>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {GROOVES.map((g) => (
          <button key={g.id} onClick={() => setSel(g)}
            className={cn("text-left rounded-2xl border p-4 transition", sel.id === g.id ? "border-primary bg-primary/10" : "border-border bg-card/60 hover:border-primary/50")}>
            <div className="text-xs text-muted-foreground">{g.level}</div>
            <div className="font-bold mt-1">{g.name}</div>
          </button>
        ))}
      </div>
      <Metronome key={sel.id} pattern={sel.pattern} initialBpm={sel.bpm} exerciseType={sel.id.startsWith("indep") ? "coordination" : "rhythm"} exerciseId={sel.id} />
    </div>
  );
}
