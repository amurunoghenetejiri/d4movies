import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { useWatchlist } from "@/lib/user-data";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/watchlist")({
  head: () => ({ meta: [{ title: "Watchlist — D4TECH Movies" }] }),
  component: Watchlist,
});

function Watchlist() {
  const { user, loading } = useAuth();
  const q = useWatchlist();
  if (!loading && !user) {
    return (
      <AppShell>
        <PageHeader kicker="Personal" title="Your Watchlist" subtitle="Sign in to save titles for later." />
        <div className="mx-auto max-w-md px-4 py-8 text-center">
          <Button asChild className="rounded-full glow-emerald"><Link to="/login">Sign in</Link></Button>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell>
      <PageHeader kicker="Personal" title="Your Watchlist" subtitle="The movies you've saved for later." />
      {q.isLoading ? (
        <p className="text-center text-muted-foreground py-16">Loading…</p>
      ) : (
        <MovieGrid movies={q.data ?? []} />
      )}
    </AppShell>
  );
}
