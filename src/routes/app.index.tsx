import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Activity, Music2, Hand, Gauge, Target, FileMusic, Flame, Zap, Trophy } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const MODULES = [
  { to: "/app/metronome", icon: Activity, title: "Metrônomo D/E", desc: "Pulso preciso com som de caixa" },
  { to: "/app/rudiments", icon: Music2, title: "Rudimentos", desc: "40 rudimentos oficiais com prática" },
  { to: "/app/rhythms", icon: Music2, title: "Ritmos", desc: "Grooves para todos os níveis" },
  { to: "/app/notation", icon: FileMusic, title: "Notação", desc: "Leitura interativa de partitura" },
  { to: "/app/coordination", icon: Hand, title: "Coordenação", desc: "Independência de mãos e pés" },
  { to: "/app/speed", icon: Gauge, title: "Velocidade", desc: "BPM progressivo e resistência" },
  { to: "/app/practice", icon: Target, title: "Prática Livre", desc: "Crie suas rotinas" },
];

function Dashboard() {
  const { profile } = useAuth();
  const xpToNext = profile?.level ? profile.level * 100 : 100;
  const pct = profile ? Math.min(100, (profile.xp % 100)) : 0;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
          Olá, <span className="text-gradient">{profile?.display_name?.split(" ")[0] ?? "Baterista"}</span>
        </h1>
        <p className="text-muted-foreground">Pronto para mais uma sessão de prática?</p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Zap} label="XP Total" value={profile?.xp ?? 0} />
        <StatCard icon={Trophy} label="Nível" value={profile?.level ?? 1} />
        <StatCard icon={Flame} label="Sequência" value={`${profile?.streak_days ?? 0}d`} />
        <StatCard icon={Target} label="Próximo nível" value={`${pct}%`} hint={`/${xpToNext} XP`} />
      </div>

      {/* Modules */}
      <section>
        <h2 className="font-display text-xl font-bold mb-4">Continue praticando</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map((m) => (
            <Link key={m.to} to={m.to} className="group rounded-2xl border border-border bg-card/60 backdrop-blur p-5 hover:border-primary/50 hover:shadow-glow-orange transition-all">
              <m.icon className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <div className="font-bold">{m.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4">
      <Icon className="w-4 h-4 text-primary mb-2" />
      <div className="font-display text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label} {hint && <span className="opacity-60">{hint}</span>}</div>
    </div>
  );
}
