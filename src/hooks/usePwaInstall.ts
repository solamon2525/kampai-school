import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "pwa_install_dismissed_at";
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000;

const detectIos = (): boolean => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as typeof window & { MSStream?: unknown }).MSStream;
  return isIosDevice;
};

const detectStandalone = (): boolean => {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return mq || iosStandalone;
};

const isDismissedNow = (): boolean => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_TTL_MS;
  } catch {
    return false;
  }
};

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(detectStandalone);
  const [isDismissed, setIsDismissed] = useState<boolean>(isDismissedNow);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window === "undefined" ? false : window.matchMedia("(max-width: 768px)").matches,
  );

  const isIos = detectIos();

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };
    const standaloneMq = window.matchMedia("(display-mode: standalone)");
    const onStandaloneChange = () => setIsStandalone(detectStandalone());
    const mobileMq = window.matchMedia("(max-width: 768px)");
    const onMobileChange = () => setIsMobile(mobileMq.matches);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    standaloneMq.addEventListener("change", onStandaloneChange);
    mobileMq.addEventListener("change", onMobileChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
      standaloneMq.removeEventListener("change", onStandaloneChange);
      mobileMq.removeEventListener("change", onMobileChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    } else {
      dismiss();
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setIsDismissed(true);
  }, []);

  return {
    canInstall: !!deferredPrompt,
    isIos,
    isStandalone,
    isMobile,
    isDismissed,
    promptInstall,
    dismiss,
  };
}
