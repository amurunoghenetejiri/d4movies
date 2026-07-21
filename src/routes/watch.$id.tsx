import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAllMovies, useMovieBySlug } from "@/lib/movies";
import { useRecordProgress } from "@/lib/user-data";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, PictureInPicture,
  SkipForward, SkipBack, Subtitles, Settings, ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/watch/$id")({
  head: ({ params }) => ({ meta: [{ title: `Watch — D4TECH Movies` }, { name: "robots", content: "noindex" }, { property: "og:url", content: `/watch/${params.id}` }] }),
  component: Watch,
});

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const bumpUI = () => {
    setShowUI(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowUI(false), 3500);
  };
  useEffect(() => { bumpUI(); }, []);

  // Persist progress every 10s while playing
  useEffect(() => {
    if (!user || !m) return;
    persistTimer.current = setInterval(() => {
      if (progress > 0) recordProgress.mutate({ movieDbId: m.dbId, progress });
    }, 10_000);
    return () => { if (persistTimer.current) clearInterval(persistTimer.current); };
  }, [user, m, progress, recordProgress]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
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
  };
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) { setMuted((x) => !x); return; }
    v.muted = !v.muted;
    setMuted(v.muted);
  };
  const goFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else v.requestFullscreen?.();
  };
  const togglePip = async () => {
    const v = videoRef.current as any;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await (document as any).exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch { toast("Picture-in-Picture unavailable"); }
  };

  return (
    <div className="min-h-screen bg-black" onMouseMove={bumpUI} onClick={bumpUI}>
      <div className="relative aspect-video max-h-[92vh] w-full bg-black overflow-hidden">
        {m.movieUrl ? (
          <video
            ref={videoRef}
            src={m.movieUrl}
            poster={m.backdrop}
            autoPlay
            className="h-full w-full object-contain"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => {
              const t = e.currentTarget;
              setProgress((t.currentTime / (t.duration || 1)) * 100);
            }}
            onEnded={() => user && m && recordProgress.mutate({ movieDbId: m.dbId, progress: 100 })}
          />
        ) : (
          <>
            <img src={m.backdrop} alt="" className={`h-full w-full object-cover ${playing ? "opacity-70" : "opacity-40"}`} />
            <div className="absolute inset-0 grid place-items-center text-center p-4">
              <div>
                <p className="text-sm text-muted-foreground">Streaming source not yet available.</p>
                <p className="text-xs text-muted-foreground mt-1">This title will play once an admin uploads or links the video source.</p>
              </div>
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black pointer-events-none" />

        <div className={`absolute inset-x-0 top-0 p-4 md:p-6 flex items-center justify-between transition-opacity duration-500 ${showUI ? "opacity-100" : "opacity-0"}`}>
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="rounded-full" onClick={() => nav({ to: "/movie/$id", params: { id: m.id } })} aria-label="Back">
              <ArrowLeft />
            </Button>
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
              onChange={(e) => {
                const v = videoRef.current; if (!v) return;
                v.currentTime = ((+e.target.value) / 100) * (v.duration || 0);
              }}
              className="flex-1 accent-primary"
            />
            <span>{fmt(dur)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 md:gap-2">
            <Button size="icon" variant="ghost" className="rounded-full" onClick={() => seekBy(-10)}><SkipBack /></Button>
            <Button size="icon" variant="ghost" className="rounded-full" onClick={togglePlay}>
              {playing ? <Pause /> : <Play />}
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full" onClick={() => seekBy(10)}><SkipForward /></Button>
            <Button size="icon" variant="ghost" className="rounded-full" onClick={toggleMute}>
              {muted ? <VolumeX /> : <Volume2 />}
            </Button>
            <input
              type="range" min={0} max={100} defaultValue={70}
              onChange={(e) => { const v = videoRef.current; if (v) v.volume = (+e.target.value) / 100; }}
              className="hidden md:block w-24 accent-primary"
            />

            <div className="ml-auto flex items-center gap-1">
              <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setSpeed((s) => (s >= 2 ? 0.5 : +(s + 0.25).toFixed(2)))}>
                {speed}x
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full" onClick={() => toast("Subtitles: English")}><Subtitles /></Button>
              <Button size="icon" variant="ghost" className="rounded-full" onClick={() => toast("Audio: English 5.1")}><Settings /></Button>
              <Button size="icon" variant="ghost" className="rounded-full" onClick={togglePip}><PictureInPicture /></Button>
              <Button size="icon" variant="ghost" className="rounded-full" onClick={goFullscreen}><Maximize /></Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 grid md:grid-cols-[1fr_320px] gap-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold"><span className="text-gradient-emerald">{m.title}</span></h1>
          <p className="mt-3 text-muted-foreground">{m.description}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <Setting label="Subtitles" value="English (default)" />
            <Setting label="Audio" value={`${m.language} • 5.1`} />
            <Setting label="Quality" value={m.quality} />
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
