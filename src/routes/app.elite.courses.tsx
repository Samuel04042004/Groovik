import { createFileRoute } from "@tanstack/react-router";
import { COURSES } from "@/lib/elite-content";
import { GraduationCap, Globe2 } from "lucide-react";

export const Route = createFileRoute("/app/elite/courses")({
  component: CoursesPage,
});

function CoursesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Cursos Online Recomendados</h2>
        <p className="text-muted-foreground text-sm mt-1">Curadoria com referências nacionais e internacionais.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {COURSES.map((c) => (
          <article
            key={c.id}
            className="rounded-2xl border border-elite-gold/20 bg-card/60 backdrop-blur p-5 hover:border-elite-gold/60 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-elite-gold/15 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-elite-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg leading-tight">{c.title}</h3>
                <div className="text-xs text-muted-foreground mt-1">com <span className="text-foreground font-medium">{c.instructor}</span></div>
              </div>
            </div>

            <p className="text-sm mt-4 text-muted-foreground leading-relaxed">{c.focus}</p>

            <div className="flex items-center gap-2 mt-4">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-elite-gold/15 text-elite-gold flex items-center gap-1">
                <Globe2 className="w-3 h-3" /> {c.language}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/50">{c.level}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
