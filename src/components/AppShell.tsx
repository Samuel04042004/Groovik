import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import {
  LayoutDashboard, Activity, Music2, FileMusic, Hand, Gauge, Target, LogOut,
  Flame, Zap, Settings, Menu, TrendingUp, Moon, Sun, Share2, Info, Copy,
  MessageCircle, Send, Facebook, Instagram, Twitter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { GuestMigrationPrompt } from "@/components/GuestMigrationPrompt";

const APP_VERSION = "Groovik Beta v1.0";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/metronome", label: "Metrônomo", icon: Activity },
  { to: "/app/rudiments", label: "Rudimentos", icon: Music2 },
  { to: "/app/rhythms", label: "Ritmos", icon: Music2 },
  { to: "/app/notation", label: "Notação", icon: FileMusic },
  { to: "/app/coordination", label: "Coordenação", icon: Hand },
  { to: "/app/speed", label: "Velocidade", icon: Gauge },
  { to: "/app/practice", label: "Prática Livre", icon: Target },
  { to: "/app", label: "Meu Progresso", icon: TrendingUp, exact: true, alias: "progress" },
  { to: "/app/settings", label: "Configurações", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const loc = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    nav({ to: "/" });
  };

  const isActive = (item: (typeof NAV)[number]) => {
    if (item.alias === "progress") return false;
    return item.exact
      ? loc.pathname === item.to
      : loc.pathname === item.to || loc.pathname.startsWith(item.to + "/");
  };

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://groovik.app";
  const shareText = "Aprenda bateria de verdade com o Groovik Beta 🥁";

  const shareLinks = [
    { name: "WhatsApp", icon: MessageCircle, color: "#25D366",
      url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}` },
    { name: "Telegram", icon: Send, color: "#229ED9",
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}` },
    { name: "Facebook", icon: Facebook, color: "#1877F2",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { name: "X", icon: Twitter, color: "#000000",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}` },
    { name: "Instagram", icon: Instagram, color: "#E1306C",
      url: `https://www.instagram.com/` },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-card via-card to-background/60">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <Link to="/app" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-orange">
            <Music2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-lg tracking-tight">
              Groovik
              <sup className="ml-1 text-[9px] font-mono uppercase tracking-widest text-primary align-super">Beta</sup>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Drum platform
            </div>
          </div>
        </Link>
      </div>

      {/* Profile card */}
      {profile && (
        <div className="mx-4 rounded-2xl border border-border/60 bg-background/40 backdrop-blur p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 ring-2 ring-primary/30">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name ?? ""} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                {profile.display_name?.[0]?.toUpperCase() ?? "G"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate">{profile.display_name ?? "Baterista"}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Nível {profile.level}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <Stat icon={<Zap className="w-3 h-3" />} label="XP" value={profile.xp} />
            <Stat icon={<Flame className="w-3 h-3 text-primary" />} label="Streak" value={`${profile.streak_days}d`} />
            <Stat icon={<TrendingUp className="w-3 h-3" />} label="Nível" value={profile.level} />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-primary/20 to-primary/5 text-primary border border-primary/30 shadow-sm"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground border border-transparent",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <Separator className="my-3 opacity-50" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground transition border border-transparent"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>Tema: {theme === "dark" ? "Escuro" : "Claro"}</span>
        </button>

        {/* About */}
        <button
          onClick={() => { setOpen(false); setAboutOpen(true); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground transition border border-transparent"
        >
          <Info className="w-4 h-4" />
          <span>Sobre o Groovik Beta</span>
        </button>

        {/* Share */}
        <button
          onClick={() => { setOpen(false); setShareOpen(true); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground transition border border-transparent"
        >
          <Share2 className="w-4 h-4" />
          <span>Compartilhar app</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition border border-transparent"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </nav>

      {/* Version */}
      <div className="px-5 py-4 border-t border-border/40 text-center">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {APP_VERSION}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-xl gap-2"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
          minHeight: "calc(3.5rem + env(safe-area-inset-top))",
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-accent"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-[340px] p-0 border-r border-border/60">
              {SidebarContent}
            </SheetContent>
          </Sheet>

          <Link to="/app" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow-orange">
              <Music2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold tracking-tight truncate">
              Groovik
              <sup className="ml-1 text-[9px] font-mono uppercase tracking-widest text-primary align-super">Beta</sup>
            </span>
          </Link>
        </div>

        {profile && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Flame className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono font-bold">{profile.streak_days}d</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/40 border border-border/60">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono font-bold">{profile.xp}</span>
            </div>
            <Avatar className="w-8 h-8 ring-2 ring-primary/20">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-bold">
                {profile.display_name?.[0]?.toUpperCase() ?? "G"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </header>

      <main
        className="flex-1 min-w-0 w-full"
        style={{
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-up w-full">{children}</div>
      </main>

      {/* Share dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Compartilhar Groovik Beta</DialogTitle>
            <DialogDescription>
              Convide outros bateristas para praticar com você.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 py-2">
            {shareLinks.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/40 transition"
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white"
                    style={{ background: s.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium">{s.name}</span>
                </a>
              );
            })}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-2 pl-3">
            <span className="text-xs text-muted-foreground truncate flex-1">{shareUrl}</span>
            <Button size="sm" onClick={copyLink} className="bg-gradient-primary text-primary-foreground">
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* About dialog */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-orange mx-auto mb-3">
              <Music2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <DialogTitle className="font-display text-2xl text-center">
              Groovik Beta
            </DialogTitle>
            <DialogDescription className="text-center">
              Plataforma gratuita de prática de bateria com metrônomo D/E, rudimentos oficiais, ritmos, coordenação e treino de velocidade.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center text-xs font-mono uppercase tracking-widest text-muted-foreground pt-2">
            {APP_VERSION}
          </div>
          <div className="text-center text-xs text-muted-foreground">
            © 2026 Groovik · Feito para bateristas
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-background/60 border border-border/40 px-2 py-1.5 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] uppercase tracking-wider">
        {icon}{label}
      </div>
      <div className="font-mono font-bold text-sm mt-0.5">{value}</div>
    </div>
  );
}
