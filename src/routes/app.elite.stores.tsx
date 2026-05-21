import { createFileRoute } from "@tanstack/react-router";
import { STORES } from "@/lib/elite-content";
import { MapPin, ExternalLink, Store as StoreIcon, Check } from "lucide-react";

export const Route = createFileRoute("/app/elite/stores")({
  component: StoresPage,
});

function StoresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Melhores Lojas do Brasil</h2>
        <p className="text-muted-foreground text-sm mt-1">Curadas por bateristas profissionais. Físicas, online e híbridas.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {STORES.map((s) => (
          <a
            key={s.id}
            href={s.url ?? "#"}
            target={s.url ? "_blank" : undefined}
            rel="noreferrer"
            className="group rounded-2xl border border-elite-gold/20 bg-card/60 backdrop-blur p-5 hover:border-elite-gold/60 hover:shadow-glow-gold transition-all flex flex-col"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-elite-gold/15 flex items-center justify-center shrink-0">
                <StoreIcon className="w-5 h-5 text-elite-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold text-lg">{s.name}</h3>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/50">{s.type}</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {s.city}
                </div>
              </div>
              {s.url && <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-elite-gold transition" />}
            </div>

            <ul className="mt-4 space-y-1.5">
              {s.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm">
                  <Check className="w-3.5 h-3.5 text-elite-gold mt-0.5 shrink-0" /> {h}
                </li>
              ))}
            </ul>
          </a>
        ))}
      </div>
    </div>
  );
}
