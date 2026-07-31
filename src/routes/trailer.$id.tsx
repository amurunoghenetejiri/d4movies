import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="min-h-screen bg-background grid place-items-center text-muted-foreground">
        TMDb not configured.
      </div>
    );
  }
  if (detail.isLoading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center text-muted-foreground">
        Loading trailer…
      </div>
    );
  }
  if (!detail.data) {
    return (
      <div className="min-h-screen bg-background grid place-items-center text-muted-foreground">
        Not found.
      </div>
    );
  }

  const d = detail.data;
  const yt = tmdbYouTubeKey(d);
  const director = d.credits?.crew?.find((c) => c.job === "Director")?.name;
  const cast = d.credits?.cast?.slice(0, 12) ?? [];
  const year = d.release_date ? new Date(d.release_date).getFullYear() : "";
  const title = d.original_title ?? d.title ?? "Trailer";

  return (
    <div className="min-h-screen bg-background">
      {/*
        No AppShell / Navbar / Logo / profile.
        Thin back bar sits ABOVE the player so it never covers YouTube controls.
      */}
      <div className="sticky top-0 z-40 bg-black">
        {/* Back row — outside the video */}
        <div className="flex h-11 items-center gap-2 px-3 border-b border-white/5">
          <button
            type="button"
            onClick={() => nav({ to: "/tmdb/$id", params: { id } })}
            className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm text-white/90 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
            <span>Back</span>
          </button>
          <span className="ml-1 truncate text-xs text-white/50">{title}</span>
        </div>

        {/*
          Compact Netflix-style height:
          \~42vh phone / \~50vh tablet — not full screen, not tiny.
          Full screen only when user taps YouTube’s own fullscreen button.
        */}
        <div className="relative w-full bg-black h-[42vh] sm:h-[48vh] md:h-[52vh] max-h-[560px] min-h-[220px]">
          {yt ? (
            <iframe
              title={`${title} trailer`}
              src={`https://www.youtube.com/embed/${yt}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm px-4 text-center">
              No trailer available for this title.
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content under the player — no navbar */}
      <div className="pb-16">
        <div className="relative">
          <img
            src={tmdbBackdrop(d.backdrop_path, "w1280")}
            alt=""
            className="h-32 md:h-48 w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-transparent" />
        </div>

        <div className="mx-auto max-w-6xl px-4 md:px-6 -mt-12 relative flex flex-col md:flex-row gap-5">
          <img
            src={tmdbPoster(d.poster_path, "w500")}
            alt=""
            className="w-24 md:w-36 rounded-xl border border-border/50 shadow-xl shrink-0 self-start"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-3xl font-bold text-gradient-emerald">{title}</h1>
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
          <section className="mx-auto max-w-6xl px-4 md:px-6 mt-6">
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
          <section className="mx-auto max-w-6xl px-4 md:px-6 mt-8 mb-8">
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
    </div>
  );
}
