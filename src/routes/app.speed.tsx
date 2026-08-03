import { createFileRoute } from "@tanstack/react-router";
import { Metronome } from "@/components/Metronome";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/app/speed")({ component: Page });

function Page() {
  const [start, setStart] = useState(80);
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Treino de Velocidade</h1>
        <p className="text-muted-foreground mt-1">Aumente o BPM progressivamente para construir resistência.</p>
      </header>
      <div className="rounded-2xl border bg-card/60 p-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">BPM inicial</span>
          <span className="font-mono font-bold">{start}</span>
        </div>
        <Slider value={[start]} onValueChange={(v) => setStart(v[0])} min={40} max={200} step={5} />
      </div>
      <Metronome key={start} pattern={["R","L","R","L"]} initialBpm={start} exerciseType="speed" />
    </div>
  );
}
