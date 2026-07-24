import { useEffect, useState } from "react";
import { Logo } from "./Logo";

/**
 * Cinematic splash: layered gradient stage, emerald sheen sweep, logo iris-in,
 * energy pulse loader. Skippable after 2s.
 */
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  const finish = () => {
    setLeaving(true);
    setTimeout(onDone, 700);
  };

  useEffect(() => {
    const skipT = setTimeout(() => setCanSkip(true), 3000);
    const outT = setTimeout(() => setLeaving(true), 8300);
    const doneT = setTimeout(onDone, 9000);
    return () => { clearTimeout(skipT); clearTimeout(outT); clearTimeout(doneT); };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center overflow-hidden transition-opacity duration-700 ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #0a1f14 0%, #050707 55%, #000 100%)",
      }}
    >
      {/* Aurora layers */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[820px] rounded-full opacity-70"
          style={{
            background: "radial-gradient(circle, rgba(0,200,83,0.35) 0%, transparent 60%)",
            filter: "blur(80px)",
            animation: "splashAurora 4.4s ease-in-out infinite",
          }}
        />
        <div
          className="absolute left-1/4 top-2/3 size-[420px] rounded-full opacity-60"
          style={{
            background: "radial-gradient(circle, rgba(255,215,0,0.22) 0%, transparent 60%)",
            filter: "blur(90px)",
            animation: "splashAurora 6s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute right-1/4 top-1/4 size-[360px] rounded-full opacity-50"
          style={{
            background: "radial-gradient(circle, rgba(0,220,120,0.18) 0%, transparent 60%)",
            filter: "blur(70px)",
            animation: "splashAurora 5s ease-in-out infinite",
          }}
        />
      </div>

      {/* Sheen sweep */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.06) 48%, rgba(0,200,83,0.10) 52%, transparent 70%)",
          transform: "translateX(-30%)",
          animation: "splashSheen 3.4s ease-out 0.4s both",
        }}
      />

      {/* Center stage */}
      <div className="relative flex flex-col items-center gap-6" style={{ animation: "splashZoom 4.4s cubic-bezier(.2,.7,.2,1) forwards" }}>
        <div className="relative">
          <div className="absolute inset-0 -m-10 rounded-full border border-primary/40" style={{ animation: "splashRing 2.6s ease-out infinite" }} />
          <div className="absolute inset-0 -m-16 rounded-full border border-primary/20" style={{ animation: "splashRing 2.6s ease-out 0.4s infinite" }} />
          <div
            style={{ animation: "splashIris .9s cubic-bezier(.2,.7,.2,1) both" }}
            className="[--splash-logo:220px] sm:[--splash-logo:320px] md:[--splash-logo:420px] lg:[--splash-logo:520px]"
          >
            <div style={{ width: "var(--splash-logo)", height: "var(--splash-logo)" }}>
              <Logo size={520} glow className="!w-full !h-full [&>img]:!w-full [&>img]:!h-full" />
            </div>
          </div>
        </div>

        <div className="text-center overflow-hidden">
          <div
            className="font-display text-3xl md:text-5xl font-extrabold tracking-tight"
            style={{ animation: "splashFadeUp .9s .6s both" }}
          >
            <span className="text-gradient-emerald">D4</span>
            <span className="text-gradient-gold">MOVIES</span>
          </div>
          <div
            className="mt-3 text-[11px] tracking-[0.45em] uppercase text-foreground/70"
            style={{ animation: "splashFadeUp .9s 1.1s both" }}
          >
            Powered by <span className="text-gradient-emerald font-semibold">D4TECH</span>
          </div>
        </div>

        {/* Energy pulse loader */}
        <div className="mt-4 relative h-1.5 w-64 overflow-hidden rounded-full bg-white/5">
          <div
            className="absolute inset-y-0 -left-1/3 w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary to-gold"
            style={{ animation: "splashPulse 1.6s ease-in-out infinite" }}
          />
        </div>
      </div>

      {canSkip && (
        <button
          onClick={finish}
          className="absolute bottom-6 right-6 text-xs tracking-widest uppercase text-foreground/70 hover:text-foreground border border-white/15 rounded-full px-4 py-1.5 backdrop-blur-md"
        >
          Skip
        </button>
      )}

      <style>{`
        @keyframes splashZoom {
          0% { transform: scale(0.9); opacity: 0; filter: blur(4px); }
          20% { opacity: 1; filter: blur(0); }
          85% { transform: scale(1.02); }
          100% { transform: scale(1.06); }
        }
        @keyframes splashIris {
          0% { clip-path: circle(0% at 50% 50%); transform: scale(0.6); opacity: 0; }
          100% { clip-path: circle(75% at 50% 50%); transform: scale(1); opacity: 1; }
        }
        @keyframes splashRing {
          0% { transform: scale(0.55); opacity: 0.9; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes splashFadeUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes splashPulse {
          0% { transform: translateX(0); }
          100% { transform: translateX(400%); }
        }
        @keyframes splashSheen {
          0% { transform: translateX(-30%); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translateX(130%); opacity: 0; }
        }
        @keyframes splashAurora {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.15); }
        }
      `}</style>
    </div>
  );
}
