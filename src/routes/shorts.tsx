import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Search, Volume2, VolumeX, Play, Pause, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shorts")({
  head: () => ({
    meta: [
      { title: "Shorts — D4MOVIES" },
      { name: "description", content: "Trailers, clips, interviews and behind-the-scenes in a vertical feed." },
      { property: "og:title", content: "Shorts — D4MOVIES" },
      { property: "og:description", content: "A vertical short-video feed for movie fans." },
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
      if (!r.ok) throw new Error("shorts feed");
      return (await r.json()) as { items: YTItem[]; nextPageToken: string | null };
    },
    initialPageParam: "" as string,
    getNextPageParam: (last) => last.nextPageToken ?? undefined,
    staleTime: 60_000,
  });
}

function ShortsPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const q = useShortsFeed(query);

  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), 250);
    return () => clearTimeout(t);
  }, [input]);

  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);

  return (
    <AppShell>
      <div className="fixed top-14 md:top-16 inset-x-0 z-30 px-3">
        <div className="mx-auto max-w-md glass-strong rounded-full flex items-center gap-2 px-4 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search trailers, clips, interviews…"
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <ShortsFeed items={items} onNearEnd={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()} loading={q.isLoading} />
    </AppShell>
  );
}

function ShortsFeed({ items, onNearEnd, loading }: { items: YTItem[]; onNearEnd: () => void; loading: boolean }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            setActiveIndex(idx);
          }
        }
        if (entries.some((e) => e.isIntersecting && Number((e.target as HTMLElement).dataset.idx) >= items.length - 3)) {
          onNearEnd();
        }
      },
      { root: el, threshold: [0.6] },
    );
    el.querySelectorAll<HTMLElement>("[data-short]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [items.length, onNearEnd]);

  return (
    <div
      ref={scrollerRef}
      className="fixed inset-0 top-0 md:top-0 pt-0 overflow-y-auto snap-y snap-mandatory"
      style={{ scrollbarWidth: "none" }}
    >
      {loading && items.length === 0 && (
        <div className="h-[100dvh] grid place-items-center text-muted-foreground">Loading shorts…</div>
      )}
      {items.map((it, i) => (
        <ShortItem
          key={`${it.id}-${i}`}
          item={it}
          idx={i}
          active={i === activeIndex}
          muted={muted}
          onToggleMute={() => setMuted((v) => !v)}
        />
      ))}
      {items.length > 0 && (
        <div className="h-24 grid place-items-center text-xs text-muted-foreground">Loading more…</div>
      )}
    </div>
  );
}

function ShortItem({
  item, idx, active, muted, onToggleMute,
}: { item: YTItem; idx: number; active: boolean; muted: boolean; onToggleMute: () => void }) {
  const [playing, setPlaying] = useState(true);
  const [liked, setLiked] = useState(false);

  const src = active
    ? `https://www.youtube.com/embed/${item.id}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${item.id}&${playing ? "" : "start=0&"}iv_load_policy=3`
    : "";

  const share = async () => {
    const url = `https://youtu.be/${item.id}`;
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
      else { await navigator.clipboard.writeText(url); toast("Link copied"); }
    } catch { /* cancelled */ }
  };

  return (
    <section
      data-short
      data-idx={idx}
      className="relative h-[100dvh] w-full snap-start snap-always flex items-center justify-center bg-black"
    >
      {active ? (
        <iframe
          key={src}
          src={src}
          title={item.title}
          className="absolute inset-0 h-full w-full pointer-events-none"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <img src={item.thumbnail} alt={item.title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
      )}

      {/* Tap-to-play/pause overlay (uses YT postMessage) */}
      <button
        aria-label={playing ? "Pause" : "Play"}
        onClick={() => {
          const iframe = (document.querySelector(`section[data-idx="${idx}"] iframe`) as HTMLIFrameElement | null);
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(
              JSON.stringify({ event: "command", func: playing ? "pauseVideo" : "playVideo", args: [] }),
              "*",
            );
          }
          setPlaying((v) => !v);
        }}
        className="absolute inset-0 z-10"
      >
        {!playing && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="size-16 rounded-full bg-black/50 backdrop-blur grid place-items-center">
              <Play className="size-8 fill-white text-white" />
            </div>
          </div>
        )}
      </button>

      <div className="absolute inset-x-0 bottom-0 z-20 p-4 pb-32 md:pb-8 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-primary font-semibold truncate">@{item.channel}</div>
            <h3 className="text-sm md:text-base font-semibold line-clamp-2">{item.title}</h3>
          </div>
          <div className="flex flex-col gap-3 pointer-events-auto">
            <button
              onClick={() => setLiked((v) => !v)}
              className={`size-11 rounded-full grid place-items-center glass ${liked ? "text-red-500" : "text-foreground"}`}
              aria-label="Like"
            >
              <Heart className={`size-5 ${liked ? "fill-current" : ""}`} />
            </button>
            <button onClick={onToggleMute} className="size-11 rounded-full grid place-items-center glass" aria-label="Mute">
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
            <button onClick={share} className="size-11 rounded-full grid place-items-center glass" aria-label="Share">
              <Share2 className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
