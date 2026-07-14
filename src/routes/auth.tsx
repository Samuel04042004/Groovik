import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/lib/auth";
import { hasGuestData } from "@/lib/guest";
import { Music2, Loader2, Mail, Lock, User as UserIcon, ArrowLeft, UserPlus } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Entrar — Groovik Beta" }] }),
});

// MVP: social auth temporarily hidden. Flip to `true` to re-enable the
// Google/Apple buttons once the OAuth secrets are configured in the backend.
// The `handleOAuth` function is kept intact intentionally.
const ENABLE_SOCIAL_AUTH = false;

// Map Supabase auth errors to friendly Portuguese messages.
function translateAuthError(message: string | undefined | null): string {
  if (!message) return "Ocorreu um erro. Tente novamente.";
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Este e-mail já está cadastrado. Faça login.";
  if (m.includes("password should be at least")) return "A senha deve ter no mínimo 6 caracteres.";
  if (m.includes("unable to validate email") || m.includes("invalid format"))
    return "E-mail inválido.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas. Aguarde alguns minutos.";
  if (m.includes("network")) return "Falha de conexão. Verifique sua internet.";
  return message;
}

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { session, profile, isGuest, enterGuestMode } = useAuth();
  const nav = useNavigate();
  const guestDataExists = typeof window !== "undefined" && hasGuestData();

  useEffect(() => {
    // Skip auto-redirect while in guest mode so the user can still sign up from /auth.
    if (session && profile && !isGuest) {
      const target = profile.onboarded ? "/app" : "/onboarding";
      console.log("[auth] session ready, redirecting", { target, onboarded: profile.onboarded });
      nav({ to: target });
    }
  }, [session, profile, isGuest, nav]);

  const handleGuest = () => {
    const p = enterGuestMode();
    toast.success("Modo visitante ativado!");
    nav({ to: p.onboarded ? "/app" : "/onboarding" });
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name.trim() },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail para confirmar.", {
          description: "O link de confirmação foi enviado para " + email,
        });
        setMode("login");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("E-mail de recuperação enviado.", {
          description: "Verifique sua caixa de entrada.",
        });
        setMode("login");
      }
    } catch (err: any) {
      toast.error(translateAuthError(err?.message));
    } finally {
      setLoading(false);
    }
  };

  // Kept intact so social auth can be re-enabled by flipping ENABLE_SOCIAL_AUTH.
  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      const redirectTo = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) {
        const msg = error.message ?? `Erro ao entrar com ${provider}`;
        if (/provider.*not.*enabled|Unsupported provider/i.test(msg)) {
          toast.error(`O provedor ${provider} ainda não está habilitado.`);
        } else {
          toast.error(msg);
        }
        setLoading(false);
      }
    } catch (err: any) {
      toast.error(err?.message ?? `Falha no login com ${provider}`);
      setLoading(false);
    }
  };
  void handleOAuth; // preserve reference for future re-enable

  const title =
    mode === "login" ? "Bem-vindo de volta" : mode === "signup" ? "Crie sua conta" : "Recuperar senha";
  const subtitle =
    mode === "login"
      ? "Continue praticando seus rudimentos"
      : mode === "signup"
      ? "Comece sua jornada na bateria hoje"
      : "Enviaremos um link para redefinir sua senha";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background relative overflow-hidden">
      {/* Ambient gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-orange transition-transform group-hover:scale-105">
            <Music2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">
            Groovik
            <sup className="ml-1 text-[10px] font-mono uppercase tracking-widest text-primary align-super">
              Beta
            </sup>
          </span>
        </Link>

        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-card p-7 sm:p-8">
          <div className="space-y-1.5 mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {ENABLE_SOCIAL_AUTH && mode !== "reset" && (
            <>
              <div className="space-y-2 mb-5">
                {/* Social buttons intentionally hidden for MVP. */}
              </div>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border" /> ou e-mail
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">Nome</Label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Como devemos te chamar?"
                    className="h-11 pl-9"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">E-mail</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="voce@email.com"
                  className="h-11 pl-9"
                />
              </div>
            </div>

            {mode !== "reset" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium">Senha</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("reset")}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder="Mínimo 6 caracteres"
                    className="h-11 pl-9"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-primary text-primary-foreground shadow-glow-orange font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === "login" && "Entrando..."}
                  {mode === "signup" && "Criando conta..."}
                  {mode === "reset" && "Enviando..."}
                </>
              ) : (
                <>
                  {mode === "login" && "Entrar"}
                  {mode === "signup" && "Criar conta"}
                  {mode === "reset" && "Enviar link de recuperação"}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/60 text-center text-sm text-muted-foreground">
            {mode === "login" && (
              <>
                Ainda não tem conta?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-primary font-medium hover:underline"
                >
                  Criar conta
                </button>
              </>
            )}
            {mode === "signup" && (
              <>
                Já tem conta?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-primary font-medium hover:underline"
                >
                  Entrar
                </button>
              </>
            )}
            {mode === "reset" && (
              <button
                onClick={() => setMode("login")}
                className="inline-flex items-center gap-1 hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar para entrar
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao continuar, você concorda com nossos termos de uso.
        </p>
      </div>
    </div>
  );
}
