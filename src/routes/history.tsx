import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useHistory } from "@/lib/user-data";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Watch History — D4TECH Movies" }] }),
  component: History,
});

function History() {
  const { user, loading } = useAuth();
  const q = useHistory();
  if (!loading && !user) {
    return (
      <AppShell>
        <PageHeader kicker="Personal" title="Watch History" subtitle="Sign in to see what you've watched." />
        <div className="mx-auto max-w-md px-4 py-8 text-center">
          <Button asChild className="rounded-full glow-emerald"><Link to="/login">Sign in</Link></Button>
        </div>
      </AppShell>
    );
  }
  const items = q.data ?? [];
  return (
    <AppShell>
      <PageHeader kicker="Personal" title="Watch History" subtitle="Everything you've watched, recently." />
      <div className="mx-auto max-w-5xl px-4 md:px-6 space-y-3">
        {q.isLoading && <p className="text-center text-muted-foreground py-8">Loading…</p>}
        {items.length === 0 && !q.isLoading && (
          <p className="text-center text-muted-foreground py-16">Nothing here yet — start watching!</p>
        )}
        {items.map((it) => (
          <Link key={it.movie.id} to="/watch/$id" params={{ id: it.movie.id }} className="glass hover-lift rounded-2xl p-3 flex gap-3 items-center">
            <img src={it.movie.poster} alt="" className="w-20 h-28 object-cover rounded-lg" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{it.movie.title}</div>
              <div className="text-xs text-muted-foreground">
                Watched {new Date(it.watchedAt).toLocaleDateString()} • {it.movie.runtime}
              </div>
              <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${it.progress}%` }} />
              </div>
              <div className="text-[11px] mt-1 text-muted-foreground">
                {it.progress >= 100 ? "Completed" : `${Math.round(it.progress)}% watched`}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
