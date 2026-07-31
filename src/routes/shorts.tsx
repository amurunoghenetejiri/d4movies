import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Search, Volume2, VolumeX, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
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
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const q = useShortsFeed(query);

  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  const errorMsg = !TMDB_ENABLED
    ? "VITE_TMDB_API_KEY is missing on Vercel"
    : q.error instanceof Error
      ? q.error.message
      : q.isError
        ? "Failed to load trailers"
        : null;

  return (
    <AppShell>
      <div className="fixed top-14 md:top-16 inset-x-0 z-30 px-3">
        <div className="mx-auto max-w-md glass-strong rounded-full flex items-center gap-2 px-4 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search movie trailers…"
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {errorMsg && items.length === 0 && (
        <div className="fixed inset-0 grid place-items-center px-6 text-center z-20">
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
    </AppShell>
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
      className="fixed inset-0 top-0 overflow-y-auto snap-y snap-mandatory"
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
        <div className="h-24 grid place-items-center text-xs text-muted-foreground">
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

  const src = active
    ? `https://www.youtube.com/embed/\( {item.id}?autoplay=1&mute= \){muted ? 1 : 0}&controls=1&modestbranding=1&rel=0&playsinline=1&fs=1`
    : "";

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

      {active && src && (
        <iframe
          key={`\( {item.id}- \){muted ? "m" : "u"}`}
          src={src}
          title={item.title}
          className="absolute inset-0 h-full w-full z-[1]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}

      <div className="absolute right-3 bottom-36 z-20 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          className={`size-11 rounded-full grid place-items-center glass ${liked ? "text-red-500" : "text-foreground"}`}
          aria-label="Like"
        >
          <Heart className={`size-5 ${liked ? "fill-current" : ""}`} />
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          className="size-11 rounded-full grid place-items-center glass"
          aria-label="Mute"
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
        <button
          type="button"
          onClick={share}
          className="size-11 rounded-full grid place-items-center glass"
          aria-label="Share"
        >
          <Share2 className="size-5" />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 p-4 pb-28 md:pb-8 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none">
        <div className="min-w-0 pr-14">
          <div className="text-xs text-primary font-semibold truncate">@{item.channel}</div>
          <h3 className="text-sm md:text-base font-semibold line-clamp-2">{item.title}</h3>
        </div>
      </div>
    </section>
  );
}
