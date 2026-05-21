import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, Store, GraduationCap, Flame, Target, Activity, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/elite/")({
  component: EliteHub,
});

const CARDS = [
  { to: "/app/elite/products", icon: Package, title: "Melhores Produtos", desc: "Kits, pratos, baquetas, pedais, fones e mais — selecionados por profissionais." },
  { to: "/app/elite/stores", icon: Store, title: "Lojas Brasileiras", desc: "Onde os pros compram no Brasil. Físicas e online, todas testadas." },
  { to: "/app/elite/courses", icon: GraduationCap, title: "Cursos Recomendados", desc: "Os melhores cursos online de bateria, gospel, groove e rudimentos." },
  { to: "/app/elite/gospel", icon: Flame, title: "Gospel Chops Academy", desc: "Padrões avançados, fills modernos e combinações de velocidade." },
  { to: "/app/elite/exercises", icon: Target, title: "Exercícios VIP", desc: "Treinos progressivos de velocidade, independência e resistência." },
  { to: "/app/metronome", icon: Activity, title: "Metrônomo Avançado", desc: "Modos extras: subdivisões, polirritmia e drops automáticos." },
];

function EliteHub() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {CARDS.map((c) => {
        const Icon = c.icon;
        return (
          <Link
            key={c.to}
            to={c.to}
            className="group rounded-2xl border border-elite-gold/20 bg-card/60 backdrop-blur p-5 hover:border-elite-gold/60 hover:shadow-glow-gold transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-elite-gold/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Icon className="w-5 h-5 text-elite-gold" />
            </div>
            <div className="font-bold flex items-center gap-1">{c.title} <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></div>
            <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{c.desc}</div>
          </Link>
        );
      })}
    </div>
  );
}
