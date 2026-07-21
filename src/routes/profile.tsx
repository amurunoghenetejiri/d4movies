import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Bookmark, Clock, Download, Heart, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites, useHistory, useDownloads, useWatchlist } from "@/lib/user-data";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — D4TECH Movies" }] }),
  component: Profile,
});

function Profile() {
  const { user, profile, loading } = useAuth();
  const favorites = useFavorites();
  const watchlist = useWatchlist();
  const downloads = useDownloads();
  const history = useHistory();

  if (!loading && !user) {
    return (
      <AppShell>
        <PageHeader kicker="Account" title="Your profile" />
        <div className="mx-auto max-w-md px-4 py-8 text-center space-y-4">
          <p className="text-muted-foreground">Create an account or sign in to see your profile.</p>
          <div className="flex justify-center gap-2">
            <Button asChild className="rounded-full glow-emerald"><Link to="/login">Sign in</Link></Button>
            <Button asChild variant="outline" className="rounded-full"><Link to="/register">Register</Link></Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const initials = (profile?.full_name ?? profile?.username ?? user?.email ?? "D4")[0]?.toUpperCase();
  const stats = [
    { icon: Heart, label: "Favorites", value: favorites.data?.length ?? 0, to: "/favorites" as const },
    { icon: Bookmark, label: "Watchlist", value: watchlist.data?.length ?? 0, to: "/watchlist" as const },
    { icon: Download, label: "Downloads", value: downloads.data?.length ?? 0, to: "/downloads" as const },
    { icon: Clock, label: "History", value: history.data?.length ?? 0, to: "/history" as const },
  ];
  const cont = (history.data ?? []).filter((h) => h.progress < 100).slice(0, 4);

  return (
    <AppShell>
      <PageHeader kicker="Account" title="Your profile" />
      <div className="mx-auto max-w-5xl px-4 md:px-6 space-y-8">
        <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="size-24 rounded-full object-cover" />
          ) : (
            <div className="size-24 rounded-full bg-gradient-to-br from-primary to-gold grid place-items-center text-3xl font-bold text-primary-foreground">
              {initials}
            </div>
          )}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold">{profile?.full_name ?? profile?.username ?? "D4TECH User"}</h2>
            <p className="text-sm text-muted-foreground">{profile?.email ?? user?.email}</p>
            <p className="mt-2 text-sm max-w-lg">
              Plan: <span className="text-primary capitalize">{profile?.subscription_status ?? "free"}</span>
            </p>
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

        {cont.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold">Continue Watching</h3>
              <Link to="/history" className="text-sm text-primary">See all</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cont.map(({ movie, progress }) => (
                <Link key={movie.id} to="/watch/$id" params={{ id: movie.id }} className="glass rounded-2xl overflow-hidden hover-lift">
                  <img src={movie.backdrop} alt="" className="aspect-video w-full object-cover" />
                  <div className="p-3">
                    <div className="font-semibold text-sm truncate">{movie.title}</div>
                    <div className="mt-1 h-1 rounded-full bg-white/10"><div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} /></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
