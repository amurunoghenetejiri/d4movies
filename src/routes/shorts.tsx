import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Volume2, VolumeX, Play, Heart, Share2, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/shorts")({
  head: () => ({
    meta: [
      { title: "Shorts — D4MOVIES" },
      {
        name: "description",
        content: "Trailers, clips, interviews and behind-the-scenes in a vertical feed.",
      },
      { property: "og:title", content: "Shorts — D4MOVIES" },
      {
        property: "og:description",
        content: "A vertical short-video feed for movie fans.",
      },
    ],
  }),
  component: ShortsPage,
});

type YTItem = {
  id: string;
  title: string;
  description: string;
  channel: string;
  publishedAt: string;
  thumbnail: string;
};

function useShortsFeed(query: string) {
  return useInfiniteQuery({
    queryKey: ["yt-shorts", query],
    queryFn: async ({ pageParam }) => {
      const u = new URL("/api/youtube", window.location.origin);
      u.searchParams.set("type", "shorts");
      if (query) u.searchParams.set("q", query);
      if (pageParam) u.searchParams.set("pageToken", pageParam as string);
      const r = await fetch(u.toString());
      if (!r.ok) {
        let detail = "shorts feed";
        try {
          const body = await r.json();
          detail = body?.error ?? body?.detail ?? detail;
        } catch {
          /* ignore */
        }
        throw new Error(String(detail));
      }
      return (await r.json()) as { items: YTItem[]; nextPageToken: string | null };
    },
    initialPageParam: "" as string,
    getNextPageParam: (last) => last.nextPageToken ?? undefined,
    staleTime: 60_000,
    retry: 1,
  });
}

function ShortsPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const q = useShortsFeed(query);

  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    if (searchOpen) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [searchOpen]);

  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  const errorMsg = q.error instanceof Error ? q.error.message : q.isError ? "Failed to load shorts" : null;
  const needsApiKey =
    !!errorMsg &&
    (errorMsg.includes("YOUTUBE_API_KEY") || errorMsg.toLowerCase().includes("not configured"));

  return (
    <div className="fixed inset-0 z-40 bg-black text-foreground overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          to="/"
          className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-2 py-1.5 border border-white/10"
          aria-label="Back to home"
        >
          <ArrowLeft className="size-4 shrink-0" />
          <Logo size={28} />
        </Link>

        <div className="pointer-events-auto flex items-center">
          {searchOpen ? (
            <div className="flex items-center gap-2 rounded-full bg-black/70 backdrop-blur-md border border-white/15 pl-3 pr-1.5 py-1.5 w-[min(72vw,280px)] shadow-lg">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search shorts…"
                className="bg-transparent outline-none text-sm flex-1 min-w-0 placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearchOpen(false);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (input) {
                    setInput("");
                    setQuery("");
                  } else {
                    setSearchOpen(false);
                  }
                }}
                className="size-8 rounded-full grid place-items-center hover:bg-white/10"
                aria-label="Close search"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="size-10 rounded-full grid place-items-center bg-black/50 backdrop-blur-md border border-white/10 hover:bg-black/70"
              aria-label="Search shorts"
            >
              <Search className="size-5" />
            </button>
          )}
        </div>
      </div>

      {errorMsg && items.length === 0 && (
        <div className="absolute inset-0 z-30 grid place-items-center px-6 text-center">
          <div className="max-w-sm space-y-3">
            <p className="text-base font-semibold">Shorts could not load</p>
            <p className="text-sm text-muted-foreground">
              {needsApiKey
                ? "Set YOUTUBE_API_KEY in your environment (Lovable secrets / Vercel env vars), then redeploy."
                : errorMsg}
            </p>
            <button
              type="button"
              onClick={() => q.refetch()}
              className="rounded-full px-4 py-2 text-sm bg-primary text-primary-foreground"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <ShortsFeed
        items={items}
        onNearEnd={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
        loading={q.isLoading}
      />
    </div>
  );
}

function ShortsFeed({
  items,
  onNearEnd,
  loading,
}: {
  items: YTItem[];
  onNearEnd: () => void;
  loading: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const onNearEndRef = useRef(onNearEnd);
  onNearEndRef.current = onNearEnd;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const nodes = el.querySelectorAll<HTMLElement>("[data-short]");
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.55) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActiveIndex(idx);
          }
        }
        const nearEnd = entries.some(
          (e) => e.isIntersecting && Number((e.target as HTMLElement).dataset.idx) >= items.length - 3,
        );
        if (nearEnd) onNearEndRef.current();
      },
      { root: el, threshold: [0.55, 0.75] },
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [items.length]);

  return (
    <div
      ref={scrollerRef}
      className="h-[100dvh] w-full overflow-y-auto snap-y snap-mandatory overscroll-y-contain"
      style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
    >
      {loading && items.length === 0 && (
        <div className="h-[100dvh] grid place-items-center text-muted-foreground text-sm">Loading shorts…</div>
      )}
      {items.map((it, i) => (
        <ShortItem
          key={it.id}
          item={it}
          idx={i}
          active={i === activeIndex}
          preload={i === activeIndex + 1}
          muted={muted}
          onToggleMute={() => setMuted((v) => !v)}
        />
      ))}
      {items.length > 0 && (
        <div className="h-16 grid place-items-center text-xs text-muted-foreground">
          {loading ? "Loading more…" : "Swipe for more"}
        </div>
      )}
    </div>
  );
}

