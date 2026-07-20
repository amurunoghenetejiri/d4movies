import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { movies } from "@/lib/movies";

export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "Favorites — D4TECH Movies" }] }),
  component: () => (
    <AppShell>
      <PageHeader kicker="Personal" title="Your Favorites" subtitle="The titles that made you fall in love." />
      <MovieGrid movies={movies.filter((m) => m.rating >= 8).slice(0, 18)} />
    </AppShell>
  ),
});
