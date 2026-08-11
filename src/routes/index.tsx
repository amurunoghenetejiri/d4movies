import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { HeroCarousel } from "@/components/movies/HeroCarousel";
import { MovieRow } from "@/components/movies/MovieRow";
import { TmdbRow } from "@/components/movies/TmdbRow";
import { TmdbCard } from "@/components/movies/TmdbCard";
import { useAllMovies, useUploadedByTmdb } from "@/lib/movies";
import { useHistory } from "@/lib/user-data";
import { useAuth } from "@/hooks/use-auth";
import {
  TMDB_ENABLED, TMDB_GENRES,
  useTmdbNowPlaying, useTmdbPopular, useTmdbTopRated, useTmdbTrending,
  useTmdbTvPopular, useTmdbUpcoming, useTmdbByGenre,
  useTmdbInfiniteDiscover,
  type TmdbItem,
} from "@/lib/tmdb";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "D4MOVIES — Stream. Discover. Enjoy." },
      { name: "description", content: "Premium streaming for movies, TV series, anime and world dramas in HD & 4K on D4STREAMS." },
      { property: "og:title", content: "D4MOVIES — Stream. Discover. Enjoy." },
      { property: "og:description", content: "Trending, top-rated, and freshly uploaded movies across every genre." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

/** Shuffle array so hero posters feel fresh every visit. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Home() {
  const movies = useAllMovies();
  const { user } = useAuth();
  const history = useHistory();

  // TMDb feeds
  const trending = useTmdbTrending();
  const popular = useTmdbPopular();
  const topRated = useTmdbTopRated();
  const nowPlaying = useTmdbNowPlaying();
  const upcoming = useTmdbUpcoming();
  const tvPopular = useTmdbTvPopular();
  const action = useTmdbByGenre(TMDB_GENRES.Action);
  const adventure = useTmdbByGenre(TMDB_GENRES.Adventure);
  const comedy = useTmdbByGenre(TMDB_GENRES.Comedy);
  const horror = useTmdbByGenre(TMDB_GENRES.Horror);
  const romance = useTmdbByGenre(TMDB_GENRES.Romance);
  const animation = useTmdbByGenre(TMDB_GENRES.Animation);

  // Infinite discovery feed
  const infinite = useTmdbInfiniteDiscover();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && infinite.hasNextPage && !infinite.isFetchingNextPage) {
        infinite.fetchNextPage();
      }
    }, { rootMargin: "600px" });
    io.observe(node);
    return () => io.disconnect();
  }, [infinite.hasNextPage, infinite.isFetchingNextPage, infinite]);

  // Deduped, flat feed across pages
  const infiniteItems = useMemo(() => {
    const seen = new Set<number>();
    const out: TmdbItem[] = [];
    for (const page of infinite.data?.pages ?? []) {
      for (const it of page.results ?? []) {
        if (!seen.has(it.id)) {
          seen.add(it.id);
          out.push(it);
        }
      }
    }
    return out;
  }, [infinite.data]);

  // Dynamic hero: featured first, then newest uploads, shuffled so posters keep changing
  const heroSource = useMemo(() => {
    if (!movies.length) return [];
    const featured = movies.filter((m) => m.featured);
    const rest = movies.filter((m) => !m.featured);
    // Prefer newest first within each group, then lightly shuffle for variety
    const sortedRest = [...rest].sort((a, b) => (b.year || 0) - (a.year || 0));
    const pool = [...featured, ...sortedRest].slice(0, 12);
    return shuffle(pool).slice(0, 8);
  }, [movies]);

  const continueWatching = (history.data ?? []).filter((h) => h.progress < 100).map((h) => h.movie);

  return (
    <AppShell>
      <HeroCarousel movies={heroSource.length ? heroSource : movies.slice(0, 6)} />

      <div className="mt-4 md:mt-8 space-y-8 md:space-y-12">
        {user && continueWatching.length > 0 && (
          <MovieRow title="Continue Watching" subtitle="Pick up right where you left off" movies={continueWatching} size="md" />
        )}

        {movies.length > 0 && (
          <MovieRow title="Fresh Uploads" subtitle="From our creator community" movies={movies.slice(0, 14)} />
        )}

        <TmdbRow title="Trending This Week" subtitle="What the world is watching" items={trending.data} loading={trending.isLoading} />
        <TmdbRow title="Popular Movies" subtitle="The crowd favorites" items={popular.data} loading={popular.isLoading} />
        <TmdbRow title="Top Rated" subtitle="Critically acclaimed" items={topRated.data} loading={topRated.isLoading} />
        <TmdbRow title="Now Playing" subtitle="In theaters right now" items={nowPlaying.data} loading={nowPlaying.isLoading} />
        <TmdbRow title="Coming Soon" subtitle="On the horizon" items={upcoming.data} loading={upcoming.isLoading} />
        <TmdbRow title="Popular TV Series" subtitle="Binge the moment" items={tvPopular.data} loading={tvPopular.isLoading} />
        <TmdbRow title="Action" items={action.data} loading={action.isLoading} />
        <TmdbRow title="Adventure" items={adventure.data} loading={adventure.isLoading} />
        <TmdbRow title="Comedy" items={comedy.data} loading={comedy.isLoading} />
        <TmdbRow title="Horror" items={horror.data} loading={horror.isLoading} />
        <TmdbRow title="Romance" items={romance.data} loading={romance.isLoading} />
        <TmdbRow title="Animation" items={animation.data} loading={animation.isLoading} />

        {/* Endless feed */}
        {TMDB_ENABLED && (
          <InfiniteFeed items={infiniteItems} loading={infinite.isFetching} />
        )}

        <div ref={sentinelRef} className="h-24" />

        {movies.length === 0 && !TMDB_ENABLED && (
          <div className="mx-4 md:mx-6 glass rounded-2xl p-8 text-center">
            <h2 className="text-xl font-bold text-gradient-emerald">Library is empty</h2>
            <p className="mt-2 text-muted-foreground text-sm">No uploads yet and TMDb isn't configured. Be the first — upload a movie to start.</p>
            <Link to="/upload" className="mt-4 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground glow-emerald">Upload now</Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function InfiniteFeed({ items, loading }: { items: TmdbItem[]; loading: boolean }) {
  // Hide items already uploaded to avoid duplicates (the uploaded copy shows in "Fresh Uploads")
  const uploaded = useUploadedByTmdb();
  const filtered = items.filter((it) => !uploaded.has(it.id));
  if (filtered.length === 0 && !loading) return null;
  return (
    <section className="px-4 md:px-6">
      <div className="mb-3">
        <h2 className="text-lg md:text-2xl font-bold">Endless Discovery</h2>
        <p className="text-xs md:text-sm text-muted-foreground">Keep scrolling — there's always more.</p>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2.5 md:gap-4">
        {filtered.map((it) => (
          <TmdbCard key={it.id} item={it} size="sm" />
        ))}
        {loading && Array.from({ length: 12 }).map((_, i) => (
          <div key={`sk-${i}`} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    </section>
  );
}
