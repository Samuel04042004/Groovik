// Guarded service-worker registration. Never registers in dev, Lovable preview,
// iframes, or when ?sw=off. Unregisters any stale /sw.js in those contexts.

export async function registerPWA() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const url = new URL(window.location.href);
  const host = window.location.hostname;
  const inIframe = window.self !== window.top;

  const isPreviewHost =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");

  const refuse =
    !import.meta.env.PROD ||
    inIframe ||
    isPreviewHost ||
    url.searchParams.get("sw") === "off";

  if (refuse) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        const scriptURL = reg.active?.scriptURL ?? "";
        if (scriptURL.endsWith("/sw.js")) await reg.unregister();
      }
    } catch {
      /* noop */
    }
    return;
  }

  try {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
  } catch {
    /* noop */
  }
}
