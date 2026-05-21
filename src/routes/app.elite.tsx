import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { Crown, Sparkles, Package, Store, GraduationCap, Flame, Target } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/elite")({
  component: EliteLayout,
});

const TABS = [
  { to: "/app/elite", label: "Visão Geral", icon: Sparkles, exact: true },
  { to: "/app/elite/products", label: "Produtos", icon: Package },
  { to: "/app/elite/stores", label: "Lojas BR", icon: Store },
  { to: "/app/elite/courses", label: "Cursos", icon: GraduationCap },
  { to: "/app/elite/gospel", label: "Gospel Chops", icon: Flame },
  { to: "/app/elite/exercises", label: "Exercícios VIP", icon: Target },
];

function EliteLayout() {
  const { profile } = useAuth();
  const loc = useLocation();
  const isPurchase = loc.pathname.startsWith("/app/elite/purchase");

  // Paywall: not premium and not on purchase page
  if (!profile?.is_premium && !isPurchase) {
    return <Paywall />;
  }

  return (
    <div className="space-y-6">
      {!isPurchase && (
        <>
          <header className="rounded-3xl border border-elite-gold/30 bg-gradient-elite p-6 md:p-8 shadow-glow-gold relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top_right,oklch(0.85_0.16_85_/_0.6),transparent_60%)]" />
            <div className="relative flex items-center gap-3 mb-2">
              <Crown className="w-6 h-6 text-elite-gold" />
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-elite-gold">Drum Elite VIP</span>
            </div>
            <h1 className="relative font-display text-3xl md:text-5xl font-bold tracking-tight">
              Bem-vindo ao <span className="text-gradient-gold">clube dos profissionais</span>
            </h1>
            <p className="relative text-muted-foreground mt-2 max-w-2xl">
              Conteúdo curado, listas premium, gospel chops, exercícios VIP e ferramentas avançadas — tudo desbloqueado para sempre.
            </p>
          </header>

          <nav className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition",
                    active
                      ? "border-elite-gold/60 bg-elite-gold/15 text-elite-gold"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-elite-gold/30",
                  )}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </Link>
              );
            })}
          </nav>
        </>
      )}

      <Outlet />
    </div>
  );
}

function Paywall() {
  const features = [
    "Listas curadas dos melhores equipamentos do mundo",
    "Recomendações de lojas confiáveis no Brasil",
    "Top cursos online de bateria (nacionais e internacionais)",
    "Gospel Chops Academy com padrões avançados",
    "Mais de 10 exercícios VIP de velocidade e independência",
    "Ferramentas premium e estatísticas avançadas",
    "Acesso vitalício — pague uma vez e use para sempre",
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-elite-gold/30 bg-gradient-elite p-8 md:p-12 shadow-glow-gold relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_top_left,oklch(0.85_0.16_85_/_0.5),transparent_60%)]" />
        <div className="relative max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-elite-gold" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-elite-gold">Acesso Bloqueado</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Desbloqueie o <span className="text-gradient-gold">Drum Elite</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            A área VIP do BatePro: o que os profissionais usam, onde compram, e os exercícios que separam amadores de feras.
          </p>

          <Link
            to="/app/elite/purchase"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full bg-gradient-gold text-elite-foreground font-bold shadow-glow-gold hover:scale-105 transition-transform"
          >
            <Sparkles className="w-4 h-4" /> Quero acesso vitalício por R$ 47,90
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {features.map((f) => (
          <div key={f} className="flex items-start gap-3 rounded-2xl border border-border bg-card/50 backdrop-blur p-4">
            <div className="w-6 h-6 rounded-full bg-elite-gold/15 flex items-center justify-center shrink-0 mt-0.5">
              <Crown className="w-3.5 h-3.5 text-elite-gold" />
            </div>
            <span className="text-sm">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
