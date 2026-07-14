import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Sparkles, Target, Flame } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const LEVELS = [
  { id: "beginner", label: "Iniciante", desc: "Estou começando agora", icon: Sparkles },
  { id: "intermediate", label: "Intermediário", desc: "Conheço alguns rudimentos", icon: Target },
  { id: "advanced", label: "Avançado", desc: "Quero refinar minha técnica", icon: Flame },
] as const;

function Onboarding() {
  const { user, profile, loading, isGuest, refreshProfile, updateGuestProfile } = useAuth();
  const nav = useNavigate();
  const [skill, setSkill] = useState<"beginner" | "intermediate" | "advanced" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user && !isGuest) nav({ to: "/auth" });
    if (profile?.onboarded) nav({ to: "/app" });
  }, [loading, user, isGuest, profile, nav]);

  const finish = async () => {
    if (!skill) return;
    setSaving(true);
    if (isGuest) {
      updateGuestProfile({ skill_level: skill, onboarded: true });
      nav({ to: "/app" });
      return;
    }
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ skill_level: skill, onboarded: true })
      .eq("id", user.id);
    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }
    await refreshProfile();
    nav({ to: "/app" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl animate-fade-up">
        <div className="text-center mb-10">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            Passo 1 de 1
          </div>
          <h1 className="font-display font-bold text-3xl md:text-5xl tracking-tight">
            Qual o seu <span className="text-gradient">nível</span> atual?
          </h1>
          <p className="text-muted-foreground mt-3">
            Vamos personalizar seu caminho de aprendizado.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {LEVELS.map((lvl) => {
            const Icon = lvl.icon;
            const active = skill === lvl.id;
            return (
              <button
                key={lvl.id}
                onClick={() => setSkill(lvl.id)}
                className={cn(
                  "text-left rounded-2xl border-2 p-5 transition-all",
                  active
                    ? "border-primary bg-primary/10 shadow-glow-orange"
                    : "border-border bg-card/60 hover:border-primary/40",
                )}
              >
                <Icon className={cn("w-7 h-7 mb-3", active ? "text-primary" : "text-muted-foreground")} />
                <div className="font-bold">{lvl.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{lvl.desc}</div>
              </button>
            );
          })}
        </div>

        <Button
          onClick={finish}
          disabled={!skill || saving}
          size="lg"
          className="w-full mt-8 h-12 bg-gradient-primary text-primary-foreground shadow-glow-orange"
        >
          {saving ? "Salvando..." : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
