import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";

/**
 * Cinematic splash: canvas particle field converges into the logo,
 * neon ring expands, energy pulse loader. Skippable after 2s.
 */
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const finish = () => {
    setLeaving(true);
    setTimeout(onDone, 700);
  };

  useEffect(() => {
    const skipT = setTimeout(() => setCanSkip(true), 2000);
    const outT = setTimeout(() => setLeaving(true), 4200);
    const doneT = setTimeout(onDone, 4900);
    return () => { clearTimeout(skipT); clearTimeout(outT); clearTimeout(doneT); };
  }, [onDone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const cx = () => W() / 2;
    const cy = () => H() / 2;

    type P = { x: number; y: number; tx: number; ty: number; vx: number; vy: number; r: number; hue: number; life: number };
    const N = Math.min(280, Math.floor((W() * H()) / 8000));
    const particles: P[] = Array.from({ length: N }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      tx: cx() + (Math.random() - 0.5) * 240,
      ty: cy() + (Math.random() - 0.5) * 140,
      vx: 0, vy: 0,
      r: Math.random() * 1.6 + 0.4,
      hue: Math.random() > 0.15 ? 148 : 48, // mostly green, some gold
      life: Math.random(),
    }));

    const sparks: { x: number; y: number; a: number; s: number; life: number }[] = [];
    let start = performance.now();

    const draw = (t: number) => {
      const elapsed = (t - start) / 1000;
      ctx.fillStyle = "rgba(6, 8, 10, 0.28)";
      ctx.fillRect(0, 0, W(), H());

      // soft green light rays
      const g = ctx.createRadialGradient(cx(), cy(), 20, cx(), cy(), Math.max(W(), H()) * 0.6);
      g.addColorStop(0, "rgba(0, 200, 83, 0.18)");
      g.addColorStop(0.5, "rgba(0, 200, 83, 0.05)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W(), H());

      // particles converge
      for (const p of particles) {
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        p.vx = p.vx * 0.9 + dx * 0.02;
        p.vy = p.vy * 0.9 + dy * 0.02;
        p.x += p.vx;
        p.y += p.vy;
        const color = p.hue === 148 ? "rgba(0, 220, 120," : "rgba(255, 215, 0,";
        ctx.beginPath();
        ctx.fillStyle = color + (0.4 + 0.6 * Math.sin(elapsed * 3 + p.life * 8)) + ")";
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.hue === 148 ? "#00C853" : "#FFD700";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // expanding neon ring
      const ringR = Math.min(220, 20 + elapsed * 90);
      const ringA = Math.max(0, 0.6 - elapsed * 0.15);
      ctx.beginPath();
      ctx.strokeStyle = `rgba(0, 200, 83, ${ringA})`;
      ctx.lineWidth = 2;
      ctx.arc(cx(), cy(), ringR, 0, Math.PI * 2);
      ctx.stroke();

      // sparks
      if (Math.random() < 0.4) {
        sparks.push({
          x: cx() + (Math.random() - 0.5) * 260,
          y: cy() + (Math.random() - 0.5) * 140,
          a: Math.random() * Math.PI * 2,
          s: Math.random() * 3 + 1,
          life: 1,
        });
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += Math.cos(s.a) * s.s;
        s.y += Math.sin(s.a) * s.s;
        s.life -= 0.03;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 200, ${s.life})`;
        ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-black transition-opacity duration-700 overflow-hidden ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Cinematic smoke */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[720px] rounded-full bg-primary/15 blur-[120px] animate-pulse" />
        <div className="absolute left-1/3 top-2/3 size-[380px] rounded-full bg-gold/10 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center gap-6" style={{ animation: "splashZoom 4.2s cubic-bezier(.2,.7,.2,1) forwards" }}>
        <div className="relative">
          <div className="absolute inset-0 -m-8 rounded-full border border-primary/40" style={{ animation: "splashRing 2.4s ease-out infinite" }} />
          <Logo size={168} glow />
        </div>
        <div className="text-center overflow-hidden">
          <div className="font-display text-4xl md:text-5xl font-extrabold tracking-tight" style={{ animation: "splashFadeUp .9s .6s both" }}>
            <span className="text-gradient-emerald">D4</span>
            <span className="text-gradient-gold">MOVIES</span>
          </div>
          <div className="mt-3 text-[11px] tracking-[0.45em] uppercase text-foreground/70" style={{ animation: "splashFadeUp .9s 1.1s both" }}>
            Powered by <span className="text-gradient-emerald font-semibold">D4TECH</span>
          </div>
        </div>

        {/* Energy pulse loader */}
        <div className="mt-4 relative h-1.5 w-64 overflow-hidden rounded-full bg-white/5">
          <div className="absolute inset-y-0 -left-1/3 w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary to-gold" style={{ animation: "splashPulse 1.6s ease-in-out infinite" }} />
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
          0% { transform: scale(0.85); opacity: 0; filter: blur(6px); }
          25% { opacity: 1; filter: blur(0); }
          80% { transform: scale(1.02); }
          100% { transform: scale(1.06); }
        }
        @keyframes splashRing {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes splashFadeUp {
          0% { transform: translateY(18px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes splashPulse {
          0% { transform: translateX(0); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
