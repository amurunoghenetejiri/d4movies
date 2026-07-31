import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Volume2, VolumeX, Heart, Share2, ExternalLink, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { TMDB_ENABLED, TMDB_KEY, tmdbPoster } from "@/lib/tmdb";

export const Route = createFileRoute("/shorts")({
  head: () => ({
    meta: [
      { title: "Shorts — D4MOVIES" },
      { name: "description", content: "Official movie trailers in a vertical feed." },
      { property: "og:title", content: "Shorts — D4MOVIES" },
      { property: "og:description", content: "Watch official trailers in a vertical feed." },
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

type TmdbMovie = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path: string | null;
  release_date?: string;
};

type TmdbVideos = {
  results: { key: string; site: string; type: string; official: boolean; name: string }[];
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

async function tmdbGet<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("api_key", TMDB_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`TMDB ${r.status}`);
  return r.json();
}

function pickTrailer(videos: TmdbVideos | undefined): { key: string; name: string } | null {
  const yt = (videos?.results ?? []).filter((v) => v.site === "YouTube");
  const pick =
    yt.find((v) => v.type === "Trailer" && v.official) ||
    yt.find((v) => v.type === "Trailer") ||
    yt.find((v) => v.type === "Teaser") ||
    yt[0];
  return pick ? { key: pick.key, name: pick.name } : null;
}

async function fetchPage(page: number, query: string): Promise<{ items: YTItem[]; nextPage: number | null }> {
  if (!TMDB_ENABLED) throw new Error("VITE_TMDB_API_KEY missing");

  let movies: TmdbMovie[] = [];
  let totalPages = 1;

  if (query.trim().length >= 2) {
    const data = await tmdbGet<{ results: TmdbMovie[]; total_pages: number }>("/search/movie", {
      query: query.trim(),
      page,
      include_adult: "false",
    });
    movies = data.results ?? [];
    totalPages = data.total_pages ?? 1;
  } else {
    const path = page % 2 === 1 ? "/movie/popular" : "/movie/now_playing";
    const pageNum = Math.ceil(page / 2);
    const data = await tmdbGet<{ results: TmdbMovie[]; total_pages: number }>(path, { page: pageNum });
    movies = data.results ?? [];
    totalPages = Math.max(data.total_pages ?? 1, 8);
  }

  const settled = await Promise.all(
    movies.slice(0, 12).map(async (m) => {
      try {
        const detail = await tmdbGet<TmdbMovie & { videos?: TmdbVideos }>(`/movie/${m.id}`, {
          append_to_response: "videos",
        });
        const trailer = pickTrailer(detail.videos);
        if (!trailer) return null;
        const title = m.title || m.name || "Untitled";
        return {
          id: trailer.key,
          title: `${title} — ${trailer.name}`,
          description: m.overview ?? "",
          channel: "Official Trailer",
          publishedAt: m.release_date ?? "",
          thumbnail: tmdbPoster(m.poster_path, "w500"),
        } satisfies YTItem;
      } catch {
        return null;
      }
    }),
  );

  const seen = new Set<string>();
  const items = settled.filter((x): x is YTItem => {
    if (!x || seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });

  return { items, nextPage: page < totalPages ? page + 1 : null };
}

function useShortsFeed(query: string) {
  return useInfiniteQuery({
    queryKey: ["tmdb-trailer-shorts", query],
    queryFn: ({ pageParam }) => fetchPage(pageParam as number, query),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
    staleTime: 5 * 60_000,
    enabled: TMDB_ENABLED,
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
  const errorMsg = !TMDB_ENABLED
    ? "VITE_TMDB_API_KEY is missing on Vercel"
    : q.error instanceof Error
      ? q.error.message
      : q.isError
        ? "Failed to load trailers"
        : null;

  return (
    <div className="fixed inset-0 z-40 bg-black text-foreground overflow-hidden">
      {/* Top: logo + back LEFT · search icon RIGHT */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          to="/"
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/55 backdrop-blur-md pl-2.5 pr-3 py-1.5 border border-white/15 shadow-lg shadow-black/40"
          aria-label="Back to home"
        >
          <ArrowLeft className="size-5 shrink-0 text-white" />
          <Logo size={44} className="drop-shadow-[0_0_12px_rgba(0,200,83,0.55)]" />
        </Link>

        <div className="pointer-events-auto flex items-center">
          {searchOpen ? (
            <div className="flex items-center gap-2 rounded-full bg-black/75 backdrop-blur-md border border-white/15 pl-3 pr-1.5 py-1.5 w-[min(70vw,280px)] shadow-lg">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search trailers…"
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
          <div className="space-y-2">
            <p className="font-semibold">Could not load trailers</p>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
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
  }, [items[0]?.id]);

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
        <div className="h-[100dvh] grid place-items-center text-muted-foreground">Loading trailers…</div>
      )}
      {items.map((it, i) => (
        <ShortItem
          key={`\( {it.id}- \){i}`}
          item={it}
          idx={i}
          active={i === activeIndex}
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
  muted,
  onToggleMute,
}: {
  item: YTItem;
  idx: number;
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
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
      /* cancelled */
    }
  };

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
              YouTube blocked in-app playback for this trailer on your network.
            </p>
            <button
              type="button"
              onClick={openOnYouTube}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <ExternalLink className="size-4" />
              Watch on YouTube
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
          <h3 className="text-sm md:text-base font-semibold line-clamp-2">{item.title}</h3>
        </div>
      </div>
    </section>
  );
}
