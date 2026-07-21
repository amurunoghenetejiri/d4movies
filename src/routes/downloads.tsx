import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDownloads, useRemoveDownload } from "@/lib/user-data";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Play, Trash2 } from "lucide-react";

export const Route = createFileRoute("/downloads")({
  head: () => ({ meta: [{ title: "Downloads — D4TECH Movies" }] }),
  component: Downloads,
});

function Downloads() {
  const { user, loading } = useAuth();
  const q = useDownloads();
  const remove = useRemoveDownload();

  if (!loading && !user) {
    return (
      <AppShell>
        <PageHeader kicker="Library" title="Downloads" subtitle="Sign in to queue downloads for offline viewing." />
        <div className="mx-auto max-w-md px-4 py-8 text-center">
          <Button asChild className="rounded-full glow-emerald"><Link to="/login">Sign in</Link></Button>
        </div>
      </AppShell>
    );
  }

  const items = q.data ?? [];
  return (
    <AppShell>
      <PageHeader kicker="Library" title="Downloads" subtitle="Watch offline anytime." />
      <div className="mx-auto max-w-4xl px-4 md:px-6 space-y-3">
        {q.isLoading && <p className="text-center text-muted-foreground py-8">Loading…</p>}
        {items.length === 0 && !q.isLoading && (
          <div className="text-center text-muted-foreground py-16">No downloads yet.</div>
        )}
        {items.map((it) => (
          <div key={it.id} className="glass rounded-2xl p-3 flex gap-3 items-center">
            <img src={it.movie.poster} alt="" className="w-16 h-24 object-cover rounded-lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-semibold truncate">{it.movie.title}</div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold text-gold-foreground font-bold">{it.movie.quality}</span>
              </div>
              <div className="text-xs text-muted-foreground">{it.movie.runtime} • {it.movie.year}</div>
              <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full ${it.status === "ready" ? "bg-gold" : "bg-primary"}`} style={{ width: `${it.progress}%` }} />
              </div>
              <div className="text-[11px] mt-1 text-muted-foreground capitalize">{it.status}</div>
            </div>
            <div className="flex flex-col gap-1">
              <Button asChild size="icon" variant="ghost" className="rounded-full">
                <Link to="/watch/$id" params={{ id: it.movie.id }}><Play /></Link>
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(it.id)} className="rounded-full text-destructive"><Trash2 /></Button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
