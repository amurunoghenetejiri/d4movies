import { useEffect, useState } from "react";
import { Logo } from "./Logo";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2600);
    const t2 = setTimeout(onDone, 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);
  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-black transition-opacity duration-700 ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[520px] rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[280px] rounded-full bg-gold/10 blur-3xl" />
      </div>
      <div className="relative flex flex-col items-center gap-6 animate-zoom-soft">
        <Logo size={160} glow />
        <div className="text-center">
          <div className="font-display text-3xl font-bold tracking-tight">
            <span className="text-gradient-emerald">D4TECH</span>{" "}
            <span className="text-foreground">Movies</span>
          </div>
          <div className="mt-2 text-sm tracking-[0.35em] uppercase">
            <span className="text-foreground/80">Stream. </span>
            <span className="text-gradient-gold">Discover. </span>
            <span className="text-foreground/80">Enjoy.</span>
          </div>
        </div>
        <div className="mt-4 h-1 w-56 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary to-gold animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
