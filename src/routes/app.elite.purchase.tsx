import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Crown, Check, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/elite/purchase")({
  component: PurchasePage,
});

const FREE = [
  "40 rudimentos básicos",
  "Metrônomo D/E",
  "Notação básica",
  "Prática livre simples",
];

const VIP = [
  "Tudo do plano gratuito",
  "Listas curadas dos melhores equipamentos",
  "Lojas brasileiras recomendadas",
  "Cursos online selecionados",
  "Gospel Chops Academy completa",
  "10+ exercícios VIP avançados",
  "Ferramentas premium de prática",
  "Estatísticas VIP detalhadas",
  "Acesso vitalício — sem mensalidade",
];

function PurchasePage() {
  const { user, profile, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const handleUnlock = async () => {
    if (!user) return;
    setLoading(true);
    // NOTE: integração real de pagamento (Stripe/Paddle) entrará aqui.
    // Por enquanto, ativamos imediatamente para fins de demonstração.
    const { error } = await supabase
      .from("profiles")
      .update({ is_premium: true, premium_since: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      toast.error("Não foi possível ativar o Elite. Tente novamente.");
      setLoading(false);
      return;
    }

    await refreshProfile();
    setUnlocked(true);
    setTimeout(() => {
      setLoading(false);
      nav({ to: "/app/elite" });
    }, 1600);
  };

  if (profile?.is_premium && !unlocked) {
    return (
      <div className="rounded-3xl border border-elite-gold/40 bg-gradient-elite p-8 text-center">
        <Crown className="w-10 h-10 text-elite-gold mx-auto mb-3" />
        <h2 className="font-display text-2xl font-bold">Você já é Drum Elite</h2>
        <p className="text-muted-foreground mt-2">Aproveite todo o conteúdo VIP — é vitalício.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-elite-gold/40 bg-elite-gold/10 mb-4">
          <Crown className="w-3.5 h-3.5 text-elite-gold" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-elite-gold font-mono">Drum Elite VIP</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Pague <span className="text-gradient-gold">uma vez</span>, evolua para sempre
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Sem mensalidade. Sem renovação. Acesso vitalício ao conteúdo premium do BatePro.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card/50 p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Plano Gratuito</div>
          <div className="font-display text-3xl font-bold mt-2">R$ 0</div>
          <div className="text-xs text-muted-foreground">para sempre</div>
          <ul className="mt-5 space-y-2">
            {FREE.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 mt-0.5 shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border-2 border-elite-gold/60 bg-gradient-elite p-6 shadow-glow-gold relative overflow-hidden">
          <div className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full bg-elite-gold text-elite-foreground">
            Recomendado
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-elite-gold flex items-center gap-1">
            <Crown className="w-3 h-3" /> Drum Elite VIP
          </div>
          <div className="font-display text-4xl font-bold mt-2 text-gradient-gold">R$ 47,90</div>
          <div className="text-xs text-muted-foreground">pagamento único • acesso vitalício</div>
          <ul className="mt-5 space-y-2">
            {VIP.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 text-elite-gold shrink-0" /> {f}
              </li>
            ))}
          </ul>

          <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full mt-6 px-6 py-3.5 rounded-xl bg-gradient-gold text-elite-foreground font-bold shadow-glow-gold hover:scale-[1.02] active:scale-100 transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              unlocked ? (
                <><Sparkles className="w-4 h-4 animate-spin" /> Desbloqueando seu Elite…</>
              ) : (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processando…</>
              )
            ) : (
              <><Sparkles className="w-4 h-4" /> Quero acesso vitalício</>
            )}
          </button>
          <p className="text-[11px] text-center text-muted-foreground mt-3">
            Pagamento único de R$ 47,90 • sem renovação automática
          </p>
        </div>
      </div>
    </div>
  );
}
