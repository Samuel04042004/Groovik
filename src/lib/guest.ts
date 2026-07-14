// Guest mode: all data lives in localStorage. Never synced.
// If the user clears storage or reinstalls the PWA, this is permanently lost.

const KEY = "groovik_guest_v1";
const FLAG = "groovik_is_guest";

export type GuestProfile = {
  id: "guest";
  display_name: string | null;
  avatar_url: null;
  skill_level: "beginner" | "intermediate" | "advanced" | null;
  xp: number;
  level: number;
  streak_days: number;
  onboarded: boolean;
  theme: string;
};

export type GuestPracticeSession = {
  id: string;
  module: string;
  duration_seconds: number;
  bpm?: number;
  accuracy?: number;
  xp_earned: number;
  created_at: string;
};

export type GuestData = {
  profile: GuestProfile;
  sessions: GuestPracticeSession[];
  favorites: string[];
  completed_exercises: string[];
  bpm_records: Record<string, number>; // module/rudiment id -> best bpm
  settings: Record<string, unknown>;
  stats: Record<string, number>;
};

const DEFAULT: GuestData = {
  profile: {
    id: "guest",
    display_name: "Visitante",
    avatar_url: null,
    skill_level: null,
    xp: 0,
    level: 1,
    streak_days: 0,
    onboarded: false,
    theme: "dark",
  },
  sessions: [],
  favorites: [],
  completed_exercises: [],
  bpm_records: {},
  settings: {},
  stats: {},
};

export function isGuestActive(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(FLAG) === "1";
}

export function hasGuestData(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) !== null;
}

export function readGuest(): GuestData {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<GuestData>;
    return {
      ...DEFAULT,
      ...parsed,
      profile: { ...DEFAULT.profile, ...(parsed.profile ?? {}) },
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function writeGuest(data: GuestData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(data));
}

export function updateGuestProfile(patch: Partial<GuestProfile>): GuestProfile {
  const data = readGuest();
  data.profile = { ...data.profile, ...patch };
  writeGuest(data);
  return data.profile;
}

export function activateGuest(): GuestProfile {
  if (typeof window === "undefined") return DEFAULT.profile;
  window.localStorage.setItem(FLAG, "1");
  const existing = window.localStorage.getItem(KEY);
  if (!existing) writeGuest({ ...DEFAULT });
  return readGuest().profile;
}

export function clearGuest(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(FLAG);
  window.localStorage.removeItem(KEY);
}

export function deactivateGuestSession(): void {
  // Ends the guest session but keeps stored data (in case they want to resume).
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(FLAG);
}
