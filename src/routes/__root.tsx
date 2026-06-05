import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";

// Paths the Lovable Preview / external links may hit that should resolve to "/".
const ROOT_ALIASES = new Set(["/index", "/index.html", "/home"]);

function NotFoundView() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (ROOT_ALIASES.has(pathname)) navigate({ to: "/", replace: true });
  }, [pathname, navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center text-center p-8">
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Página não encontrada</h1>
        <p className="text-muted-foreground">A rota que você acessou não existe.</p>
        <a href="/" className="inline-block mt-4 text-primary underline">Voltar ao início</a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundView,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    document.documentElement.lang = "pt-BR";
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
