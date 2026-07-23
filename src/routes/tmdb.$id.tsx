import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Play, Star } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { tmdbBackdrop, tmdbPoster, tmdbYouTubeKey, useTmdbDetail, TMDB_ENABLED } from "@/lib/tmdb";
import { useState } from "react";

export const Route = createFileRoute("/tmdb/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Details — D4MOVIES` },
      { property: "og:url", content: `/tmdb/${params.id}` },
    ],
  }),
  component: TmdbDetailPage,
});

function TmdbDetailPage() {
  const { id } = Route.useParams();
  const q = useTmdbDetail(id);
  const [playing, setPlaying] = useState(false);

  if (!TMDB_ENABLED) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 pt-40 text-center">
          <h1 className="text-2xl font-bold text-gradient-emerald">TMDb not configured</h1>
          <p className="mt-2 text-muted-foreground">
            Add a <code className="text-primary">VITE_TMDB_API_KEY</code> secret to unlock the full library.
          </p>
          <Link to="/" className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Back home</Link>
        </div>
      </AppShell>
    );
  }
  if (q.isLoading) return <AppShell><div className="pt-40 text-center text-muted-foreground">Loading…</div></AppShell>;
  if (q.error || !q.data) return <AppShell><div className="pt-40 text-center text-muted-foreground">Not found.</div></AppShell>;

  const d = q.data;
  const yt = tmdbYouTubeKey(d);
  const cast = d.credits?.cast?.slice(0, 12) ?? [];
  const director = d.credits?.crew?.find((c) => c.job === "Director")?.name;

  return (
    <AppShell>
      <div className="relative">
        <div className="absolute inset-0 h-[70vh] overflow-hidden">
          <img src={tmdbBackdrop(d.backdrop_path)} alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
        </div>

        <div className="relative pt-24 md:pt-32 px-4 md:px-8 max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="size-4" /> Home
          </Link>

          <div className="grid md:grid-cols-[240px_1fr] gap-6 md:gap-10">
            <img src={tmdbPoster(d.poster_path, "w500")} alt={d.original_title} className="w-40 md:w-full rounded-2xl border border-border/60 shadow-2xl" />
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight"><span className="text-gradient-emerald">{d.original_title}</span></h1>
              {d.tagline && <p className="mt-2 italic text-muted-foreground">{d.tagline}</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="glass rounded-full px-3 py-1 flex items-center gap-1"><Star className="size-3 fill-gold text-gold" /> {d.vote_average.toFixed(1)}</span>
                {d.release_date && <span className="glass rounded-full px-3 py-1">{new Date(d.release_date).getFullYear()}</span>}
                {d.runtime > 0 && <span className="glass rounded-full px-3 py-1">{Math.floor(d.runtime / 60)}h {d.runtime % 60}m</span>}
                {d.genres.map((g) => <span key={g.id} className="glass rounded-full px-3 py-1">{g.name}</span>)}
              </div>
              <p className="mt-4 text-sm md:text-base text-foreground/85 max-w-3xl">{d.overview}</p>
              <div className="mt-4 text-sm text-muted-foreground space-y-1">
                {director && <div><span className="text-foreground/70">Director:</span> {director}</div>}
                {d.production_countries?.length > 0 && <div><span className="text-foreground/70">Country:</span> {d.production_countries.map((c) => c.name).join(", ")}</div>}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {yt ? (
                  <Button size="lg" className="rounded-full glow-emerald" onClick={() => setPlaying(true)}>
                    <Play className="size-4 fill-current mr-1" /> Play Trailer
                  </Button>
                ) : (
                  <Button size="lg" variant="secondary" disabled className="rounded-full">No trailer available</Button>
                )}
                <div className="text-xs text-muted-foreground self-center ml-2">
                  Full movie not uploaded yet — enjoy the trailer.
                </div>
              </div>
            </div>
          </div>

          {playing && yt && (
            <div className="fixed inset-0 z-[80] bg-black/90 grid place-items-center p-4" onClick={() => setPlaying(false)}>
              <div className="relative w-full max-w-5xl aspect-video" onClick={(e) => e.stopPropagation()}>
                <iframe
                  className="h-full w-full rounded-2xl"
                  src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`}
                  title="Trailer"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
                <button onClick={() => setPlaying(false)} className="absolute -top-10 right-0 text-sm text-muted-foreground hover:text-foreground">Close ✕</button>
              </div>
            </div>
          )}

          {cast.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-bold mb-3">Cast</h2>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {cast.map((c, i) => (
                  <div key={i} className="w-28 shrink-0 text-center">
                    <img
                      src={c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : "https://picsum.photos/185/278"}
                      alt={c.name}
                      className="w-28 h-36 object-cover rounded-xl border border-border/50"
                    />
                    <div className="mt-1 text-xs font-semibold truncate">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{c.character}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
