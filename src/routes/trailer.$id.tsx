import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import {
  tmdbBackdrop,
  tmdbPoster,
  tmdbYouTubeKey,
  useTmdbDetail,
  useTmdbRecommendations,
  TMDB_ENABLED,
} from "@/lib/tmdb";
import { PLACEHOLDER_PORTRAIT } from "@/lib/placeholders";

export const Route = createFileRoute("/trailer/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Trailer — D4MOVIES` },
      { name: "robots", content: "noindex" },
      { property: "og:url", content: `/trailer/${params.id}` },
    ],
  }),
  component: TrailerPage,
});

function TrailerPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const detail = useTmdbDetail(id);
  const recs = useTmdbRecommendations(id);

  if (!TMDB_ENABLED) {
    return (
      <AppShell>
        <div className="pt-40 text-center text-muted-foreground">TMDb not configured.</div>
      </AppShell>
    );
  }
  if (detail.isLoading) {
    return (
      <AppShell>
        <div className="pt-40 text-center text-muted-foreground">Loading trailer…</div>
      </AppShell>
    );
  }
  if (!detail.data) {
    return (
      <AppShell>
        <div className="pt-40 text-center text-muted-foreground">Not found.</div>
      </AppShell>
    );
  }

  const d = detail.data;
  const yt = tmdbYouTubeKey(d);
  const director = d.credits?.crew?.find((c) => c.job === "Director")?.name;
  const cast = d.credits?.cast?.slice(0, 12) ?? [];
  const year = d.release_date ? new Date(d.release_date).getFullYear() : "";

  return (
    <div className="min-h-screen bg-background">
      {/* Player: YouTube only — fits phone width, no custom controls */}
      <div className="sticky top-0 z-40 bg-black">
        <div className="relative w-full max-w-5xl mx-auto bg-black">
          {/* Back button only */}
          <div className="absolute top-0 left-0 z-20 p-3 pointer-events-none">
            <button
              type="button"
              onClick={() => nav({ to: "/tmdb/$id", params: { id } })}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm px-3 py-2 text-sm text-white hover:bg-black/90 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="size-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>

          {yt ? (
            <div className="relative w-full aspect-video">
              <iframe
                title={`${d.original_title ?? d.title ?? "Trailer"} trailer`}
                src={`https://www.youtube.com/embed/${yt}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : (
            <div className="relative w-full aspect-video grid place-items-center text-muted-foreground text-sm px-4 text-center">
              No trailer available for this title.
            </div>
          )}
        </div>
      </div>

      {/* Info below player */}
      <AppShell>
        <div className="pb-8">
          <div className="relative">
            <img
              src={tmdbBackdrop(d.backdrop_path, "w1280")}
              alt=""
              className="h-40 md:h-56 w-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>

          <div className="mx-auto max-w-6xl px-4 md:px-6 -mt-16 relative flex flex-col md:flex-row gap-5">
            <img
              src={tmdbPoster(d.poster_path, "w500")}
              alt=""
              className="w-28 md:w-40 rounded-xl border border-border/50 shadow-xl shrink-0 self-start"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gradient-emerald">
                {d.original_title ?? d.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {year && <span className="glass rounded-full px-2.5 py-1">{year}</span>}
                {d.runtime ? (
                  <span className="glass rounded-full px-2.5 py-1">{d.runtime} min</span>
                ) : null}
                {d.vote_average ? (
                  <span className="glass rounded-full px-2.5 py-1 inline-flex items-center gap-1">
                    <Star className="size-3 fill-gold text-gold" />
                    {d.vote_average.toFixed(1)}
                  </span>
                ) : null}
                {(d.genres ?? []).slice(0, 4).map((g) => (
                  <span key={g.id} className="glass rounded-full px-2.5 py-1">
                    {g.name}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm text-foreground/85 max-w-3xl">{d.overview}</p>
              <div className="mt-3 text-sm text-muted-foreground space-y-1">
                {director && (
                  <div>
                    <span className="text-foreground/70">Director:</span> {director}
                  </div>
                )}
                {d.production_countries && d.production_countries.length > 0 && (
                  <div>
                    <span className="text-foreground/70">Country:</span>{" "}
                    {d.production_countries.map((c) => c.name).join(", ")}
                  </div>
                )}
              </div>
              <div className="mt-5">
                <Button asChild variant="secondary" className="rounded-full">
                  <Link to="/tmdb/$id" params={{ id }}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {cast.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 md:px-6 mt-4">
              <h2 className="text-lg font-bold mb-3">Cast</h2>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {cast.map((c, i) => (
                  <div key={i} className="w-24 md:w-28 shrink-0 text-center">
                    <img
                      src={
                        c.profile_path
                          ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
                          : PLACEHOLDER_PORTRAIT
                      }
                      alt={c.name}
                      className="w-24 md:w-28 h-32 md:h-36 object-cover rounded-xl border border-border/50"
                    />
                    <div className="mt-1 text-xs font-semibold truncate">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{c.character}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mx-auto max-w-6xl px-4 md:px-6 mt-8">
            <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">
              Comments & reviews open once this title is uploaded to D4MOVIES.
            </div>
          </section>

          {(recs.data?.length ?? 0) > 0 && (
            <section className="mx-auto max-w-6xl px-4 md:px-6 mt-8 mb-16">
              <h2 className="text-lg font-bold mb-3">Recommended</h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {recs.data!.slice(0, 12).map((r) => (
                  <Link
                    key={r.id}
                    to="/tmdb/$id"
                    params={{ id: String(r.id) }}
                    className="group"
                  >
                    <div className="aspect-[2/3] overflow-hidden rounded-xl border border-border/40">
                      <img
                        src={tmdbPoster(r.poster_path, "w342")}
                        alt={r.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="mt-1 text-xs font-medium truncate">{r.title}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </AppShell>
    </div>
  );
      }
