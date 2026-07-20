import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { allGenres, movies } from "@/lib/movies";

export const Route = createFileRoute("/genres")({
  head: () => ({ meta: [{ title: "Genres — D4TECH Movies" }] }),
  component: Genres,
});

function Genres() {
  return (
    <AppShell>
      <PageHeader kicker="Explore" title="Genres" subtitle="Find your next favorite by mood, tone or theme." />
      <div className="mx-auto max-w-7xl px-4 md:px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {allGenres.map((g, i) => {
          const cover = movies.find((m) => m.genres.includes(g))?.backdrop;
          return (
            <Link key={g} to="/search" search={{ q: g }} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border hover-lift">
              <img src={cover} alt={g} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex items-end p-4">
                <span className="text-lg md:text-xl font-bold text-gradient-emerald">{g}</span>
              </div>
              <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-widest text-gold">
                {String(i + 1).padStart(2, "0")}
              </span>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
