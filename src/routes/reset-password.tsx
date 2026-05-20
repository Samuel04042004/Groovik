import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    // Supabase parses the recovery hash into a session automatically.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada");
    nav({ to: "/app" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border bg-card/80 backdrop-blur p-7 space-y-4">
        <h1 className="font-display text-2xl font-bold">Definir nova senha</h1>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova senha" minLength={6} required className="h-11" />
        <Button type="submit" disabled={!ready} className="w-full h-11 bg-gradient-primary text-primary-foreground">Salvar</Button>
      </form>
    </div>
  );
}
