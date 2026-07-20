import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { movies as ALL, allGenres, type Movie } from "@/lib/movies";
import { Button } from "@/components/ui/button";

export type CategoryProps = {
  title: string;
  subtitle?: string;
  kicker?: string;
  filter?: (m: Movie) => boolean;
  showGenreFilter?: boolean;
};

export function CategoryPage({ title, subtitle, kicker, filter, showGenreFilter = true }: CategoryProps) {
  const [genre, setGenre] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "rating" | "title">("newest");

  const list = useMemo(() => {
    let l = filter ? ALL.filter(filter) : ALL;
    if (genre) l = l.filter((m) => m.genres.includes(genre));
    if (sort === "rating") l = [...l].sort((a, b) => b.rating - a.rating);
    else if (sort === "title") l = [...l].sort((a, b) => a.title.localeCompare(b.title));
    else l = [...l].sort((a, b) => b.year - a.year);
    return l;
  }, [filter, genre, sort]);

  return (
    <AppShell>
      <PageHeader kicker={kicker} title={title} subtitle={subtitle} />
      <div className="mx-auto max-w-7xl px-4 md:px-6 flex flex-wrap gap-2 mt-2">
        {showGenreFilter && (
          <>
            <Button
              size="sm" variant={!genre ? "default" : "ghost"}
              onClick={() => setGenre(null)} className="rounded-full"
            >All</Button>
            {allGenres.map((g) => (
              <Button
                key={g} size="sm" variant={genre === g ? "default" : "ghost"}
                onClick={() => setGenre(g)} className="rounded-full"
              >{g}</Button>
            ))}
          </>
        )}
        <div className="ml-auto flex gap-1">
          {(["newest", "rating", "title"] as const).map((s) => (
            <Button key={s} size="sm" variant={sort === s ? "default" : "ghost"} className="rounded-full capitalize" onClick={() => setSort(s)}>
              {s}
            </Button>
          ))}
        </div>
      </div>
      <MovieGrid movies={list} />
    </AppShell>
  );
}
