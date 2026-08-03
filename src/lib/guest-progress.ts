// Guest-mode progression: sessions, XP, level, streak, favorites and records.
// Everything is stored in localStorage through src/lib/guest.ts.

import { readGuest, writeGuest, type GuestPracticeSession } from "@/lib/guest";

/** Shared XP formula — must mirror the server function record_practice_session. */
export function xpForDuration(durationSeconds: number): number {
  const d = Math.max(0, Math.min(14400, Math.floor(durationSeconds || 0)));
  return Math.min(600, Math.max(5, Math.floor(d / 6)));
}

export function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

export type SessionInput = {
  exercise_type: string;
  exercise_id?: string | null;
  bpm?: number | null;
  duration_seconds: number;
  accuracy?: number | null;
};

export type ProgressResult = {
  xp_earned: number;
  xp: number;
  level: number;
  streak_days: number;
};

const LAST_PRACTICE = "last_practice_at";

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function addGuestSession(input: SessionInput): ProgressResult {
  const data = readGuest();
  const xp = xpForDuration(input.duration_seconds);
  const now = new Date();

  const session: GuestPracticeSession = {
    id: crypto.randomUUID(),
    module: input.exercise_type,
    duration_seconds: Math.floor(input.duration_seconds),
    bpm: input.bpm ?? undefined,
    accuracy: input.accuracy ?? undefined,
    xp_earned: xp,
    created_at: now.toISOString(),
  };
  data.sessions = [session, ...data.sessions].slice(0, 500);

  // Streak
  const lastMs = data.stats[LAST_PRACTICE];
  let streak = data.profile.streak_days ?? 0;
  if (!lastMs) {
    streak = 1;
  } else {
    const last = new Date(lastMs);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (sameDay(last, now)) streak = Math.max(streak, 1);
    else if (sameDay(last, yesterday)) streak = streak + 1;
    else streak = 1;
  }
  data.stats[LAST_PRACTICE] = now.getTime();

  const newXp = (data.profile.xp ?? 0) + xp;
  data.profile = {
    ...data.profile,
    xp: newXp,
    level: levelForXp(newXp),
    streak_days: streak,
  };

  // BPM record per exercise
  if (input.exercise_id && input.bpm) {
    const key = input.exercise_id;
    if (!data.bpm_records[key] || data.bpm_records[key] < input.bpm) {
      data.bpm_records[key] = input.bpm;
    }
  }
  if (input.exercise_id && !data.completed_exercises.includes(input.exercise_id)) {
    data.completed_exercises.push(input.exercise_id);
  }

  writeGuest(data);
  return { xp_earned: xp, xp: newXp, level: data.profile.level, streak_days: streak };
}

export function listGuestFavorites(): string[] {
  return readGuest().favorites;
}

export function toggleGuestFavorite(exerciseId: string): boolean {
  const data = readGuest();
  const has = data.favorites.includes(exerciseId);
  data.favorites = has
    ? data.favorites.filter((f) => f !== exerciseId)
    : [...data.favorites, exerciseId];
  writeGuest(data);
  return !has;
}

export function guestSessions(): GuestPracticeSession[] {
  return readGuest().sessions;
}

export function guestBpmRecords(): Record<string, number> {
  return readGuest().bpm_records;
}
