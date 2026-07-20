import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { findMovie, movies } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, PictureInPicture,
  SkipForward, SkipBack, Subtitles, Settings, ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/watch/$id")({
  head: ({ params }) => {
    const m = findMovie(params.id);
    return { meta: [{ title: `Watch ${m?.title ?? "Movie"} — D4TECH Movies` }, { name: "robots", content: "noindex" }] };
  },
  loader: ({ params }): import("@/lib/movies").Movie => {
    const m = findMovie(params.id);
    if (!m) throw notFound();
    return m;
  },
  component: Watch,
});

function Watch() {
  const m = Route.useLoaderData();
  const nav = useNavigate();
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(12);
  const [showUI, setShowUI] = useState(true);
  const [speed, setSpeed] = useState(1);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (playing) {
      timer.current = setInterval(() => setProgress((p) => (p >= 100 ? 100 : p + 0.15)), 500);
    }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing]);

  const bumpUI = () => {
    setShowUI(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowUI(false), 3500);
  };
  useEffect(() => { bumpUI(); }, []);

  const related = movies.filter((x) => x.id !== m.id).slice(0, 6);
  const runtimeMin = 118;
  const cur = Math.floor((progress / 100) * runtimeMin);
  const fmt = (mm: number) => `${Math.floor(mm / 60)}:${String(mm % 60).padStart(2, "0")}:00`;

  return (
    <div className="min-h-screen bg-black" onMouseMove={bumpUI} onClick={bumpUI}>
      <div className="relative aspect-video max-h-[92vh] w-full bg-black overflow-hidden">
        <img src={m.backdrop} alt="" className={`h-full w-full object-cover ${playing ? "opacity-70" : "opacity-40"}`} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />

        {/* Top overlay */}
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

        {/* Center play */}
        {!playing && (
          <button onClick={() => setPlaying(true)} className="absolute inset-0 grid place-items-center">
            <div className="grid place-items-center size-24 rounded-full bg-primary/95 text-primary-foreground glow-emerald">
              <Play className="size-10 fill-current" />
            </div>
          </button>
        )}

        {/* Skip intro */}
        {progress < 20 && (
          <Button className="absolute right-4 md:right-8 bottom-28 md:bottom-32 rounded-full" onClick={() => setProgress(22)}>
            Skip Intro <ChevronRight />
          </Button>
        )}
        {progress > 95 && (
          <Button className="absolute right-4 md:right-8 bottom-28 md:bottom-32 rounded-full" onClick={() => toast("Next up: Related movie")}>
            Skip Credits <ChevronRight />
          </Button>
        )}

        {/* Bottom controls */}
        <div className={`absolute inset-x-0 bottom-0 p-4 md:p-6 transition-opacity duration-500 ${showUI ? "opacity-100" : "opacity-0"}`}>
          <div className="flex items-center gap-3 text-xs mb-2">
            <span>{fmt(cur)}</span>
            <input
              type="range" min={0} max={100} step={0.1} value={progress}
              onChange={(e) => setProgress(+e.target.value)}
              className="flex-1 accent-primary"
            />
            <span>{fmt(runtimeMin)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 md:gap-2">
            <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setProgress((p) => Math.max(0, p - 5))}><SkipBack /></Button>
            <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause /> : <Play />}
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setProgress((p) => Math.min(100, p + 5))}><SkipForward /></Button>
            <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setMuted((v) => !v)}>
              {muted ? <VolumeX /> : <Volume2 />}
            </Button>
            <div className="mx-2 text-xs text-muted-foreground hidden md:block">Volume</div>
            <input type="range" min={0} max={100} defaultValue={70} className="hidden md:block w-24 accent-primary" />

            <div className="ml-auto flex items-center gap-1">
              <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setSpeed((s) => (s >= 2 ? 0.5 : +(s + 0.25).toFixed(2)))}>
                {speed}x
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full" onClick={() => toast("Subtitles: English")}><Subtitles /></Button>
              <Button size="icon" variant="ghost" className="rounded-full" onClick={() => toast("Audio: English 5.1")}><Settings /></Button>
              <Button size="icon" variant="ghost" className="rounded-full" onClick={() => toast("Picture in Picture")}><PictureInPicture /></Button>
              <Button size="icon" variant="ghost" className="rounded-full" onClick={() => toast("Fullscreen (demo)")}><Maximize /></Button>
            </div>
          </div>
        </div>
      </div>

      {/* Under player */}
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
