// Global "now playing" bar for Worship Pad Pro. Rendered by AppShell so pads
// stay controllable while the user browses other modules.

import { useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import * as engine from "@/lib/worship/engine";
import { Button } from "@/components/ui/button";
import { Square, Radio } from "lucide-react";

function useActiveCount() {
  return useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.getActive().length,
    () => 0,
  );
}

export function WorshipNowPlaying() {
  const count = useActiveCount();
  if (count === 0) return null;

  const active = engine.getActive();
  const notes = active.map((a) => engine.noteLabel(a.midi)).join(" · ");

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-40 border-t border-primary/40 bg-card/95 backdrop-blur px-4 py-2"
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <Radio className="w-4 h-4 text-primary animate-pulse shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold truncate">Worship Pad tocando</div>
          <div className="text-[11px] font-mono text-muted-foreground truncate">{notes}</div>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to="/app/worship">Abrir</Link>
        </Button>
        <Button size="sm" variant="destructive" className="shrink-0" onClick={() => engine.stopAll()}>
          <Square className="w-3.5 h-3.5 mr-1" /> Parar
        </Button>
      </div>
    </div>
  );
}
