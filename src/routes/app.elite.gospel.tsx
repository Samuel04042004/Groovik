import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GOSPEL_LESSONS } from "@/lib/elite-content";
import { Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/elite/gospel")({
  component: GospelPage,
});

function GospelPage() {
  const [selected, setSelected] = useState(GOSPEL_LESSONS[0].id);
  const lesson = GOSPEL_LESSONS.find((l) => l.id === selected)!;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Flame className="w-5 h-5 text-elite-gold" /> Gospel Chops Academy
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Frases avançadas usadas por Chris Coleman, Tony Royster Jr e referências do gospel moderno.</p>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-5">
        <ul className="space-y-2">
          {GOSPEL_LESSONS.map((l) => (
            <li key={l.id}>
              <button
                onClick={() => setSelected(l.id)}
                className={cn(
                  "w-full text-left rounded-xl border p-3 transition",
                  selected === l.id
                    ? "border-elite-gold bg-elite-gold/10"
                    : "border-border bg-card/50 hover:border-elite-gold/40",
                )}
              >
                <div className="font-bold text-sm">{l.title}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  <span>{l.bpmRange[0]}–{l.bpmRange[1]} BPM</span>
                  <span>•</span>
                  <span className="flex">{Array.from({ length: 5 }).map((_, i) => (
                    <Zap key={i} className={cn("w-3 h-3", i < l.difficulty ? "text-elite-gold fill-elite-gold" : "text-muted")} />
                  ))}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>

        <div className="rounded-2xl border border-elite-gold/30 bg-gradient-elite p-6 shadow-glow-gold">
          <h3 className="font-display text-2xl font-bold">{lesson.title}</h3>
          <p className="text-muted-foreground text-sm mt-2">{lesson.description}</p>

          <div className="mt-6">
            <div className="text-xs font-mono uppercase tracking-widest text-elite-gold mb-3">Padrão</div>
            <div className="flex flex-wrap gap-2">
              {lesson.pattern.map((n, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg border-2",
                    n === "R" && "bg-primary/15 text-primary border-primary/40",
                    n === "L" && "bg-secondary/15 text-secondary border-secondary/40",
                    n === "K" && "bg-elite-gold/15 text-elite-gold border-elite-gold/40",
                  )}
                >
                  {n === "R" ? "D" : n === "L" ? "E" : "♭"}
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-3 flex gap-4">
              <span><span className="text-primary font-bold">D</span> mão direita</span>
              <span><span className="text-secondary font-bold">E</span> mão esquerda</span>
              <span><span className="text-elite-gold font-bold">♭</span> bumbo</span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-elite-gold/30 bg-background/40 p-4 text-sm">
            <strong className="text-elite-gold">Dica VIP:</strong> comece em {lesson.bpmRange[0]} BPM por 5 minutos antes de subir. Grave-se em vídeo para ver dinâmica das mãos.
          </div>
        </div>
      </div>
    </div>
  );
}
