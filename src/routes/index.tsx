import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Music2, Zap, Target, Activity, Hand, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Groovik Beta — Aprenda Bateria de Forma Interativa" },
      { name: "description", content: "Domine os 40 rudimentos oficiais, ritmos e timing através de prática interativa. Sem vídeo-aulas, só prática real." },
    ],
  }),
});

function Landing() {
  const { session, profile, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (session && profile) {
      const target = profile.onboarded ? "/app" : "/onboarding";
      console.log("[landing] authenticated user detected, redirecting", { target, path: window.location.pathname });
      nav({ to: target, replace: true });
    }
  }, [loading, session, profile, nav]);
  return (
    <div className="min-h-screen">
      <header className="px-6 md:px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-orange">
            <Music2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">Groovik<sup className="ml-1 text-[9px] font-mono uppercase tracking-widest text-primary align-super">Beta</sup></span>
        </div>
        <Link to="/auth">
          <Button variant="ghost" size="sm">Entrar</Button>
        </Link>
      </header>

      <section className="px-6 md:px-10 pt-12 md:pt-24 pb-16 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 backdrop-blur text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Prática interativa real
        </div>
        <h1 className="font-display font-bold tracking-tight text-5xl md:text-7xl lg:text-8xl leading-[0.95]">
          Aprenda bateria <br />
          <span className="text-gradient">batendo de verdade.</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Sem vídeo-aulas. Sem teoria infinita. Você pratica os 40 rudimentos oficiais
          com metrônomo D/E, feedback visual em tempo real e progressão gamificada.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow-orange h-12 px-7 rounded-xl text-base">
              Começar grátis <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* D/E preview */}
        <div className="mt-16 flex items-center justify-center gap-4 md:gap-6">
          {["D", "E", "D", "E"].map((l, i) => {
            const right = l === "D";
            return (
              <div
                key={i}
                className="w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center font-mono font-bold text-2xl md:text-4xl border-2"
                style={{
                  color: right ? "var(--right-hand)" : "var(--left-hand)",
                  borderColor: right ? "var(--right-hand)" : "var(--left-hand)",
                  background: right ? "oklch(0.72 0.19 45 / 0.15)" : "oklch(0.62 0.18 250 / 0.15)",
                  animationDelay: `${i * 0.15}s`,
                  animation: "drum-pulse 1.2s ease-in-out infinite",
                }}
              >
                {l}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          D = mão direita · E = mão esquerda
        </p>
      </section>

      <section className="px-6 md:px-10 pb-24 max-w-6xl mx-auto grid md:grid-cols-3 gap-4">
        {[
          { icon: Music2, t: "40 Rudimentos Oficiais", d: "Da single stroke ao triple ratamacue, todos com prática guiada." },
          { icon: Activity, t: "Metrônomo D/E", d: "Visualize cada toque com som de caixa de baixa latência." },
          { icon: Target, t: "Prática Livre", d: "Crie rotinas, ajuste BPM, salve favoritos." },
          { icon: Hand, t: "Coordenação", d: "Desafios progressivos para independência de mãos e pés." },
          { icon: Zap, t: "Gamificação", d: "XP, níveis, badges e sequência de dias." },
          { icon: Activity, t: "Velocidade", d: "BPM progressivo para construir resistência." },
        ].map((f, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 hover:border-primary/40 transition">
            <f.icon className="w-6 h-6 text-primary mb-3" />
            <div className="font-bold mb-1">{f.t}</div>
            <div className="text-sm text-muted-foreground">{f.d}</div>
          </div>
        ))}
      </section>

      <footer className="px-6 md:px-10 py-8 border-t border-border text-center text-xs text-muted-foreground">
        © 2026 Groovik Beta · Feito para bateristas
      </footer>
    </div>
  );
}
