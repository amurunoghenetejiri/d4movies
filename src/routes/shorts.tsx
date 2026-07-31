import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Volume2, VolumeX, Heart, Share2, ExternalLink, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shorts")({
  head: () => ({
    meta: [
      { title: "Shorts — D4MOVIES" },
      { name: "description", content: "Vertical YouTube shorts feed." },
      { property: "og:title", content: "Shorts — D4MOVIES" },
      { property: "og:description", content: "Watch YouTube shorts in a vertical feed." },
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

let ytReady: Promise<void> | null = null;
function loadYT(): Promise<void> {
  if (ytReady) return ytReady;
  ytReady = new Promise((resolve) => {
    if ((window as unknown as { YT?: { Player?: unknown } }).YT?.Player) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
    (window as unknown as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = () =>
      resolve();
  });
  return ytReady;
}

function useShortsFeed(query: string) {
  return useInfiniteQuery({
    queryKey: ["yt-shorts-feed", query],
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
          /* */
        }
        throw new Error(String(detail));
      }
      return (await r.json()) as { items: YTItem[]; nextPageToken: string | null };
    },
    initialPageParam: "" as string,
    getNextPageParam: (last) => last.nextPageToken ?? undefined,
    staleTime: 30_000,
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
    const t = setTimeout(() => setQuery(input.trim()), 350);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    if (searchOpen) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [searchOpen]);

  const submitSearch = () => {
    setQuery(input.trim());
    inputRef.current?.blur();
    setSearchOpen(false);
  };

  const items = useMemo(() => {
    const seen = new Set<string>();
    const out: YTItem[] = [];
    for (const p of q.data?.pages ?? []) {
      for (const it of p.items) {
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        out.push(it);
      }
    }
    return out;
  }, [q.data]);

  const errorMsg =
    q.error instanceof Error
      ? q.error.message
      : q.isError
        ? "Failed to load shorts"
        : null;
  const needsKey =
    !!errorMsg &&
    (errorMsg.includes("YOUTUBE_API_KEY") || errorMsg.toLowerCase().includes("not configured"));

  return (
    <div className="fixed inset-0 z-40 bg-black text-foreground overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          to="/"
          className="pointer-events-auto flex items-center justify-center size-11 rounded-full bg-black/55 backdrop-blur-md border border-white/15 shadow-lg shadow-black/40"
          aria-label="Back to home"
        >
          <ArrowLeft className="size-5 text-white" />
        </Link>

        <div className="pointer-events-auto flex items-center">
          {searchOpen ? (
            <div className="flex items-center gap-2 rounded-full bg-black/75 backdrop-blur-md border border-white/15 pl-3 pr-1.5 py-1.5 w-[min(68vw,280px)] shadow-lg">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search YouTube…"
                className="bg-transparent outline-none text-sm flex-1 min-w-0 placeholder:text-muted-foreground"
                enterKeyHint="search"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitSearch();
                  }
                  if (e.key === "Escape") {
                    setSearchOpen(false);
                    inputRef.current?.blur();
                  }
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
                    inputRef.current?.blur();
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
              className="size-11 rounded-full grid place-items-center bg-black/55 backdrop-blur-md border border-white/15 shadow-lg shadow-black/40 hover:bg-black/70"
              aria-label="Search"
            >
              <Search className="size-5" />
            </button>
          )}
        </div>
      </div>

      {errorMsg && items.length === 0 && (
        <div className="absolute inset-0 z-30 grid place-items-center px-6 text-center">
          <div className="max-w-sm space-y-3">
            <p className="font-semibold">Shorts could not load</p>
            <p className="text-sm text-muted-foreground">
              {needsKey
                ? "Set YOUTUBE_API_KEY on Vercel (Environment Variables), then redeploy."
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
    setActiveIndex(0);
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [items[0]?.id]);

  const goToIndex = (next: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const node = el.querySelector<HTMLElement>(`[data-short][data-idx="${next}"]`);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveIndex(next);
    }
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const nodes = el.querySelectorAll<HTMLElement>("[data-short]");
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActiveIndex(idx);
          }
        }
        if (
          entries.some(
            (e) => e.isIntersecting && Number((e.target as HTMLElement).dataset.idx) >= items.length - 3,
          )
        ) {
          onNearEndRef.current();
        }
      },
      { root: el, threshold: [0.6] },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [items.length]);

  return (
    <div
      ref={scrollerRef}
      className="h-[100dvh] w-full overflow-y-auto snap-y snap-mandatory"
      style={{ scrollbarWidth: "none" }}
    >
      {loading && items.length === 0 && (
        <div className="h-[100dvh] grid place-items-center text-muted-foreground">Loading shorts…</div>
      )}
      {items.map((it, i) => (
        <ShortItem
          key={it.id}
          item={it}
          idx={i}
          active={i === activeIndex}
          muted={muted}
          onToggleMute={() => setMuted((v) => !v)}
          onEnded={() => {
            if (i + 1 < items.length) goToIndex(i + 1);
            else onNearEndRef.current();
          }}
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
  muted,
  onToggleMute,
  onEnded,
}: {
  item: YTItem;
  idx: number;
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onEnded: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{
    playVideo?: () => void;
    pauseVideo?: () => void;
    mute?: () => void;
    unMute?: () => void;
    destroy?: () => void;
  } | null>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  useEffect(() => {
    if (!active) {
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* */
      }
      playerRef.current = null;
      return;
    }

    setEmbedError(false);
    let disposed = false;

    loadYT().then(() => {
      if (disposed || !mountRef.current) return;
      mountRef.current.innerHTML = "";
      const host = document.createElement("div");
      host.id = `yt-short-\( {item.id}- \){idx}`;
      host.style.width = "100%";
      host.style.height = "100%";
      mountRef.current.appendChild(host);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const YT = (window as any).YT;
      playerRef.current = new YT.Player(host, {
        videoId: item.id,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          fs: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onReady: (e: any) => {
            try {
              e.target.playVideo?.();
              if (muted) e.target.mute?.();
              else e.target.unMute?.();
            } catch {
              /* */
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (e: any) => {
            if (e.data === 0) onEndedRef.current();
          },
          onError: () => setEmbedError(true),
        },
      });
    });

    return () => {
      disposed = true;
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* */
      }
      playerRef.current = null;
    };
  }, [active, item.id, idx]);

  useEffect(() => {
    if (!active || !playerRef.current) return;
    try {
      if (muted) playerRef.current.mute?.();
      else playerRef.current.unMute?.();
    } catch {
      /* */
    }
  }, [muted, active]);

  const openOnYouTube = () => {
    window.open(`https://www.youtube.com/watch?v=${item.id}`, "_blank", "noopener,noreferrer");
  };

  const share = async () => {
    const url = `https://youtu.be/${item.id}`;
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Link copied");
      }
    } catch {
      /* */
    }
  };

  const title = item.title.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');

  return (
    <section
      data-short
      data-idx={idx}
      className="relative h-[100dvh] w-full snap-start snap-always flex items-center justify-center bg-black"
    >
      <img
        src={item.thumbnail}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading={idx < 2 ? "eager" : "lazy"}
      />

      {active && !embedError && (
        <div
          ref={mountRef}
          className="absolute inset-0 z-[1] [&>div]:h-full [&>div]:w-full [&>iframe]:h-full [&>iframe]:w-full"
        />
      )}

      {active && embedError && (
        <div className="absolute inset-0 z-[2] grid place-items-center bg-black/70 px-6 text-center">
          <div className="space-y-4 max-w-xs">
            <p className="text-sm text-muted-foreground">
              YouTube blocked in-app playback for this video on your network.
            </p>
            <button
              type="button"
              onClick={openOnYouTube}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <ExternalLink className="size-4" />
              Watch on YouTube
            </button>
            <button
              type="button"
              onClick={onEnded}
              className="block mx-auto text-sm text-muted-foreground underline"
            >
              Skip to next
            </button>
          </div>
        </div>
      )}

      <div className="absolute right-3 bottom-28 z-20 flex flex-col gap-3">
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
        <button
          type="button"
          onClick={openOnYouTube}
          className="size-11 rounded-full grid place-items-center bg-black/40 backdrop-blur border border-white/10"
          aria-label="Open on YouTube"
        >
          <ExternalLink className="size-5" />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none">
        <div className="min-w-0 pr-14">
          <div className="text-xs text-primary font-semibold truncate">@{item.channel}</div>
          <h3 className="text-sm md:text-base font-semibold line-clamp-2">{title}</h3>
        </div>
      </div>
    </section>
  );
}
