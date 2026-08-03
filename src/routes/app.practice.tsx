import { createFileRoute } from "@tanstack/react-router";
import { Metronome } from "@/components/Metronome";
import { useState } from "react";
import { RUDIMENTS } from "@/lib/rudiments";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/practice")({ component: Page });

function Page() {
  const [sel, setSel] = useState(RUDIMENTS[0]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Prática Livre</h1>
        <p className="text-muted-foreground mt-1">Escolha qualquer rudimento e ajuste o seu BPM.</p>
      </header>
      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto rounded-2xl border bg-card/40 p-3">
        {RUDIMENTS.map((r) => (
          <button key={r.id} onClick={() => setSel(r)}
            className={cn("px-3 py-1.5 rounded-full text-xs border", sel.id === r.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50")}>
            {r.name}
          </button>
        ))}
      </div>
      <Metronome key={sel.id} pattern={sel.pattern} initialBpm={sel.defaultBpm} exerciseType="practice" exerciseId={sel.id} />
    </div>
  );
}
