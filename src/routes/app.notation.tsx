import { createFileRoute } from "@tanstack/react-router";
import { Metronome } from "@/components/Metronome";

export const Route = createFileRoute("/app/notation")({ component: Page });

function Page() {
  const pattern = ["R","L","R","L","R","L","R","L"];
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Notação Musical</h1>
        <p className="text-muted-foreground mt-1">Leia partitura com notas iluminadas em tempo real.</p>
      </header>

      <div className="rounded-2xl border bg-card/60 p-6 overflow-x-auto">
        <div className="flex items-end gap-1 min-h-[140px] border-b-2 border-foreground/40 pb-2">
          {pattern.map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="text-xs font-mono text-muted-foreground">{h === "R" ? "D" : "E"}</div>
              <div className="w-1 bg-foreground" style={{ height: 60 }} />
              <div className="w-3 h-3 rounded-full"
                style={{ background: h === "R" ? "var(--right-hand)" : "var(--left-hand)" }} />
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-3 font-mono">4/4 · semínimas alternadas</div>
      </div>

      <Metronome pattern={pattern} initialBpm={80} />
    </div>
  );
}
