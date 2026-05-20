import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RUDIMENTS, RUDIMENT_CATEGORIES } from "@/lib/rudiments";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/rudiments")({
  component: RudimentsPage,
});

function RudimentsPage() {
  const [cat, setCat] = useState<keyof typeof RUDIMENT_CATEGORIES | "all">("all");
  const filtered = cat === "all" ? RUDIMENTS : RUDIMENTS.filter((r) => r.category === cat);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Os 40 Rudimentos</h1>
        <p className="text-muted-foreground mt-1">Toque em qualquer rudimento para praticar com metrônomo D/E.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(["all", ...Object.keys(RUDIMENT_CATEGORIES)] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c as any)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition",
              cat === c
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50",
            )}
          >
            {c === "all" ? "Todos" : RUDIMENT_CATEGORIES[c as keyof typeof RUDIMENT_CATEGORIES]}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((r, i) => (
          <Link
            key={r.id}
            to="/app/rudiments/$id"
            params={{ id: r.id }}
            className="group rounded-2xl border border-border bg-card/60 backdrop-blur p-5 hover:border-primary/50 hover:shadow-glow-orange transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                #{(i + 1).toString().padStart(2, "0")}
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3].map((d) => (
                  <span key={d} className={cn("w-1.5 h-1.5 rounded-full", d <= r.difficulty ? "bg-primary" : "bg-border")} />
                ))}
              </div>
            </div>
            <div className="font-bold group-hover:text-primary transition">{r.name}</div>
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</div>
            <div className="flex gap-1 mt-3 font-mono text-xs">
              {r.pattern.slice(0, 8).map((h, j) => (
                <span
                  key={j}
                  className="w-5 h-5 rounded-full flex items-center justify-center font-bold"
                  style={{
                    color: h === "R" ? "var(--right-hand)" : "var(--left-hand)",
                    background: h === "R" ? "oklch(0.72 0.19 45 / 0.15)" : "oklch(0.62 0.18 250 / 0.15)",
                  }}
                >
                  {h === "R" ? "D" : "E"}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
