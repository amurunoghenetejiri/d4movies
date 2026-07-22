import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAllMovies, useMovieBySlug } from "@/lib/movies";
import { useRecordProgress } from "@/lib/user-data";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, PictureInPicture,
  SkipForward, SkipBack, Subtitles, Settings, ChevronRight, Sun,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/watch/$id")({
  head: ({ params }) => ({ meta: [{ title: `Watch — D4MOVIES` }, { name: "robots", content: "noindex" }, { property: "og:url", content: `/watch/${params.id}` }] }),
  component: Watch,
});

type Gesture = null | "vol" | "brightness" | "seek";

function Watch() {
  const { id } = Route.useParams();
  const m = useMovieBySlug(id);
  const all = useAllMovies();
  const nav = useNavigate();
  const { user } = useAuth();
  const recordProgress = useRecordProgress();
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState<"Auto" | "4K" | "2K" | "1080p" | "720p">("Auto");
  const [brightness, setBrightness] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [hint, setHint] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTap = useRef<{ t: number; x: number } | null>(null);
  const gestureRef = useRef<{ mode: Gesture; startX: number; startY: number; startVol: number; startBright: number; startTime: number }>({
    mode: null, startX: 0, startY: 0, startVol: 0.7, startBright: 1, startTime: 0,
  });
  const pinchRef = useRef<{ dist: number; startZoom: number } | null>(null);

  const flash = (text: string) => {
    setHint(text);
    window.setTimeout(() => setHint(null), 800);
  };

  const bumpUI = () => {
    setShowUI(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowUI(false), 3500);
  };
  useEffect(() => { bumpUI(); }, []);

  // Resume playback from saved history
  useEffect(() => {
    if (!user || !m) return;
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.from("watch_history")
        .select("progress").eq("user_id", user.id).eq("movie_id", m.dbId).maybeSingle();
      const v = videoRef.current;
      if (v && data?.progress && data.progress > 1 && data.progress < 98) {
        const onReady = () => { v.currentTime = (data.progress / 100) * (v.duration || 0); v.removeEventListener("loadedmetadata", onReady); };
        if (v.readyState >= 1) onReady(); else v.addEventListener("loadedmetadata", onReady);
        flash(`Resumed from ${Math.round(data.progress)}%`);
      }
    })();
  }, [user, m]);

  useEffect(() => {
    if (!user || !m) return;
    persistTimer.current = setInterval(() => {
      if (progress > 0) recordProgress.mutate({ movieDbId: m.dbId, progress });
    }, 10_000);
    return () => { if (persistTimer.current) clearInterval(persistTimer.current); };
  }, [user, m, progress, recordProgress]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = speed;
  }, [speed]);

  if (!m) {
    return (
      <AppShell>
        <div className="pt-40 text-center text-muted-foreground">
          {all.length === 0 ? "Loading…" : "Movie not found."}
        </div>
      </AppShell>
    );
  }

  const related = all.filter((x) => x.id !== m.id).slice(0, 6);
  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = Math.floor(s % 60);
    return `${h}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };
  const dur = videoRef.current?.duration || m.runtimeMinutes * 60;
  const cur = videoRef.current?.currentTime || 0;

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) { setPlaying((p) => !p); return; }
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };
  const seekBy = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
    flash(delta > 0 ? `+${delta}s` : `${delta}s`);
  };
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) { setMuted((x) => !x); return; }
    v.muted = !v.muted;
    setMuted(v.muted);
  };
  const goFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen?.();
        // Auto landscape on mobile
        const so = (screen.orientation as any);
        if (so?.lock) { try { await so.lock("landscape"); } catch { /* not allowed */ } }
      }
    } catch { /* ignore */ }
  };
  const togglePip = async () => {
    const v = videoRef.current as any;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await (document as any).exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch { toast("Picture-in-Picture unavailable"); }
  };

  // ---- touch gestures ----
  const onTouchStart = (e: React.TouchEvent) => {
    bumpUI();
    const v = videoRef.current;
    if (!v) return;
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinchRef.current = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), startZoom: zoom };
      return;
    }
    const t = e.touches[0];
    const now = Date.now();
    const rect = containerRef.current!.getBoundingClientRect();
    const relX = t.clientX - rect.left;
    // double-tap
    if (lastTap.current && now - lastTap.current.t < 300 && Math.abs(lastTap.current.x - t.clientX) < 40) {
      if (relX < rect.width / 3) seekBy(-10);
      else if (relX > (rect.width * 2) / 3) seekBy(10);
      else togglePlay();
      lastTap.current = null;
      return;
    }
    lastTap.current = { t: now, x: t.clientX };
    gestureRef.current = {
      mode: null,
      startX: t.clientX, startY: t.clientY,
      startVol: v.volume, startBright: brightness, startTime: v.currentTime,
    };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const v = videoRef.current;
    if (!v) return;
    if (e.touches.length === 2 && pinchRef.current) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ratio = d / pinchRef.current.dist;
      setZoom(Math.max(1, Math.min(2.5, pinchRef.current.startZoom * ratio)));
      return;
    }
    const t = e.touches[0];
    const g = gestureRef.current;
    const dx = t.clientX - g.startX;
    const dy = t.clientY - g.startY;
    if (!g.mode) {
      if (Math.abs(dy) < 12 && Math.abs(dx) < 12) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        const rect = containerRef.current!.getBoundingClientRect();
        g.mode = t.clientX - rect.left < rect.width / 2 ? "brightness" : "vol";
      } else {
        g.mode = "seek";
      }
    }
    if (g.mode === "vol") {
      const nv = Math.max(0, Math.min(1, g.startVol - dy / 200));
      v.volume = nv; setMuted(nv === 0);
      flash(`Vol ${Math.round(nv * 100)}%`);
    } else if (g.mode === "brightness") {
      const nb = Math.max(0.2, Math.min(1, g.startBright - dy / 200));
      setBrightness(nb);
      flash(`Brightness ${Math.round(nb * 100)}%`);
    } else if (g.mode === "seek") {
      const nt = Math.max(0, Math.min(v.duration || 0, g.startTime + dx / 5));
      v.currentTime = nt;
      flash(`${fmt(nt)}`);
    }
  };
  const onTouchEnd = () => {
    gestureRef.current.mode = null;
    pinchRef.current = null;
  };

  return (
    <div className="min-h-screen bg-black" onMouseMove={bumpUI} onClick={bumpUI}>
      <div
        ref={containerRef}
        className="relative aspect-video max-h-[92vh] w-full bg-black overflow-hidden select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ filter: `brightness(${brightness})` }}
      >
        {m.movieUrl ? (
          <video
            ref={videoRef}
            src={m.movieUrl}
            poster={m.backdrop}
            autoPlay
            playsInline
            className="h-full w-full object-contain transition-transform"
            style={{ transform: `scale(${zoom})` }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => {
              const t = e.currentTarget;
              setProgress((t.currentTime / (t.duration || 1)) * 100);
            }}
            onEnded={() => user && m && recordProgress.mutate({ movieDbId: m.dbId, progress: 100 })}
          >
            {m.subtitleUrl && <track kind="subtitles" src={m.subtitleUrl} srcLang="en" label="English" default />}
          </video>
        ) : (
          <>
            <img src={m.backdrop} alt="" className={`h-full w-full object-cover ${playing ? "opacity-70" : "opacity-40"}`} />
            <div className="absolute inset-0 grid place-items-center text-center p-4">
              <div>
                <p className="text-sm text-muted-foreground">Streaming source not yet available.</p>
                <p className="text-xs text-muted-foreground mt-1">Upload a movie file from the Upload page to make this playable.</p>
              </div>
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black pointer-events-none" />

        {/* Gesture toast */}
        {hint && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-black/70 px-4 py-2 text-sm font-semibold text-foreground backdrop-blur-md animate-fade-in">
            {hint}
          </div>
        )}

        <div className={`absolute inset-x-0 top-0 p-4 md:p-6 flex items-center justify-between transition-opacity duration-500 ${showUI ? "opacity-100" : "opacity-0"}`}>
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="rounded-full" onClick={() => nav({ to: "/movie/$id", params: { id: m.id } })} aria-label="Back"><ArrowLeft /></Button>
            <div>
              <div className="text-sm text-muted-foreground">Now playing</div>
              <div className="font-semibold">{m.title}</div>
            </div>
          </div>
          <Logo size={36} />
        </div>

        {!playing && m.movieUrl && (
          <button onClick={togglePlay} className="absolute inset-0 grid place-items-center">
            <div className="grid place-items-center size-24 rounded-full bg-primary/95 text-primary-foreground glow-emerald">
              <Play className="size-10 fill-current" />
            </div>
          </button>
        )}

        {progress < 20 && m.movieUrl && (
          <Button className="absolute right-4 md:right-8 bottom-28 md:bottom-32 rounded-full" onClick={() => seekBy(45)}>
            Skip Intro <ChevronRight />
          </Button>
        )}

        <div className={`absolute inset-x-0 bottom-0 p-4 md:p-6 transition-opacity duration-500 ${showUI ? "opacity-100" : "opacity-0"}`}>
          <div className="flex items-center gap-3 text-xs mb-2">
            <span>{fmt(cur)}</span>
            <input
              type="range" min={0} max={100} step={0.1} value={progress}
              onChange={(e) => { const v = videoRef.current; if (!v) return; v.currentTime = ((+e.target.value) / 100) * (v.duration || 0); }}
              className="flex-1 accent-primary"
            />
            <span>{fmt(dur)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 md:gap-2">
            <Button size="icon" variant="ghost" className="rounded-full" onClick={() => seekBy(-10)}><SkipBack /></Button>
            <Button size="icon" variant="ghost" className="rounded-full" onClick={togglePlay}>{playing ? <Pause /> : <Play />}</Button>
            <Button size="icon" variant="ghost" className="rounded-full" onClick={() => seekBy(10)}><SkipForward /></Button>
            <Button size="icon" variant="ghost" className="rounded-full" onClick={toggleMute}>{muted ? <VolumeX /> : <Volume2 />}</Button>
            <input type="range" min={0} max={100} defaultValue={70}
              onChange={(e) => { const v = videoRef.current; if (v) v.volume = (+e.target.value) / 100; }}
              className="hidden md:block w-24 accent-primary" />
            <div className="hidden md:flex items-center gap-1 ml-2 text-xs text-muted-foreground">
              <Sun className="size-3.5" />
              <input type="range" min={20} max={100} value={Math.round(brightness * 100)}
                onChange={(e) => setBrightness((+e.target.value) / 100)} className="w-20 accent-primary" />
            </div>

            <div className="ml-auto flex items-center gap-1">
              <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setSpeed((s) => (s >= 2 ? 0.5 : +(s + 0.25).toFixed(2)))}>{speed}x</Button>
              <select value={quality} onChange={(e) => { setQuality(e.target.value as any); flash(`Quality: ${e.target.value}`); }}
                className="rounded-full bg-white/10 text-xs px-2 py-1 border border-white/10">
                {["Auto","4K","2K","1080p","720p"].map((q) => <option key={q} className="bg-background">{q}</option>)}
              </select>
              <Button size="icon" variant="ghost" className="rounded-full" onClick={() => toast("Subtitles: English")}><Subtitles /></Button>
              <Button size="icon" variant="ghost" className="rounded-full" onClick={() => toast("Audio: English 5.1")}><Settings /></Button>
              <Button size="icon" variant="ghost" className="rounded-full" onClick={togglePip}><PictureInPicture /></Button>
              <Button size="icon" variant="ghost" className="rounded-full" onClick={goFullscreen}><Maximize /></Button>
            </div>
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground/70 md:hidden text-center">
            Tap: controls • Double-tap: seek ±10s • Swipe left: brightness • Swipe right: volume • Pinch: zoom
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 grid md:grid-cols-[1fr_320px] gap-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold"><span className="text-gradient-emerald">{m.title}</span></h1>
          <p className="mt-3 text-muted-foreground">{m.description}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <Setting label="Subtitles" value={m.subtitleUrl ? "English (uploaded)" : "English (default)"} />
            <Setting label="Audio" value={`${m.language} • 5.1`} />
            <Setting label="Quality" value={quality} />
            <Setting label="Auto Play" value="On" />
          </div>
        </div>
        <aside>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Up Next</div>
          <div className="space-y-3">
            {related.map((r) => (
              <Link key={r.id} to="/watch/$id" params={{ id: r.id }} className="flex gap-3 glass rounded-xl p-2 hover-lift">
                <img src={r.poster} alt="" className="w-20 h-28 object-cover rounded-lg" />
                <div className="min-w-0">
                  <div className="font-semibold truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.year} • {r.runtime}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}
