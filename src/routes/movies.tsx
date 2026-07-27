import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { MovieCard } from "@/components/movies/MovieCard";
import { TmdbCard } from "@/components/movies/TmdbCard";
import { useAllMovies, useUploadedByTmdb } from "@/lib/movies";
import { useTmdbInfiniteDiscover, TMDB_ENABLED } from "@/lib/tmdb";
import { Search } from "lucide-react";

export const Route = createFileRoute("/movies")({
  head: () => ({
    meta: [
      { title: "All Movies — D4MOVIES" },
      { name: "description", content: "Browse every uploaded movie and series on D4MOVIES, plus curated trailers." },
      { property: "og:title", content: "All Movies — D4MOVIES" },
      { property: "og:description", content: "Uploaded movies and series, plus trailers, in one premium feed." },
    ],
  }),
  component: MoviesPage,
});

function MoviesPage() {
  const uploaded = useAllMovies();
  const uploadedByTmdb = useUploadedByTmdb();
  const tmdb = useTmdbInfiniteDiscover();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 150);
    return () => clearTimeout(t);
  }, [query]);

  const filteredUploaded = useMemo(() => {
    const list = uploaded.filter((m) => !m.isHidden);
    if (!debounced) return list;
    return list.filter((m) =>
      [m.title, m.originalTitle, ...(m.genres ?? []), ...(m.cast ?? [])]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(debounced)),
    );
  }, [uploaded, debounced]);

  const tmdbItems = useMemo(() => {
    const pages = tmdb.data?.pages ?? [];
    const seen = new Set<number>();
    const out = [] as { id: number; title: string; poster_path: string | null; vote_average: number; release_date?: string; overview: string; backdrop_path: string | null }[];
    for (const p of pages) {
      for (const it of p.results as any[]) {
        if (seen.has(it.id)) continue;
        if (uploadedByTmdb.has(it.id)) continue; // dedupe uploads
        seen.add(it.id);
        out.push(it);
      }
    }
    if (!debounced) return out;
    return out.filter((it) => (it.title ?? "").toLowerCase().includes(debounced));
  }, [tmdb.data, uploadedByTmdb, debounced]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && tmdb.hasNextPage && !tmdb.isFetchingNextPage) {
        tmdb.fetchNextPage();
      }
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [tmdb]);

  return (
    <AppShell>
      <PageHeader kicker="Library" title="All Movies" subtitle="Every uploaded title on D4MOVIES — plus curated trailers." />

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="glass-strong rounded-full flex items-center gap-2 px-4 py-2 max-w-xl mx-auto">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, series, cast, genre…"
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {filteredUploaded.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 md:px-6 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-semibold">Available now on D4MOVIES</h2>
            <span className="text-xs text-muted-foreground">{filteredUploaded.length}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-5">
            {filteredUploaded.map((m) => (
              <div key={m.id} className="flex justify-center"><MovieCard m={m} size="sm" /></div>
            ))}
          </div>
        </section>
      )}

      {TMDB_ENABLED && (
        <section className="mx-auto max-w-7xl px-4 md:px-6 mt-8 pb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-semibold">Trailers & discovery</h2>
          </div>
          {tmdbItems.length === 0 && !tmdb.isLoading && filteredUploaded.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No matches. Try a different search.</p>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-5">
            {tmdbItems.map((it) => (
              <div key={it.id} className="flex justify-center"><TmdbCard item={it as any} /></div>
            ))}
          </div>
          <div ref={sentinelRef} className="h-16 grid place-items-center text-xs text-muted-foreground">
            {tmdb.isFetchingNextPage ? "Loading more…" : tmdb.hasNextPage ? " " : "You've reached the end."}
          </div>
        </section>
      )}
    </AppShell>
  );
}
