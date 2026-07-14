import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  isGuestActive,
  readGuest,
  activateGuest,
  clearGuest,
  deactivateGuestSession,
  updateGuestProfile,
  type GuestProfile,
} from "@/lib/guest";

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  skill_level: "beginner" | "intermediate" | "advanced" | null;
  xp: number;
  level: number;
  streak_days: number;
  onboarded: boolean;
  theme: string;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isGuest: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  enterGuestMode: () => Profile;
  updateGuestProfile: (patch: Partial<GuestProfile>) => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  const loadProfile = async (uid: string) => {
    let { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (!data) {
      const { data: userRes } = await supabase.auth.getUser();
      const meta = userRes.user?.user_metadata ?? {};
      const email = userRes.user?.email ?? "";
      await supabase.from("profiles").insert({
        id: uid,
        display_name: meta.full_name ?? meta.name ?? email.split("@")[0] ?? null,
        avatar_url: meta.avatar_url ?? null,
      } as any);
      const retry = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      data = retry.data;
    }
    setProfile((data as Profile) ?? null);
  };

  const loadGuest = () => {
    const g = readGuest().profile;
    setProfile(g as unknown as Profile);
    setIsGuest(true);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        // Real session takes precedence over guest.
        setIsGuest(false);
        deactivateGuestSession();
        setTimeout(() => loadProfile(s.user.id), 0);
      } else if (isGuestActive()) {
        loadGuest();
      } else {
        setProfile(null);
        setIsGuest(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        deactivateGuestSession();
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else if (isGuestActive()) {
        loadGuest();
        setLoading(false);
      } else {
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
    else if (isGuest) setProfile(readGuest().profile as unknown as Profile);
  };

  const signOut = async () => {
    if (isGuest) {
      // Ending the guest session keeps their data; a full wipe happens via settings.
      deactivateGuestSession();
      setIsGuest(false);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const enterGuestMode = (): Profile => {
    const p = activateGuest();
    setIsGuest(true);
    setProfile(p as unknown as Profile);
    return p as unknown as Profile;
  };

  const updateGuest = (patch: Partial<GuestProfile>) => {
    const next = updateGuestProfile(patch);
    setProfile(next as unknown as Profile);
  };

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        loading,
        isGuest,
        refreshProfile,
        signOut,
        enterGuestMode,
        updateGuestProfile: updateGuest,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}

// Re-export for callers that want to fully wipe local guest data (e.g. settings).
export { clearGuest };
