import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    console.log("[app] gate", { hasUser: !!user, onboarded: profile?.onboarded, path: window.location.pathname });
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    if (profile && !profile.onboarded) {
      nav({ to: "/onboarding" });
    }
  }, [loading, user, profile, nav]);

  if (loading || !user || !profile?.onboarded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
