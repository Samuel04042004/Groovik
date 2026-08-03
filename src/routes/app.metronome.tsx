import { createFileRoute } from "@tanstack/react-router";
import { Metronome } from "@/components/Metronome";

export const Route = createFileRoute("/app/metronome")({
  component: MetronomePage,
});

function MetronomePage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Metrônomo</h1>
        <p className="text-muted-foreground mt-1">D = mão direita · E = mão esquerda · som de caixa</p>
      </header>
      <Metronome pattern={["R", "L", "R", "L"]} initialBpm={90} exerciseType="metronome" />
    </div>
  );
}
