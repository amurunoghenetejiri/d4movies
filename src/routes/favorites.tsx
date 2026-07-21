import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { useFavorites } from "@/lib/user-data";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "Favorites — D4TECH Movies" }] }),
  component: Favorites,
});

function Favorites() {
  const { user, loading } = useAuth();
  const q = useFavorites();
  if (!loading && !user) {
    return (
      <AppShell>
        <PageHeader kicker="Personal" title="Your Favorites" subtitle="Sign in to keep your favorites." />
        <div className="mx-auto max-w-md px-4 py-8 text-center">
          <Button asChild className="rounded-full glow-emerald"><Link to="/login">Sign in</Link></Button>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell>
      <PageHeader kicker="Personal" title="Your Favorites" subtitle="The titles that made you fall in love." />
      {q.isLoading ? (
        <p className="text-center text-muted-foreground py-16">Loading…</p>
      ) : (
        <MovieGrid movies={q.data ?? []} />
      )}
    </AppShell>
  );
}
