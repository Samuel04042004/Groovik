import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getRudiment, RUDIMENT_CATEGORIES } from "@/lib/rudiments";
import { Metronome } from "@/components/Metronome";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/app/rudiments/$id")({
  component: RudimentDetail,
  loader: ({ params }) => {
    const r = getRudiment(params.id);
    if (!r) throw notFound();
    return { rudiment: r };
  },
});

function RudimentDetail() {
  const { rudiment } = Route.useLoaderData();
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

      <div className="rounded-2xl border bg-card/60 p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Padrão</div>
        <div className="flex flex-wrap gap-2 font-mono">
          {rudiment.pattern.map((h, i) => (
            <span
              key={i}
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
              style={{
                color: h === "R" ? "var(--right-hand)" : "var(--left-hand)",
                background: h === "R" ? "oklch(0.72 0.19 45 / 0.15)" : "oklch(0.62 0.18 250 / 0.15)",
                border: `2px solid ${h === "R" ? "var(--right-hand)" : "var(--left-hand)"}`,
              }}
            >
              {h === "R" ? "D" : "E"}
            </span>
          ))}
        </div>
      </div>

      <Metronome pattern={rudiment.pattern} initialBpm={rudiment.defaultBpm} />
    </div>
  );
}
