import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Play, Pause, Maximize, PictureInPicture,
  SkipForward, SkipBack, Subtitles, Settings, Volume2, VolumeX, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import {
  tmdbBackdrop, tmdbPoster, tmdbYouTubeKey,
  useTmdbDetail, useTmdbRecommendations, TMDB_ENABLED,
} from "@/lib/tmdb";
import { PLACEHOLDER_PORTRAIT } from "@/lib/placeholders";
import { toast } from "sonner";

export const Route = createFileRoute("/trailer/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Trailer — D4MOVIES` },
      { name: "robots", content: "noindex" },
      { property: "og:url", content: `/trailer/${params.id}` },
    ],
  }),
  component: TrailerPage,
});

// Minimal YT IFrame API loader
let ytReady: Promise<void> | null = null;
function loadYT(): Promise<void> {
  if (ytReady) return ytReady;
  ytReady = new Promise((resolve) => {
    if ((window as any).YT?.Player) return resolve();
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
    (window as any).onYouTubeIframeAPIReady = () => resolve();
  });
  return ytReady;
}

type Gesture = null | "vol" | "brightness" | "seek";

function TrailerPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const detail = useTmdbDetail(id);
  const recs = useTmdbRecommendations(id);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeMountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState<string>("auto");
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [ccOn, setCcOn] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [hint, setHint] = useState<string | null>(null);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedSpeedRef = useRef(1);
  const lastTap = useRef<{ t: number; x: number } | null>(null);
  const gestureRef = useRef<{ mode: Gesture; startX: number; startY: number; startVol: number; startBright: number; startTime: number }>({
    mode: null, startX: 0, startY: 0, startVol: 70, startBright: 1, startTime: 0,
  });

  const yt = detail.data ? tmdbYouTubeKey(detail.data) : null;

  const flash = (t: string) => { setHint(t); setTimeout(() => setHint(null), 800); };
  const bumpUI = () => {
    setShowUI(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowUI(false), 3500);
  };
  useEffect(() => { bumpUI(); }, []);

  // Init YT player
  useEffect(() => {
    if (!yt || !iframeMountRef.current) return;
    let poll: ReturnType<typeof setInterval> | null = null;
    let disposed = false;
    loadYT().then(() => {
      if (disposed || !iframeMountRef.current) return;
      playerRef.current = new (window as any).YT.Player(iframeMountRef.current, {
        videoId: yt,
        playerVars: {
          autoplay: 1, controls: 0, modestbranding: 1, rel: 0, playsinline: 1,
          iv_load_policy: 3, cc_load_policy: 0, fs: 0, disablekb: 1,
        },
        events: {
          onReady: (e: any) => {
            setReady(true);
            setDuration(e.target.getDuration() || 0);
            try { setAvailableQualities(e.target.getAvailableQualityLevels?.() ?? []); } catch { /* */ }
            poll = setInterval(() => {
              try {
                const c = e.target.getCurrentTime() ?? 0;
                const d = e.target.getDuration() ?? 0;
                setCurrent(c); setDuration(d);
                if (d > 0) setProgress((c / d) * 100);
              } catch { /* */ }
            }, 500);
          },
          onStateChange: (e: any) => {
            const YT = (window as any).YT;
            setPlaying(e.data === YT.PlayerState.PLAYING);
          },
        },
      });
    });
    return () => {
      disposed = true;
      if (poll) clearInterval(poll);
      try { playerRef.current?.destroy?.(); } catch { /* */ }
    };
  }, [yt]);

  const p = () => playerRef.current;
  const togglePlay = () => { if (!p()) return; playing ? p().pauseVideo() : p().playVideo(); bumpUI(); };
  const toggleMute = () => { if (!p()) return; if (muted) { p().unMute(); setMuted(false); } else { p().mute(); setMuted(true); } bumpUI(); };
  const seekBy = (s: number) => { if (!p()) return; p().seekTo(Math.max(0, (p().getCurrentTime() || 0) + s), true); flash(s > 0 ? `+${s}s` : `${s}s`); bumpUI(); };
  const seekPct = (pct: number) => { if (!p() || !duration) return; p().seekTo((pct / 100) * duration, true); };
  const setPlayerSpeed = (v: number) => { if (!p()) return; p().setPlaybackRate(v); setSpeed(v); };
  const setPlayerQuality = (q: string) => { if (!p()) return; try { p().setPlaybackQuality(q); setQuality(q); flash(q); } catch { /* */ } };
  const toggleCC = () => {
    if (!p()) return;
    try {
      if (ccOn) { p().unloadModule("captions"); p().unloadModule("cc"); setCcOn(false); flash("CC off"); }
      else { p().loadModule("captions"); p().loadModule("cc"); p().setOption("captions", "track", { languageCode: "en" }); setCcOn(true); flash("CC on"); }
    } catch { /* */ }
  };

  const enterFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        await el.requestFullscreen?.();
        try { await (screen.orientation as any)?.lock?.("landscape"); } catch { /* */ }
      }
    } catch { /* */ }
  };
  const enterPiP = async () => {
    // YouTube iframe cross-origin blocks PiP; give user honest feedback.
    try {
      const videos = document.querySelectorAll("video");
      if (videos.length) {
        // @ts-ignore
        await videos[0].requestPictureInPicture?.();
      } else {
        toast("Picture-in-Picture isn't available for this trailer");
      }
    } catch {
      toast("Picture-in-Picture isn't available for this trailer");
    }
  };

  // Gestures
  const onTouchStart = (e: React.TouchEvent) => {
    bumpUI();
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const rect = containerRef.current!.getBoundingClientRect();
    const localX = t.clientX - rect.left;
    gestureRef.current = {
      mode: null, startX: t.clientX, startY: t.clientY,
      startVol: (() => { try { return p()?.getVolume?.() ?? 70; } catch { return 70; } })(),
      startBright: brightness,
      startTime: p()?.getCurrentTime?.() ?? 0,
    };
    // Long press = 2x speed
    longPressTimer.current = setTimeout(() => {
      savedSpeedRef.current = speed;
      setPlayerSpeed(2);
      flash("2× speed");
    }, 550);
    // Double-tap seek
    const now = Date.now();
    if (lastTap.current && now - lastTap.current.t < 300) {
      const side = localX < rect.width / 2 ? -10 : 10;
      seekBy(side);
      lastTap.current = null;
    } else {
      lastTap.current = { t: now, x: t.clientX };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const g = gestureRef.current;
    const dx = t.clientX - g.startX;
    const dy = t.clientY - g.startY;
    if (!g.mode) {
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
      if (Math.abs(dx) > Math.abs(dy)) g.mode = "seek";
      else {
        const rect = containerRef.current!.getBoundingClientRect();
        g.mode = t.clientX - rect.left < rect.width / 2 ? "brightness" : "vol";
      }
    }
    if (g.mode === "seek" && duration) {
      const delta = (dx / (containerRef.current?.clientWidth || 1)) * Math.min(120, duration);
      const target = Math.max(0, Math.min(duration, g.startTime + delta));
      flash(`${target > g.startTime ? "+" : ""}${Math.round(target - g.startTime)}s`);
    } else if (g.mode === "vol") {
      const delta = -(dy / (containerRef.current?.clientHeight || 1)) * 100;
      const v = Math.max(0, Math.min(100, g.startVol + delta));
      try { p()?.setVolume?.(v); if (v === 0) { p()?.mute?.(); setMuted(true); } else { p()?.unMute?.(); setMuted(false); } } catch { /* */ }
      flash(`Vol ${Math.round(v)}%`);
    } else if (g.mode === "brightness") {
      const delta = -(dy / (containerRef.current?.clientHeight || 1));
      const b = Math.max(0.25, Math.min(1, g.startBright + delta));
      setBrightness(b);
      flash(`Bright ${Math.round(b * 100)}%`);
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (speed === 2 && savedSpeedRef.current !== 2) { setPlayerSpeed(savedSpeedRef.current); flash(`${savedSpeedRef.current}×`); }
    const g = gestureRef.current;
    if (g.mode === "seek" && duration) {
      const dx = (e.changedTouches[0]?.clientX ?? g.startX) - g.startX;
      const delta = (dx / (containerRef.current?.clientWidth || 1)) * Math.min(120, duration);
      const target = Math.max(0, Math.min(duration, g.startTime + delta));
      p()?.seekTo?.(target, true);
    }
    g.mode = null;
  };

  if (!TMDB_ENABLED) {
    return <AppShell><div className="pt-40 text-center text-muted-foreground">TMDb not configured.</div></AppShell>;
  }
  if (detail.isLoading) {
    return <AppShell><div className="pt-40 text-center text-muted-foreground">Loading trailer…</div></AppShell>;
  }
  if (!detail.data) {
    return <AppShell><div className="pt-40 text-center text-muted-foreground">Not found.</div></AppShell>;
  }

  const d = detail.data;
  const director = d.credits?.crew?.find((c) => c.job === "Director")?.name;
  const cast = d.credits?.cast?.slice(0, 12) ?? [];
  const year = d.release_date ? new Date(d.release_date).getFullYear() : "";

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky player at top */}
      <div className="sticky top-0 z-40 bg-black">
        <div
          ref={containerRef}
          className="relative w-full aspect-video max-h-[70vh] mx-auto bg-black select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseMove={bumpUI}
          onClick={bumpUI}
          style={{ filter: `brightness(${brightness})` }}
        >
          {!yt && (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              No trailer available.
            </div>
          )}
          <div ref={iframeMountRef} className="absolute inset-0 pointer-events-none [&>iframe]:w-full [&>iframe]:h-full" />

          {/* Top bar */}
          <div className={`absolute top-0 inset-x-0 p-3 md:p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent transition-opacity ${showUI ? "opacity-100" : "opacity-0"}`}>
            <button onClick={() => nav({ to: "/tmdb/$id", params: { id } })} className="flex items-center gap-2 text-white/90 text-sm hover:text-white">
              <ArrowLeft className="size-5" /> Back
            </button>
            <div className="text-white/80 text-xs md:text-sm truncate max-w-[60%]">{d.original_title} · Trailer</div>
            <div className="w-10" />
          </div>

          {/* Center play toggle */}
          <button
            onClick={togglePlay}
            className={`absolute inset-0 grid place-items-center transition-opacity ${showUI ? "opacity-100" : "opacity-0"}`}
            aria-label={playing ? "Pause" : "Play"}
          >
            <span className="size-16 md:size-20 rounded-full bg-black/50 backdrop-blur grid place-items-center">
              {playing ? <Pause className="size-8 text-white" /> : <Play className="size-8 text-white fill-white" />}
            </span>
          </button>

          {/* Hint */}
          {hint && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-black/70 px-4 py-2 text-white text-sm">{hint}</div>
          )}

          {/* Bottom controls */}
          <div className={`absolute bottom-0 inset-x-0 p-3 md:p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity ${showUI ? "opacity-100" : "opacity-0"}`}>
            {/* Progress */}
            <div
              className="group h-1.5 md:h-1 w-full rounded-full bg-white/20 cursor-pointer"
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const pct = ((e.clientX - rect.left) / rect.width) * 100;
                seekPct(Math.max(0, Math.min(100, pct)));
              }}
            >
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex items-center gap-1 md:gap-2 text-white">
              <button onClick={togglePlay} className="p-2 hover:text-primary">{playing ? <Pause className="size-5" /> : <Play className="size-5" />}</button>
              <button onClick={() => seekBy(-10)} className="p-2 hover:text-primary"><SkipBack className="size-5" /></button>
              <button onClick={() => seekBy(10)} className="p-2 hover:text-primary"><SkipForward className="size-5" /></button>
              <button onClick={toggleMute} className="p-2 hover:text-primary">{muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}</button>
              <div className="text-[11px] md:text-xs tabular-nums opacity-80 ml-1">{fmt(current)} / {fmt(duration)}</div>
              <div className="ml-auto flex items-center gap-1">
                <button onClick={toggleCC} className={`p-2 hover:text-primary ${ccOn ? "text-primary" : ""}`}><Subtitles className="size-5" /></button>
                <button onClick={() => setShowSettings((s) => !s)} className="p-2 hover:text-primary"><Settings className="size-5" /></button>
                <button onClick={enterPiP} className="p-2 hover:text-primary hidden md:inline-flex"><PictureInPicture className="size-5" /></button>
                <button onClick={enterFullscreen} className="p-2 hover:text-primary"><Maximize className="size-5" /></button>
              </div>
            </div>

            {showSettings && (
              <div className="absolute bottom-16 right-3 md:right-4 w-56 glass rounded-xl p-3 text-sm text-white space-y-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/60 mb-1">Speed</div>
                  <div className="flex flex-wrap gap-1">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((v) => (
                      <button key={v} onClick={() => setPlayerSpeed(v)}
                        className={`px-2 py-1 rounded-full text-xs ${speed === v ? "bg-primary text-primary-foreground" : "bg-white/10 hover:bg-white/20"}`}>
                        {v}×
                      </button>
                    ))}
                  </div>
                </div>
                {availableQualities.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-white/60 mb-1">Quality</div>
                    <div className="flex flex-wrap gap-1">
                      {availableQualities.map((q) => (
                        <button key={q} onClick={() => setPlayerQuality(q)}
                          className={`px-2 py-1 rounded-full text-xs ${quality === q ? "bg-primary text-primary-foreground" : "bg-white/10 hover:bg-white/20"}`}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tap layer to expose controls above iframe */}
          <div className="absolute inset-0" onClick={togglePlay} style={{ pointerEvents: "none" }} />
        </div>
      </div>

      {/* Details below */}
      <AppShell hideFooter>
        <div className="relative">
          <div className="absolute inset-0 -z-10 h-96 overflow-hidden">
            <img src={tmdbBackdrop(d.backdrop_path)} alt="" className="h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>
          <div className="mx-auto max-w-6xl px-4 md:px-6 pt-6 pb-10 grid md:grid-cols-[220px_1fr] gap-6 md:gap-10">
            <img src={tmdbPoster(d.poster_path, "w500")} alt={d.original_title} className="w-32 md:w-full rounded-2xl border border-border/60 shadow-2xl" />
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold"><span className="text-gradient-emerald">{d.original_title}</span></h1>
              {d.tagline && <p className="mt-1 italic text-muted-foreground text-sm">{d.tagline}</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="glass rounded-full px-3 py-1 flex items-center gap-1"><Star className="size-3 fill-gold text-gold" /> {d.vote_average.toFixed(1)}</span>
                {year && <span className="glass rounded-full px-3 py-1">{year}</span>}
                {d.runtime > 0 && <span className="glass rounded-full px-3 py-1">{Math.floor(d.runtime / 60)}h {d.runtime % 60}m</span>}
                {d.genres.map((g) => <span key={g.id} className="glass rounded-full px-3 py-1">{g.name}</span>)}
              </div>
              <p className="mt-4 text-sm md:text-base text-foreground/85 max-w-3xl">{d.overview}</p>
              <div className="mt-3 text-sm text-muted-foreground space-y-1">
                {director && <div><span className="text-foreground/70">Director:</span> {director}</div>}
                {d.production_countries?.length > 0 && <div><span className="text-foreground/70">Country:</span> {d.production_countries.map((c) => c.name).join(", ")}</div>}
              </div>
              <div className="mt-5">
                <Button asChild variant="secondary" className="rounded-full">
                  <Link to="/tmdb/$id" params={{ id }}>View Details</Link>
                </Button>
              </div>
            </div>
          </div>

          {cast.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 md:px-6 mt-4">
              <h2 className="text-lg font-bold mb-3">Cast</h2>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {cast.map((c, i) => (
                  <div key={i} className="w-24 md:w-28 shrink-0 text-center">
                    <img
                      src={c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : PLACEHOLDER_PORTRAIT}
                      alt={c.name}
                      className="w-24 md:w-28 h-32 md:h-36 object-cover rounded-xl border border-border/50"
                    />
                    <div className="mt-1 text-xs font-semibold truncate">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{c.character}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mx-auto max-w-6xl px-4 md:px-6 mt-8">
            <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">
              Comments & reviews open once this title is uploaded to D4MOVIES.
            </div>
          </section>

          {(recs.data?.length ?? 0) > 0 && (
            <section className="mx-auto max-w-6xl px-4 md:px-6 mt-8 mb-16">
              <h2 className="text-lg font-bold mb-3">Recommended</h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {recs.data!.slice(0, 12).map((r) => (
                  <Link key={r.id} to="/tmdb/$id" params={{ id: String(r.id) }} className="group">
                    <div className="aspect-[2/3] overflow-hidden rounded-xl border border-border/40">
                      <img src={tmdbPoster(r.poster_path, "w342")} alt={r.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="mt-1 text-xs font-medium truncate">{r.title}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </AppShell>
    </div>
  );
}

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
