import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Activity, Music2, FileMusic, Hand, Gauge, Target, LogOut, Flame, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/app", label: "Início", icon: LayoutDashboard, exact: true },
  { to: "/app/metronome", label: "Metrônomo", icon: Activity },
  { to: "/app/rudiments", label: "Rudimentos", icon: Music2 },
  { to: "/app/rhythms", label: "Ritmos", icon: Music2 },
  { to: "/app/notation", label: "Notação", icon: FileMusic },
  { to: "/app/coordination", label: "Coordenação", icon: Hand },
  { to: "/app/speed", label: "Velocidade", icon: Gauge },
  { to: "/app/practice", label: "Prática Livre", icon: Target },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();

  const handleLogout = async () => {
    await signOut();
    nav({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar / Topbar */}
      <aside className="lg:w-64 lg:min-h-screen lg:border-r border-border bg-card/40 backdrop-blur-xl flex lg:flex-col">
        <div className="p-5 hidden lg:block">
          <Link to="/app" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-orange">
              <Music2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">BatePro</span>
          </Link>
        </div>

        {/* Stats */}
        {profile && (
          <div className="hidden lg:block mx-5 mb-4 rounded-xl border border-border bg-background/30 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Nível</span>
              <span className="font-mono font-bold">{profile.level}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3" />XP</span>
              <span className="font-mono font-bold">{profile.xp}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><Flame className="w-3 h-3 text-primary" />Sequência</span>
              <span className="font-mono font-bold">{profile.streak_days}d</span>
            </div>
          </div>
        )}

        <nav className="flex-1 flex lg:flex-col gap-1 overflow-x-auto px-2 lg:px-3 py-2 lg:py-0">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? loc.pathname === item.to
              : loc.pathname === item.to || loc.pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block p-3 border-t border-border">
          <div className="flex items-center gap-2 mb-2 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-gradient-secondary flex items-center justify-center text-xs font-bold">
              {profile?.display_name?.[0]?.toUpperCase() ?? "B"}
            </div>
            <div className="text-xs truncate flex-1">{profile?.display_name ?? "Baterista"}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
