import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { TmdbCard } from "@/components/movies/TmdbCard";
import { useAllMovies, useCountries, useGenres } from "@/lib/movies";
import { useTmdbSearch, TMDB_ENABLED } from "@/lib/tmdb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";

const searchSchema = z.object({ q: z.string().optional().catch("") });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search — D4MOVIES" },
      { name: "description", content: "Search across our library and the live TMDb catalog in real-time." },
      { property: "og:title", content: "Search — D4MOVIES" },
      { property: "og:description", content: "Realtime search across D4MOVIES and TMDb." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const all = useAllMovies();
  const genres = useGenres();
  const countries = useCountries();
  const [query, setQuery] = useState(q ?? "");
  const [debounced, setDebounced] = useState(query);
  const [genre, setGenre] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [quality, setQuality] = useState<string | null>(null);

  useEffect(() => { setQuery(q ?? ""); }, [q]);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const tmdb = useTmdbSearch(debounced);

  const results = useMemo(() => {
    const t = debounced.trim().toLowerCase();
    return all.filter((m) => {
      if (t) {
        const hit = m.title.toLowerCase().includes(t) ||
          m.description.toLowerCase().includes(t) ||
          m.genres.some((g) => g.toLowerCase().includes(t)) ||
          m.country.toLowerCase().includes(t) ||
          m.cast.some((c) => c.toLowerCase().includes(t));
        if (!hit) return false;
      }
      if (genre && !m.genres.includes(genre)) return false;
      if (country && m.country !== country) return false;
      if (year && String(m.year) !== year) return false;
      if (minRating && m.rating < minRating) return false;
      if (quality && m.quality !== quality) return false;
      return true;
    });
  }, [all, debounced, genre, country, year, minRating, quality]);

  const years = Array.from(new Set(all.map((m) => m.year))).sort((a, b) => b - a);
  const tmdbResults = tmdb.data ?? [];

  return (
    <AppShell>
      <PageHeader kicker="Search" title="Find your next watch" subtitle="Instant results from our library and TMDb." />
      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-5">
        <div className="glass rounded-2xl p-3 md:p-4 flex items-center gap-2">
          <SearchIcon className="ml-2 size-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, cast, genres, countries..."
            className="border-0 bg-transparent focus-visible:ring-0 text-base h-11"
            autoFocus
          />
          {query && <Button variant="ghost" size="sm" onClick={() => setQuery("")}>Clear</Button>}
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <Filter label="Genre" value={genre} setValue={setGenre} options={genres} />
          <Filter label="Country" value={country} setValue={setCountry} options={countries} />
          <Filter label="Year" value={year} setValue={setYear} options={years.map(String)} />
          <Filter label="Quality" value={quality} setValue={setQuality} options={["4K", "FHD", "HD"]} />
          <div className="glass rounded-xl p-3">
            <div className="text-xs text-muted-foreground mb-1">Min IMDb: {minRating}</div>
            <input type="range" min={0} max={10} step={0.5} value={minRating} onChange={(e) => setMinRating(+e.target.value)} className="w-full accent-primary" />
          </div>
        </div>
      </div>

      {/* Library results */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 mt-6">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-lg md:text-xl font-bold">In our library <span className="text-muted-foreground text-sm font-normal">· {results.length}</span></h2>
        </div>
      </div>
      {results.length > 0 ? (
        <MovieGrid movies={results} />
      ) : (
        <div className="mx-auto max-w-7xl px-4 md:px-6 text-sm text-muted-foreground">
          {debounced ? "No library matches. See TMDb results below — request an upload from a creator." : "Type to search the library."}
        </div>
      )}

      {/* TMDb realtime results */}
      {TMDB_ENABLED && debounced.trim().length >= 2 && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 mt-10">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg md:text-xl font-bold">From TMDb <span className="text-muted-foreground text-sm font-normal">· {tmdbResults.length}</span></h2>
            {tmdb.isFetching && <span className="text-xs text-muted-foreground">Searching…</span>}
          </div>
          {tmdbResults.length === 0 && !tmdb.isFetching ? (
            <div className="text-sm text-muted-foreground">No TMDb matches.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {tmdbResults.map((it) => <TmdbCard key={`${it.media_type}-${it.id}`} item={it} />)}
            </div>
          )}
        </div>
      )}

      {!TMDB_ENABLED && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 mt-8">
          <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">
            Add <code className="text-primary">VITE_TMDB_API_KEY</code> to enable live TMDb search across the world's catalog.
            <Link to="/upload" className="ml-2 text-primary underline">Upload a movie instead</Link>
          </div>
        </div>
      )}

      <div className="h-16" />
    </AppShell>
  );
}

function Filter({ label, value, setValue, options }: { label: string; value: string | null; setValue: (v: string | null) => void; options: string[] }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <select
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value || null)}
        className="w-full bg-transparent outline-none text-sm py-1"
      >
        <option value="" className="bg-background">All</option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-background">{o}</option>
        ))}
      </select>
    </div>
  );
}
