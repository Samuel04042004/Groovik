import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { getRudiment, RUDIMENT_CATEGORIES, type Rudiment } from "@/lib/rudiments";
import { Metronome } from "@/components/Metronome";
import { useProgress } from "@/lib/progress";
import { ArrowLeft, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/rudiments/$id")({
  component: RudimentDetail,
  loader: ({ params }) => {
    const r = getRudiment(params.id);
    if (!r) throw notFound();
    return { rudiment: r };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${(loaderData as any)?.rudiment?.name ?? "Rudimento"} — Groovik Beta` }],
  }),
});

function RudimentDetail() {
  const { rudiment } = Route.useLoaderData() as { rudiment: Rudiment };
  const { isFavorite, toggleFavorite, stats } = useProgress();
  const fav = isFavorite(rudiment.id);
  const best = stats.bestBpm[rudiment.id];

  const display = useMemo(
    () => rudiment.pattern.map((h) => (h === "R" ? "D" : "E")),
    [rudiment.pattern],
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link
        to="/app/rudiments"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="w-4 h-4" /> Todos os rudimentos
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-mono uppercase tracking-widest text-primary mb-2">
            {RUDIMENT_CATEGORIES[rudiment.category]}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">{rudiment.name}</h1>
          <p className="text-muted-foreground mt-2">{rudiment.description}</p>
          {best ? (
            <p className="text-xs font-mono text-primary mt-2">Seu recorde: {best} BPM</p>
          ) : null}
        </div>
        <button
          onClick={() => toggleFavorite(rudiment.id)}
          aria-label="Favoritar rudimento"
          className={cn(
            "shrink-0 w-11 h-11 rounded-full border flex items-center justify-center transition",
            fav ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/50",
          )}
        >
          <Heart className={cn("w-5 h-5", fav && "fill-current")} />
        </button>
      </header>

      {/* Sticking pattern preview */}
      <div className="rounded-2xl border bg-card/60 p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Padrão de mãos</div>
        <div className="flex flex-wrap gap-2 font-mono">
          {display.map((h, i) => (
            <span
              key={i}
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
              style={{
                color: h === "D" ? "var(--right-hand)" : "var(--left-hand)",
                background: h === "D" ? "oklch(0.72 0.19 45 / 0.15)" : "oklch(0.62 0.18 250 / 0.15)",
                border: `2px solid ${h === "D" ? "var(--right-hand)" : "var(--left-hand)"}`,
              }}
            >
              {h}
            </span>
          ))}
        </div>
      </div>

      <Metronome
        key={rudiment.id}
        pattern={rudiment.pattern}
        initialBpm={rudiment.defaultBpm}
        exerciseType="rudiment"
        exerciseId={rudiment.id}
      />
    </div>
  );
}
