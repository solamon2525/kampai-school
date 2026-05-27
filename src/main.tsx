import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

// ─── Service Worker kill-switch ─────────────────────────────────────────
// If a user is stuck on a broken cached version, instruct them to visit
//   https://kampai-school.vercel.app/?reset_sw=1
// which unregisters all SWs and clears all caches, then reloads cleanly.
if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  const params = new URLSearchParams(window.location.search);
  if (params.get("reset_sw") === "1") {
    void (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {
        console.warn("[reset_sw] cleanup error (non-fatal):", e);
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("reset_sw");
      window.location.replace(url.toString());
    })();
  }
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <AuthProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </AuthProvider>
  </HelmetProvider>
);
