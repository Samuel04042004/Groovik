import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Sun, Moon, LogOut, Trash2, Share2, Copy, MessageCircle, Loader2, Download, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { clearGuest } from "@/lib/guest";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

const APP_VERSION = "1.0.0";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, isGuest, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const nav = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const { canInstall, installed, isIOS, promptInstall } = useInstallPrompt();

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result === "accepted") toast.success("App instalado! 🥁");
    else if (result === "unavailable") {
      if (isIOS) {
        toast.info("No iPhone: toque em Compartilhar e depois em 'Adicionar à Tela de Início'.");
      } else {
        toast.info("Use o menu do navegador → 'Instalar app' / 'Adicionar à tela inicial'.");
      }
    }
  };

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://groovik.app";
  const shareText = `Estou aprendendo bateria no Groovik Beta 🥁 — vem treinar comigo: ${shareUrl}`;

  const handleLogout = async () => {
    await signOut();
    nav({ to: "/" });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (isGuest) {
        clearGuest();
        toast.success("Progresso local apagado.");
        nav({ to: "/" });
        return;
      }
      // Refresh the session so the backend sees a recently issued token
      // (account deletion requires recent authentication).
      await supabase.auth.refreshSession();
      const { error } = await supabase.rpc("delete_my_account");
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success("Conta excluída permanentemente.");
      nav({ to: "/" });
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      toast.error(
        msg.includes("Reauthentication required")
          ? "Por segurança, entre novamente antes de excluir a conta."
          : msg || "Erro ao excluir conta",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "Groovik Beta", text: shareText, url: shareUrl }); } catch {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado!");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copiado para a área de transferência!");
  };

  const whatsappShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Personalize sua experiência no Groovik Beta.</p>
      </header>

      <Section title="Tema" subtitle="Escolha como o Groovik aparece pra você.">
        <div className="grid grid-cols-2 gap-3">
          <ThemeCard active={theme === "dark"} onClick={() => setTheme("dark")} icon={<Moon className="w-5 h-5" />} label="Escuro" desc="Imersivo e moderno" />
          <ThemeCard active={theme === "light"} onClick={() => setTheme("light")} icon={<Sun className="w-5 h-5" />} label="Claro" desc="Brilhante e limpo" />
        </div>
      </Section>

      <Section title="Instalar app" subtitle="Tenha o Groovik na tela inicial e use como um app nativo.">
        {installed ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <div>
              <div className="font-bold">App instalado</div>
              <div className="text-xs text-muted-foreground">Abrindo em modo standalone.</div>
            </div>
          </div>
        ) : (
          <>
            <Button
              onClick={handleInstall}
              className="w-full bg-gradient-primary text-primary-foreground shadow-glow-orange"
            >
              <Download className="w-4 h-4 mr-2" />
              {canInstall ? "Instalar Groovik" : isIOS ? "Como instalar no iPhone" : "Como instalar"}
            </Button>
            {isIOS && !canInstall && (
              <p className="text-xs text-muted-foreground mt-2">
                No iPhone/iPad: toque em <strong>Compartilhar</strong> no Safari e depois em{" "}
                <strong>"Adicionar à Tela de Início"</strong>.
              </p>
            )}
          </>
        )}
      </Section>

      <Section title="Compartilhar Groovik Beta" subtitle="Convide amigos bateristas.">
        <div className="rounded-xl border bg-card/40 p-3 font-mono text-xs break-all text-muted-foreground">{shareUrl}</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
          <Button variant="outline" onClick={handleNativeShare}><Share2 className="w-4 h-4 mr-2" />Compartilhar</Button>
          <Button variant="outline" onClick={whatsappShare} className="text-[oklch(0.7_0.18_150)]"><MessageCircle className="w-4 h-4 mr-2" />WhatsApp</Button>
          <Button variant="outline" onClick={copyLink}><Copy className="w-4 h-4 mr-2" />Copiar link</Button>
        </div>
      </Section>

      <Section title="Conta" subtitle={isGuest ? "Modo visitante — dados apenas neste dispositivo" : profile?.display_name ?? "Sua conta Groovik"}>
        <div className="space-y-2">
          {isGuest && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
              Seu progresso está salvo apenas neste navegador. Crie uma conta a qualquer momento para manter tudo em segurança.
              <div className="mt-2">
                <Button size="sm" onClick={() => nav({ to: "/auth" })} className="bg-gradient-primary text-primary-foreground">
                  Criar conta e transferir progresso
                </Button>
              </div>
            </div>
          )}
          <Button variant="outline" onClick={handleLogout} className="w-full justify-start">
            <LogOut className="w-4 h-4 mr-2" /> {isGuest ? "Sair do modo visitante" : "Sair da conta"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-destructive border-destructive/40 hover:bg-destructive/10">
                <Trash2 className="w-4 h-4 mr-2" /> {isGuest ? "Apagar dados locais" : "Excluir conta permanentemente"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  {isGuest
                    ? "Todo o progresso local (XP, sequência, favoritos, histórico) será apagado deste dispositivo e não poderá ser recuperado."
                    : "Essa ação é permanente. Toda a sua progressão, XP, sequência e histórico de prática serão apagados e não poderão ser recuperados."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  {isGuest ? "Apagar tudo" : "Excluir tudo"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Section>

      <Section title="Sobre" subtitle="Versão do aplicativo">
        <div className="flex items-center justify-between rounded-xl border bg-card/40 p-4">
          <div>
            <div className="font-bold">Groovik <span className="text-[10px] font-mono uppercase tracking-widest text-primary align-middle ml-1">Beta</span></div>
            <div className="text-xs text-muted-foreground">Plataforma interativa de bateria</div>
          </div>
          <div className="font-mono text-sm text-muted-foreground">v{APP_VERSION}</div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function ThemeCard({ active, onClick, icon, label, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition ${active ? "border-primary bg-primary/10 shadow-glow-orange" : "border-border bg-card/40 hover:border-primary/40"}`}
    >
      <div className="flex items-center gap-2 mb-1">{icon}<span className="font-bold">{label}</span></div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}
