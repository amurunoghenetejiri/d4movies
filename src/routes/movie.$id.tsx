import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { MovieRow } from "@/components/movies/MovieRow";
import { findMovie, movies } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import { Bookmark, Download, Heart, Play, Share2, Star, PlayCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/movie/$id")({
  head: ({ params }) => {
    const m = findMovie(params.id);
    return {
      meta: [
        { title: `${m?.title ?? "Movie"} — D4TECH Movies` },
        { name: "description", content: m?.description ?? "Watch on D4TECH Movies." },
        { property: "og:title", content: `${m?.title ?? "Movie"} — D4TECH Movies` },
        { property: "og:description", content: m?.description ?? "" },
        { property: "og:image", content: m?.backdrop ?? "" },
        { property: "og:url", content: `/movie/${params.id}` },
      ],
      links: [{ rel: "canonical", href: `/movie/${params.id}` }],
    };
  },
  loader: ({ params }) => {
    const m = findMovie(params.id);
    if (!m) throw notFound();
    return m;
  },
  component: Details,
  notFoundComponent: () => (
    <AppShell><div className="pt-40 text-center text-muted-foreground">Movie not found.</div></AppShell>
  ),
});

function Details() {
  const m = Route.useLoaderData();
  const related = movies.filter((x) => x.id !== m.id && (x.category === m.category || x.genres.some((g) => m.genres.includes(g)))).slice(0, 14);
  const recommended = movies.filter((x) => x.id !== m.id).slice(20, 34);

  return (
    <AppShell>
      {/* Cinematic hero */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <img src={m.backdrop} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
        </div>
        <div className="mx-auto max-w-7xl px-4 md:px-6 pt-28 md:pt-36 pb-10 grid md:grid-cols-[280px_1fr] gap-8 items-end">
          <img src={m.poster} alt={m.title} className="w-48 md:w-full rounded-2xl border border-border shadow-2xl" />
          <div className="animate-fade-up">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">{m.category}</span>
            <h1 className="mt-2 text-4xl md:text-6xl font-bold"><span className="text-gradient-emerald">{m.title}</span></h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1"><Star className="size-4 fill-gold text-gold" />{m.rating} IMDb</span>
              <span className="text-muted-foreground">{m.year}</span>
              <span className="text-muted-foreground">{m.runtime}</span>
              <span className="rounded-full glass px-2 py-0.5 text-[11px] font-semibold">{m.quality}</span>
              {m.genres.map((g) => <span key={g} className="rounded-full glass px-2 py-0.5 text-xs">{g}</span>)}
            </div>
            <p className="mt-4 max-w-2xl text-muted-foreground">{m.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild size="lg" className="rounded-full glow-emerald"><Link to="/watch/$id" params={{ id: m.id }}><Play className="fill-current" />Watch Now</Link></Button>
              <Button size="lg" variant="secondary" className="rounded-full" onClick={() => toast.success("Trailer coming soon")}><PlayCircle />Trailer</Button>
              <Button size="lg" variant="ghost" className="rounded-full" onClick={() => toast.success("Download queued", { description: m.title })}><Download />Download</Button>
              <Button size="lg" variant="ghost" className="rounded-full" onClick={() => toast.success("Added to Watchlist")}><Bookmark /></Button>
              <Button size="lg" variant="ghost" className="rounded-full" onClick={() => toast.success("Added to Favorites")}><Heart /></Button>
              <Button size="lg" variant="ghost" className="rounded-full" onClick={() => toast("Share link copied")}><Share2 /></Button>
            </div>
            <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <Meta label="Director" value={m.director} />
              <Meta label="Country" value={m.country} />
              <Meta label="Language" value={m.language} />
              <Meta label="Year" value={String(m.year)} />
            </dl>
            <div className="mt-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Cast</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {m.cast.map((c) => <span key={c} className="rounded-full glass px-3 py-1 text-xs">{c}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-12 mt-6">
        <MovieRow title="Similar Movies" movies={related} />
        <MovieRow title="Recommended For You" movies={recommended} />
      </div>

      {/* Comments UI-only */}
      <section className="mx-auto max-w-4xl px-4 md:px-6 mt-16">
        <h2 className="text-2xl font-bold mb-4">Comments</h2>
        <div className="glass rounded-2xl p-4 flex gap-3">
          <div className="size-10 rounded-full bg-primary/20" />
          <textarea placeholder="Share your thoughts..." className="flex-1 bg-transparent outline-none resize-none min-h-20" />
        </div>
        <div className="mt-3 flex justify-end">
          <Button className="rounded-full" onClick={() => toast.success("Comment posted")}>Post</Button>
        </div>
        <div className="mt-8 space-y-4">
          {[
            { name: "Ada O.", text: "Absolutely stunning cinematography. Watched twice already!" },
            { name: "Kenji T.", text: "The soundtrack alone is worth it. 10/10 recommend." },
            { name: "Priya S.", text: "Wow, D4TECH has the cleanest streaming quality." },
          ].map((c, i) => (
            <div key={i} className="glass rounded-2xl p-4 flex gap-3">
              <div className="size-10 rounded-full bg-gold/20 grid place-items-center font-bold text-gold">{c.name[0]}</div>
              <div>
                <div className="font-semibold text-sm">{c.name}</div>
                <div className="text-sm text-muted-foreground">{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
