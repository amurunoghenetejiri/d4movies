import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { movies } from "@/lib/movies";

export const Route = createFileRoute("/watchlist")({
  head: () => ({ meta: [{ title: "Watchlist — D4TECH Movies" }] }),
  component: () => (
    <AppShell>
      <PageHeader kicker="Personal" title="Your Watchlist" subtitle="The movies you've saved for later." />
      <MovieGrid movies={movies.slice(3, 15)} />
    </AppShell>
  ),
});
