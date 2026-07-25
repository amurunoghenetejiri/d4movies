import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

type BIP = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "d4movies-install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIP | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    if (iOS) {
      setIsIOS(true);
      const t = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(t);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIP);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") dismiss();
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 left-3 md:left-6 z-[60] w-[92vw] max-w-sm">
      <div className="glass-strong rounded-2xl border border-white/10 shadow-2xl p-4 flex gap-3 items-start">
        <img src="/logo.png" alt="" className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Install D4MOVIES</div>
          {isIOS ? (
            <p className="text-xs text-muted-foreground mt-1">
              Tap <Share className="inline size-3" /> in Safari, then <b>Add to Home Screen</b>.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Get instant access with an app-like experience. No app store needed.
            </p>
          )}
          {!isIOS && (
            <Button onClick={install} size="sm" className="mt-2 rounded-full glow-emerald">
              <Download className="size-3.5" /> Install app
            </Button>
          )}
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="p-1 hover:bg-white/10 rounded">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
