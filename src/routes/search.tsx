import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { allCountries, allGenres, movies } from "@/lib/movies";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";

const searchSchema = z.object({ q: z.string().optional().catch("") });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Search — D4TECH Movies" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const [query, setQuery] = useState(q ?? "");
  const [genre, setGenre] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [quality, setQuality] = useState<string | null>(null);

  useEffect(() => { setQuery(q ?? ""); }, [q]);

  const results = useMemo(() => {
    const t = query.trim().toLowerCase();
    return movies.filter((m) => {
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
  }, [query, genre, country, year, minRating, quality]);

  const years = Array.from(new Set(movies.map((m) => m.year))).sort((a, b) => b - a);

  return (
    <AppShell>
      <PageHeader kicker="Search" title="Find your next watch" />
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
          <Filter label="Genre" value={genre} setValue={setGenre} options={allGenres} />
          <Filter label="Country" value={country} setValue={setCountry} options={allCountries} />
          <Filter label="Year" value={year} setValue={setYear} options={years.map(String)} />
          <Filter label="Quality" value={quality} setValue={setQuality} options={["4K", "FHD", "HD"]} />
          <div className="glass rounded-xl p-3">
            <div className="text-xs text-muted-foreground mb-1">Min IMDb: {minRating}</div>
            <input type="range" min={0} max={10} step={0.5} value={minRating} onChange={(e) => setMinRating(+e.target.value)} className="w-full accent-primary" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{results.length} results</p>
      </div>
      <MovieGrid movies={results} />
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
