import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { Music2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Entrar — BatePro" }] }),
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { session, profile } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (session && profile) {
      nav({ to: profile.onboarded ? "/app" : "/onboarding" });
    }
  }, [session, profile, nav]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin + "/app",
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("E-mail de recuperação enviado.");
        setMode("login");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) {
      toast.error(result.error.message ?? "Erro com Google");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-up">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-orange">
            <Music2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl">BatePro</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur shadow-card p-7">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {mode === "login" && "Bem-vindo de volta"}
            {mode === "signup" && "Crie sua conta"}
            {mode === "reset" && "Recuperar senha"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" && "Continue praticando seus rudimentos"}
            {mode === "signup" && "Comece sua jornada na bateria hoje"}
            {mode === "reset" && "Enviaremos um link para o seu e-mail"}
          </p>

          {mode !== "reset" && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full mt-6 h-11"
                onClick={handleGoogle}
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
                Continuar com Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border" /> ou e-mail <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name" className="text-xs">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-11 mt-1" />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-xs">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 mt-1" />
            </div>
            {mode !== "reset" && (
              <div>
                <Label htmlFor="password" className="text-xs">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-11 mt-1" />
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-primary text-primary-foreground shadow-glow-orange">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "login" && "Entrar"}
              {mode === "signup" && "Criar conta"}
              {mode === "reset" && "Enviar link"}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
            {mode === "login" ? (
              <>
                <button onClick={() => setMode("reset")} className="hover:text-primary">Esqueci minha senha</button>
                <button onClick={() => setMode("signup")} className="hover:text-primary">Criar conta</button>
              </>
            ) : (
              <button onClick={() => setMode("login")} className="hover:text-primary mx-auto">← Voltar para entrar</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
