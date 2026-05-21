import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PRODUCT_CATEGORIES } from "@/lib/elite-content";
import { Star, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/elite/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const [active, setActive] = useState(PRODUCT_CATEGORIES[0].id);
  const cat = PRODUCT_CATEGORIES.find((c) => c.id === active)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PRODUCT_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition",
              active === c.id
                ? "bg-elite-gold text-elite-foreground border-elite-gold"
                : "border-border text-muted-foreground hover:text-foreground hover:border-elite-gold/40",
            )}
          >
            {c.title.replace("Melhores ", "")}
          </button>
        ))}
      </div>

      <div>
        <h2 className="font-display text-2xl font-bold">{cat.title}</h2>
        <p className="text-muted-foreground text-sm mt-1">{cat.subtitle}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cat.items.map((p) => (
          <article
            key={p.id}
            className="rounded-2xl border border-elite-gold/20 bg-card/60 backdrop-blur p-5 hover:border-elite-gold/60 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-elite-gold">{p.brand}</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/50">{p.level}</span>
            </div>
            <h3 className="font-display font-bold text-lg leading-tight">{p.name}</h3>
            <div className="text-2xl font-display font-bold text-gradient-gold mt-2">{p.price}</div>

            <ul className="mt-4 space-y-1.5">
              {p.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm">
                  <Star className="w-3.5 h-3.5 text-elite-gold mt-1 shrink-0" /> {h}
                </li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground mt-4 italic flex gap-2">
              <Crown className="w-3 h-3 text-elite-gold shrink-0 mt-0.5" /> {p.why}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
