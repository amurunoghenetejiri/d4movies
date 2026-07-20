import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { movies } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import { Pause, Play, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/downloads")({
  head: () => ({ meta: [{ title: "Downloads — D4TECH Movies" }] }),
  component: Downloads,
});

function Downloads() {
  const [items, setItems] = useState(() =>
    movies.slice(0, 6).map((m, i) => ({ ...m, progress: [22, 65, 88, 100, 47, 12][i], paused: i === 2 })),
  );
  const del = (id: string) => { setItems((v) => v.filter((x) => x.id !== id)); toast("Removed"); };
  const tog = (id: string) => setItems((v) => v.map((x) => (x.id === id ? { ...x, paused: !x.paused } : x)));
  return (
    <AppShell>
      <PageHeader kicker="Library" title="Downloads" subtitle="Watch offline anytime." />
      <div className="mx-auto max-w-4xl px-4 md:px-6 space-y-3">
        {items.length === 0 && <div className="text-center text-muted-foreground py-16">No downloads yet.</div>}
        {items.map((it) => (
          <div key={it.id} className="glass rounded-2xl p-3 flex gap-3 items-center">
            <img src={it.poster} alt="" className="w-16 h-24 object-cover rounded-lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-semibold truncate">{it.title}</div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold text-gold-foreground font-bold">{it.quality}</span>
              </div>
              <div className="text-xs text-muted-foreground">{it.runtime} • {it.year}</div>
              <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full ${it.progress === 100 ? "bg-gold" : "bg-primary"}`} style={{ width: `${it.progress}%` }} />
              </div>
              <div className="text-[11px] mt-1 text-muted-foreground">
                {it.progress === 100 ? "Ready to watch" : it.paused ? `Paused at ${it.progress}%` : `Downloading ${it.progress}%`}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {it.progress < 100 && (
                <Button size="icon" variant="ghost" onClick={() => tog(it.id)} className="rounded-full">
                  {it.paused ? <Play /> : <Pause />}
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => del(it.id)} className="rounded-full text-destructive"><Trash2 /></Button>
              <Button size="icon" variant="ghost" onClick={() => del(it.id)} className="rounded-full"><X /></Button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