function ShortItem({
  item,
  idx,
  active,
  preload,
  muted,
  onToggleMute,
}: {
  item: YTItem;
  idx: number;
  active: boolean;
  preload: boolean;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const [playing, setPlaying] = useState(true);
  const [liked, setLiked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const src = active
    ? `https://www.youtube.com/embed/\( {item.id}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist= \){item.id}&enablejsapi=1&iv_load_policy=3`
    : "";

  useEffect(() => {
    if (active) setPlaying(true);
  }, [active]);

  const postCmd = (func: "playVideo" | "pauseVideo" | "mute" | "unMute") => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
  };

  useEffect(() => {
    if (!active || !src) return;
    const t = window.setTimeout(() => postCmd(muted ? "mute" : "unMute"), 400);
    return () => clearTimeout(t);
  }, [muted, active, src]);

  const share = async () => {
    const url = `https://youtu.be/${item.id}`;
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <section
      data-short
      data-idx={idx}
      className="relative h-[100dvh] w-full snap-start snap-always flex items-center justify-center bg-black"
    >
      {active && src ? (
        <iframe
          ref={iframeRef}
          key={item.id}
          src={src}
          title={item.title}
          className="absolute inset-0 h-full w-full pointer-events-none"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          loading="eager"
        />
      ) : (
        <img
          src={item.thumbnail}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover opacity-80"
          loading={preload || idx < 2 ? "eager" : "lazy"}
          decoding="async"
        />
      )}

      <button
        type="button"
        aria-label={playing ? "Pause" : "Play"}
        onClick={() => {
function ShortItem({
  item,
  idx,
  active,
  preload,
  muted,
  onToggleMute,
}: {
  item: YTItem;
  idx: number;
  active: boolean;
  preload: boolean;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const [playing, setPlaying] = useState(true);
  const [liked, setLiked] = useState(false);
  const [ready, setReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // nocookie + mute helps autoplay on mobile; enablejsapi for play commands
  const src = active
    ? `https://www.youtube-nocookie.com/embed/\( {item.id}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist= \){item.id}&enablejsapi=1&iv_load_policy=3&fs=0`
    : "";

  useEffect(() => {
    if (active) {
      setPlaying(true);
      setReady(false);
    }
  }, [active]);

  const postCmd = (func: "playVideo" | "pauseVideo" | "mute" | "unMute") => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
      "*",
    );
  };

  const forcePlay = () => {
    postCmd("playVideo");
    postCmd(muted ? "mute" : "unMute");
    setPlaying(true);
  };

  // When iframe loads, keep trying play (mobile often needs this)
  const onIframeLoad = () => {
    setReady(true);
    forcePlay();
    window.setTimeout(forcePlay, 300);
    window.setTimeout(forcePlay, 800);
  };

  useEffect(() => {
    if (!active || !src || !ready) return;
    postCmd(muted ? "mute" : "unMute");
  }, [muted, active, src, ready]);

  const share = async () => {
    const url = `https://youtu.be/${item.id}`;
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <section
      data-short
      data-idx={idx}
      className="relative h-[100dvh] w-full snap-start snap-always flex items-center justify-center bg-black"
    >
      {/* Thumbnail under the iframe so black never shows while loading */}
      <img
        src={item.thumbnail}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading={preload || idx < 2 ? "eager" : "lazy"}
        decoding="async"
      />

      {active && src && (
        <iframe
          ref={iframeRef}
          key={item.id}
          src={src}
          title={item.title}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          loading="eager"
          onLoad={onIframeLoad}
        />
      )}

      {/* Tap anywhere: play/pause (also unlocks autoplay on mobile) */}
      <button
        type="button"
        aria-label={playing ? "Pause" : "Play"}
        onClick={() => {
          if (!playing || !ready) {
            forcePlay();
          } else {
            postCmd("pauseVideo");
            setPlaying(false);
          }
        }}
        className="absolute inset-0 z-10"
      >
        {!playing && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="size-16 rounded-full bg-black/50 backdrop-blur grid place-items-center">
              <Play className="size-8 fill-white text-white" />
            </div>
          </div>
        )}
      </button>

      <div className="absolute inset-x-0 bottom-0 z-20 p-4 pb-[max(5rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1 pr-2">
            <div className="text-xs text-primary font-semibold truncate">@{item.channel}</div>
            <h3 className="text-sm md:text-base font-semibold line-clamp-2">{item.title}</h3>
          </div>
          <div className="flex flex-col gap-3 pointer-events-auto shrink-0">
            <button
              type="button"
              onClick={() => setLiked((v) => !v)}
              className={`size-11 rounded-full grid place-items-center bg-black/40 backdrop-blur border border-white/10 ${liked ? "text-red-500" : "text-foreground"}`}
              aria-label="Like"
            >
              <Heart className={`size-5 ${liked ? "fill-current" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              className="size-11 rounded-full grid place-items-center bg-black/40 backdrop-blur border border-white/10"
              aria-label="Mute"
            >
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
            <button
              type="button"
              onClick={share}
              className="size-11 rounded-full grid place-items-center bg-black/40 backdrop-blur border border-white/10"
              aria-label="Share"
            >
              <Share2 className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
  }
