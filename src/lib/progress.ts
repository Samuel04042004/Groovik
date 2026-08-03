// Unified progression API. Works transparently for guests (localStorage)
// and authenticated users (Lovable Cloud / Supabase).

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  addGuestSession,
  guestBpmRecords,
  guestSessions,
  listGuestFavorites,
  toggleGuestFavorite,
  type ProgressResult,
  type SessionInput,
} from "@/lib/guest-progress";

export type SessionRow = {
  id: string;
  exercise_type: string;
  exercise_id: string | null;
  bpm: number | null;
  duration_seconds: number;
  accuracy: number | null;
  xp_earned: number;
  created_at: string;
};

export type Stats = {
  sessions: SessionRow[];
  totalSessions: number;
  totalSeconds: number;
  totalXp: number;
  bestBpm: Record<string, number>;
  perDay: { date: string; seconds: number; xp: number }[];
};

const EMPTY_STATS: Stats = {
  sessions: [],
  totalSessions: 0,
  totalSeconds: 0,
  totalXp: 0,
  bestBpm: {},
  perDay: [],
};

function buildPerDay(sessions: SessionRow[]) {
  const days: { date: string; seconds: number; xp: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayTotal = sessions.filter((s) => s.created_at.slice(0, 10) === key);
    days.push({
      date: key,
      seconds: dayTotal.reduce((a, s) => a + (s.duration_seconds ?? 0), 0),
      xp: dayTotal.reduce((a, s) => a + (s.xp_earned ?? 0), 0),
    });
  }
  return days;
}

export function useProgress() {
  const { user, isGuest, refreshProfile } = useAuth();
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGuest = useCallback(() => {
    const sessions: SessionRow[] = guestSessions().map((s) => ({
      id: s.id,
      exercise_type: s.module,
      exercise_id: null,
      bpm: s.bpm ?? null,
      duration_seconds: s.duration_seconds,
      accuracy: s.accuracy ?? null,
      xp_earned: s.xp_earned,
      created_at: s.created_at,
    }));
    setStats({
      sessions,
      totalSessions: sessions.length,
      totalSeconds: sessions.reduce((a, s) => a + s.duration_seconds, 0),
      totalXp: sessions.reduce((a, s) => a + s.xp_earned, 0),
      bestBpm: guestBpmRecords(),
      perDay: buildPerDay(sessions),
    });
    setFavorites(listGuestFavorites());
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (isGuest || !user) {
      loadGuest();
      return;
    }
    setLoading(true);
    const [{ data: sessionRows }, { data: favRows }] = await Promise.all([
      supabase
        .from("practice_sessions")
        .select("id,exercise_type,exercise_id,bpm,duration_seconds,accuracy,xp_earned,created_at")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("favorites").select("exercise_id"),
    ]);
    const sessions = (sessionRows ?? []) as SessionRow[];
    const bestBpm: Record<string, number> = {};
    for (const s of sessions) {
      if (s.exercise_id && s.bpm) {
        bestBpm[s.exercise_id] = Math.max(bestBpm[s.exercise_id] ?? 0, s.bpm);
      }
    }
    setStats({
      sessions,
      totalSessions: sessions.length,
      totalSeconds: sessions.reduce((a, s) => a + (s.duration_seconds ?? 0), 0),
      totalXp: sessions.reduce((a, s) => a + (s.xp_earned ?? 0), 0),
      bestBpm,
      perDay: buildPerDay(sessions),
    });
    setFavorites((favRows ?? []).map((f: any) => f.exercise_id));
    setLoading(false);
  }, [isGuest, user, loadGuest]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordSession = useCallback(
    async (input: SessionInput): Promise<ProgressResult | null> => {
      if (input.duration_seconds < 5) return null; // ignore accidental taps
      if (isGuest || !user) {
        const res = addGuestSession(input);
        await refreshProfile();
        loadGuest();
        return res;
      }
      const { data, error } = await supabase.rpc("record_practice_session", {
        p_exercise_type: input.exercise_type,
        p_exercise_id: input.exercise_id ?? null,
        p_bpm: input.bpm ?? null,
        p_duration_seconds: Math.floor(input.duration_seconds),
        p_accuracy: input.accuracy ?? null,
      });
      if (error) {
        console.error("[progress] record failed", error);
        return null;
      }
      await refreshProfile();
      await refresh();
      return data as unknown as ProgressResult;
    },
    [isGuest, user, refreshProfile, refresh, loadGuest],
  );

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback(
    async (exerciseId: string): Promise<boolean> => {
      if (isGuest || !user) {
        const now = toggleGuestFavorite(exerciseId);
        setFavorites(listGuestFavorites());
        return now;
      }
      const has = favorites.includes(exerciseId);
      if (has) {
        await supabase.from("favorites").delete().eq("exercise_id", exerciseId).eq("user_id", user.id);
        setFavorites((f) => f.filter((x) => x !== exerciseId));
        return false;
      }
      await supabase.from("favorites").insert({ user_id: user.id, exercise_id: exerciseId });
      setFavorites((f) => [...f, exerciseId]);
      return true;
    },
    [isGuest, user, favorites],
  );

  return useMemo(
    () => ({ stats, loading, favorites, isFavorite, toggleFavorite, recordSession, refresh }),
    [stats, loading, favorites, isFavorite, toggleFavorite, recordSession, refresh],
  );
}
