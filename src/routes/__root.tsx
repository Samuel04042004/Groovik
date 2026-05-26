import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, createRootRouteWithContext, HeadContent, Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "Groovik Beta — Aprenda Bateria de Forma Interativa" },
      { name: "description", content: "Plataforma interativa premium para dominar rudimentos, ritmos e timing na bateria." },
      { name: "theme-color", content: "#1a1c24" },
      { property: "og:title", content: "Groovik Beta — Aprenda Bateria de Forma Interativa" },
      { name: "twitter:title", content: "Groovik Beta — Aprenda Bateria de Forma Interativa" },
      { property: "og:description", content: "Plataforma interativa premium para dominar rudimentos, ritmos e timing na bateria." },
      { name: "twitter:description", content: "Plataforma interativa premium para dominar rudimentos, ritmos e timing na bateria." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/fe0838a3-bcc9-4fd8-9401-4573196b2275" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/fe0838a3-bcc9-4fd8-9401-4573196b2275" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
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
