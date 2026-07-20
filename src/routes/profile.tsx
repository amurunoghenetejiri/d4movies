import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { movies } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import { Bookmark, Clock, Download, Heart, Settings } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — D4TECH Movies" }] }),
  component: Profile,
});

function Profile() {
  const stats = [
    { icon: Heart, label: "Favorites", value: 42, to: "/favorites" as const },
    { icon: Bookmark, label: "Watchlist", value: 18, to: "/watchlist" as const },
    { icon: Download, label: "Downloads", value: 6, to: "/downloads" as const },
    { icon: Clock, label: "History", value: 127, to: "/history" as const },
  ];
  return (
    <AppShell>
      <PageHeader kicker="Account" title="Your profile" />
      <div className="mx-auto max-w-5xl px-4 md:px-6 space-y-8">
        <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="size-24 rounded-full bg-gradient-to-br from-primary to-gold grid place-items-center text-3xl font-bold text-primary-foreground">D4</div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold">D4TECH User</h2>
            <p className="text-sm text-muted-foreground">member@d4tech.movies</p>
            <p className="mt-2 text-sm max-w-lg">Cinema lover. Anime enthusiast. Always chasing the next great story. 🎬</p>
          </div>
          <Button asChild variant="outline" className="rounded-full"><Link to="/settings"><Settings /> Settings</Link></Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <Link key={s.label} to={s.to} className="glass rounded-2xl p-5 hover-lift text-center">
              <s.icon className="mx-auto size-6 text-primary" />
              <div className="text-2xl font-bold mt-2">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </Link>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold">Continue Watching</h3>
            <Link to="/history" className="text-sm text-primary">See all</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {movies.slice(0, 4).map((m) => (
              <Link key={m.id} to="/watch/$id" params={{ id: m.id }} className="glass rounded-2xl overflow-hidden hover-lift">
                <img src={m.backdrop} alt="" className="aspect-video w-full object-cover" />
                <div className="p-3">
                  <div className="font-semibold text-sm truncate">{m.title}</div>
                  <div className="mt-1 h-1 rounded-full bg-white/10"><div className="h-full bg-primary rounded-full" style={{ width: "45%" }} /></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
