import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { hasGuestData, readGuest, clearGuest } from "@/lib/guest";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const DISMISS_KEY = "groovik_migration_dismissed";

export function GuestMigrationPrompt() {
  const { user, isGuest, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || isGuest) return;
    if (!hasGuestData()) return;
    if (typeof window !== "undefined" && window.localStorage.getItem(DISMISS_KEY) === "1") return;
    setOpen(true);
  }, [user, isGuest]);

  const accept = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const g = readGuest();
      const gp = g.profile;
      // Server-side merge: validated, clamped and only allowed once, on an
      // account that has no server progress yet.
      const { error } = await supabase.rpc("migrate_guest_progress", {
        p_xp: Math.max(0, Math.floor(gp.xp ?? 0)),
        p_level: Math.max(1, Math.floor(gp.level ?? 1)),
        p_streak_days: Math.max(0, Math.floor(gp.streak_days ?? 0)),
        p_skill_level: gp.skill_level ?? undefined,
        p_onboarded: gp.onboarded ?? undefined,
      });
      if (error && !String(error.message).includes("already exists")) throw error;


      clearGuest();
      await refreshProfile();
      toast.success("Progresso transferido para sua conta!");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível transferir o progresso");
    } finally {
      setBusy(false);
    }
  };

  const decline = () => {
    if (typeof window !== "undefined") window.localStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => (v ? setOpen(true) : decline())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Transferir progresso do visitante?</AlertDialogTitle>
          <AlertDialogDescription>
            Encontramos progresso salvo neste dispositivo em modo visitante.
            Quer copiar XP, sequência, favoritos e histórico para sua nova conta?
            Os dados locais serão removidos após a transferência.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy} onClick={decline}>Agora não</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={accept} className="bg-gradient-primary text-primary-foreground">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Transferir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
