import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { movies } from "@/lib/movies";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Watch History — D4TECH Movies" }] }),
  component: History,
});

function History() {
  const items = movies.slice(0, 12).map((m, i) => ({ ...m, watched: `${i + 1} day${i ? "s" : ""} ago`, progress: [100, 45, 78, 12, 100, 88, 30, 60, 100, 5, 92, 40][i] }));
  return (
    <AppShell>
      <PageHeader kicker="Personal" title="Watch History" subtitle="Everything you've watched, recently." />
      <div className="mx-auto max-w-5xl px-4 md:px-6 space-y-3">
        {items.map((it) => (
          <Link key={it.id} to="/watch/$id" params={{ id: it.id }} className="glass hover-lift rounded-2xl p-3 flex gap-3 items-center">
            <img src={it.poster} alt="" className="w-20 h-28 object-cover rounded-lg" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{it.title}</div>
              <div className="text-xs text-muted-foreground">Watched {it.watched} • {it.runtime}</div>
              <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${it.progress}%` }} />
              </div>
              <div className="text-[11px] mt-1 text-muted-foreground">{it.progress === 100 ? "Completed" : `${it.progress}% watched`}</div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
