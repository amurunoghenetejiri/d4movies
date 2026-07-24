import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/layout/AppShell";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { TmdbCard } from "@/components/movies/TmdbCard";
import { useAllMovies } from "@/lib/movies";
import { useTmdbSearch, TMDB_ENABLED } from "@/lib/tmdb";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, X, Loader2 } from "lucide-react";

const searchSchema = z.object({ q: z.string().optional().catch("") });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search — D4MOVIES" },
      { name: "description", content: "Instant search across movies, TV series and anime from our library and TMDb." },
      { property: "og:title", content: "Search — D4MOVIES" },
      { property: "og:description", content: "Instant realtime search across D4MOVIES and TMDb." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const all = useAllMovies();
  const [query, setQuery] = useState(q ?? "");
  const [debounced, setDebounced] = useState(query);

  useEffect(() => { setQuery(q ?? ""); }, [q]);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 180);
    return () => clearTimeout(t);
  }, [query]);

  const tmdb = useTmdbSearch(debounced);

  const libResults = useMemo(() => {
    const t = debounced.toLowerCase();
    if (!t) return [];
    return all.filter((m) =>
      m.title.toLowerCase().includes(t) ||
      m.description.toLowerCase().includes(t) ||
      m.genres.some((g) => g.toLowerCase().includes(t)) ||
      m.country.toLowerCase().includes(t) ||
      m.cast.some((c) => c.toLowerCase().includes(t)),
    );
  }, [all, debounced]);

  const tmdbResults = (tmdb.data ?? []).filter(
    (it) => it.media_type === "movie" || it.media_type === "tv",
  );
  const hasQuery = debounced.length > 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 md:px-6 pt-24 md:pt-28">
        <div className="glass-strong rounded-2xl flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 shadow-2xl ring-1 ring-white/10">
          <SearchIcon className="size-5 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV series, anime…"
            className="border-0 bg-transparent focus-visible:ring-0 text-base h-11"
            autoFocus
          />
          {tmdb.isFetching && hasQuery && (
            <Loader2 className="size-4 text-muted-foreground animate-spin shrink-0" />
          )}
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear"
              className="rounded-full p-1.5 hover:bg-white/10 shrink-0"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {!hasQuery && (
          <p className="text-center text-xs md:text-sm text-muted-foreground mt-4">
            Start typing to see instant results.
          </p>
        )}
      </div>

      {hasQuery && libResults.length > 0 && (
        <div className="mt-8">
          <div className="mx-auto max-w-7xl px-4 md:px-6 mb-2">
            <h2 className="text-base md:text-lg font-bold">
              In our library <span className="text-muted-foreground text-xs md:text-sm font-normal">· {libResults.length}</span>
            </h2>
          </div>
          <MovieGrid movies={libResults} />
        </div>
      )}

      {hasQuery && TMDB_ENABLED && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 mt-8">
          <h2 className="text-base md:text-lg font-bold mb-3">
            From TMDb <span className="text-muted-foreground text-xs md:text-sm font-normal">· {tmdbResults.length}</span>
          </h2>
          {tmdbResults.length === 0 && !tmdb.isFetching ? (
            <div className="text-sm text-muted-foreground">No matches found.</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 md:gap-4">
              {tmdbResults.map((it) => (
                <TmdbCard key={`${it.media_type}-${it.id}`} item={it} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="h-16" />
    </AppShell>
  );
}
