import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { MovieRow } from "@/components/movies/MovieRow";
import { useAllMovies, useMovieBySlug } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import {
  Bookmark, Download, Heart, Play, Share2, Star, PlayCircle,
  ThumbsUp, ThumbsDown, Flag, Trash2, Send,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useComments,
  useDeleteComment,
  useIsFavorite,
  useIsInWatchlist,
  useMovieLikes,
  useMyMovieLike,
  usePostComment,
  useQueueDownload,
  useReport,
  useSetMovieLike,
  useToggleFavorite,
  useToggleWatchlist,
} from "@/lib/user-data";

export const Route = createFileRoute("/movie/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Movie — D4TECH Movies` },
      { property: "og:url", content: `/movie/${params.id}` },
    ],
    links: [{ rel: "canonical", href: `/movie/${params.id}` }],
  }),
  component: Details,
});

function Details() {
  const { id } = Route.useParams();
  const m = useMovieBySlug(id);
  const all = useAllMovies();

  if (!m) {
    return (
      <AppShell>
        <div className="pt-40 text-center">
          <p className="text-muted-foreground">
            {all.length === 0 ? "Loading movie…" : "Movie not found."}
          </p>
          <Button asChild className="mt-4 rounded-full"><Link to="/">Back to Home</Link></Button>
        </div>
      </AppShell>
    );
  }

  const related = all.filter((x) => x.id !== m.id && (x.category === m.category || x.genres.some((g) => m.genres.includes(g)))).slice(0, 14);
  const recommended = all.filter((x) => x.id !== m.id).slice(0, 14);

  return (
    <AppShell>
      <MovieHero m={m} />
      <div className="space-y-12 mt-6">
        <MovieRow title="Similar Movies" movies={related} />
        <MovieRow title="Recommended For You" movies={recommended} />
      </div>
      <CommentsSection movieDbId={m.dbId} />
    </AppShell>
  );
}

function MovieHero({ m }: { m: import("@/lib/movies").Movie }) {
  const { user } = useAuth();
  const inWatch = useIsInWatchlist(m.dbId);
  const inFav = useIsFavorite(m.dbId);
  const toggleWatch = useToggleWatchlist();
  const toggleFav = useToggleFavorite();
  const queueDl = useQueueDownload();
  const likes = useMovieLikes(m.dbId);
  const myLike = useMyMovieLike(m.dbId);
  const setLike = useSetMovieLike();
  const report = useReport();
  const [showTrailer, setShowTrailer] = useState(false);

  const requireAuth = () => {
    if (!user) { toast.error("Sign in to continue"); return false; }
    return true;
  };
  const share = async () => {
    const url = `${window.location.origin}/movie/${m.id}`;
    try {
      if (navigator.share) await navigator.share({ title: m.title, text: m.description, url });
      else { await navigator.clipboard.writeText(url); toast("Link copied"); }
    } catch { /* cancelled */ }
  };

  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10">
        <img src={m.backdrop} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
      </div>
      <div className="mx-auto max-w-7xl px-4 md:px-6 pt-12 md:pt-36 pb-4 grid md:grid-cols-[280px_1fr] gap-6 items-end">
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
          <p className="mt-2 max-w-2xl text-muted-foreground">{m.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="lg" className="rounded-full glow-emerald"><Link to="/watch/$id" params={{ id: m.id }}><Play className="fill-current" />Watch Now</Link></Button>
            <Button size="lg" variant="secondary" className="rounded-full" onClick={() => { if (m.trailerUrl) setShowTrailer(true); else toast("No trailer available"); }}><PlayCircle />Trailer</Button>
            <Button size="lg" variant="ghost" className="rounded-full" disabled={!user} onClick={() => user && queueDl.mutate(m.dbId)}><Download />Download</Button>
            <Button size="lg" variant="ghost" className={`rounded-full ${inWatch.data ? "text-primary" : ""}`}
              onClick={() => requireAuth() && toggleWatch.mutate({ movieDbId: m.dbId, isIn: !!inWatch.data })}>
              <Bookmark className={inWatch.data ? "fill-current" : ""} />
            </Button>
            <Button size="lg" variant="ghost" className={`rounded-full ${inFav.data ? "text-red-500" : ""}`}
              onClick={() => requireAuth() && toggleFav.mutate({ movieDbId: m.dbId, isIn: !!inFav.data })}>
              <Heart className={inFav.data ? "fill-current" : ""} />
            </Button>
            <Button size="lg" variant="ghost" className="rounded-full" onClick={share}><Share2 /></Button>
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <Button
              size="sm" variant="ghost" className="rounded-full"
              onClick={() => requireAuth() && setLike.mutate({ movieDbId: m.dbId, value: myLike.data === 1 ? 0 : 1 })}
            >
              <ThumbsUp className={`size-4 ${myLike.data === 1 ? "fill-current text-primary" : ""}`} />
              <span className="ml-1">{likes.data?.likes ?? 0}</span>
            </Button>
            <Button
              size="sm" variant="ghost" className="rounded-full"
              onClick={() => requireAuth() && setLike.mutate({ movieDbId: m.dbId, value: myLike.data === -1 ? 0 : -1 })}
            >
              <ThumbsDown className={`size-4 ${myLike.data === -1 ? "fill-current text-destructive" : ""}`} />
              <span className="ml-1">{likes.data?.dislikes ?? 0}</span>
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full"
              onClick={() => {
                if (!requireAuth()) return;
                const reason = window.prompt("Why are you reporting this movie?");
                if (reason) report.mutate({ targetType: "movie", targetId: m.dbId, reason });
              }}>
              <Flag className="size-4" /> Report
            </Button>
          </div>

          <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Meta label="Director" value={m.director} />
            <Meta label="Country" value={m.country} />
            <Meta label="Language" value={m.language} />
            <Meta label="Year" value={String(m.year)} />
          </dl>
          {m.cast.length > 0 && (
            <div className="mt-2">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Cast</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {m.cast.map((c) => <span key={c} className="rounded-full glass px-3 py-1 text-xs">{c}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
      {showTrailer && m.trailerUrl && (
        <div className="fixed inset-0 z-[80] bg-black/90 grid place-items-center p-4" onClick={() => setShowTrailer(false)}>
          <div className="w-full max-w-4xl aspect-video">
            <iframe src={m.trailerUrl} className="w-full h-full rounded-2xl" allow="autoplay; encrypted-media" allowFullScreen />
          </div>
        </div>
      )}
    </section>
  );
}

function CommentsSection({ movieDbId }: { movieDbId: string }) {
  const { user, profile } = useAuth();
  const comments = useComments(movieDbId);
  const post = usePostComment(movieDbId);
  const del = useDeleteComment(movieDbId);
  const report = useReport();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const submit = () => {
    if (!user) { toast.error("Sign in to comment"); return; }
    if (!text.trim()) return;
    post.mutate({ content: text.trim(), parentId: replyTo }, {
      onSuccess: () => { setText(""); setReplyTo(null); },
    });
  };

  const roots = (comments.data ?? []).filter((c) => !c.parent_id);
  const repliesOf = (id: string) => (comments.data ?? []).filter((c) => c.parent_id === id);

  return (
    <section className="mx-auto max-w-4xl px-4 md:px-6 mt-16">
      <h2 className="text-2xl font-bold mb-4">Comments ({comments.data?.length ?? 0})</h2>
      <div className="glass rounded-2xl p-4 flex gap-3">
        <div className="size-10 rounded-full bg-primary/20 grid place-items-center text-sm font-bold text-primary">
          {(profile?.full_name ?? profile?.username ?? user?.email ?? "?")[0]?.toUpperCase()}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? (replyTo ? "Write a reply..." : "Share your thoughts...") : "Sign in to comment"}
          disabled={!user}
          className="flex-1 bg-transparent outline-none resize-none min-h-20"
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {replyTo && <Button variant="ghost" className="rounded-full" onClick={() => setReplyTo(null)}>Cancel reply</Button>}
        <Button className="rounded-full" onClick={submit} disabled={!user || !text.trim() || post.isPending}>
          <Send className="size-4" /> Post
        </Button>
      </div>
      <div className="mt-8 space-y-4">
        {comments.isLoading && <p className="text-sm text-muted-foreground">Loading comments…</p>}
        {roots.length === 0 && !comments.isLoading && <p className="text-sm text-muted-foreground">Be the first to comment.</p>}
        {roots.map((c) => (
          <div key={c.id}>
            <CommentItem
              c={c}
              onReply={() => { setReplyTo(c.id); }}
              onDelete={() => del.mutate(c.id)}
              onReport={() => {
                const r = window.prompt("Report reason?");
                if (r) report.mutate({ targetType: "comment", targetId: c.id, reason: r });
              }}
              canDelete={user?.id === c.user_id}
            />
            <div className="ml-12 mt-2 space-y-2">
              {repliesOf(c.id).map((r) => (
                <CommentItem key={r.id} c={r}
                  onReply={() => setReplyTo(c.id)}
                  onDelete={() => del.mutate(r.id)}
                  onReport={() => {
                    const reason = window.prompt("Report reason?");
                    if (reason) report.mutate({ targetType: "comment", targetId: r.id, reason });
                  }}
                  canDelete={user?.id === r.user_id}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CommentItem({
  c, onReply, onDelete, onReport, canDelete,
}: {
  c: import("@/lib/user-data").CommentRow;
  onReply: () => void;
  onDelete: () => void;
  onReport: () => void;
  canDelete: boolean;
}) {
  const name = c.profile?.full_name || c.profile?.username || "User";
  return (
    <div className="glass rounded-2xl p-4 flex gap-3">
      <div className="size-10 rounded-full bg-gold/20 grid place-items-center font-bold text-gold shrink-0">
        {c.profile?.avatar_url
          ? <img src={c.profile.avatar_url} alt="" className="size-full rounded-full object-cover" />
          : name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-sm">{name}</div>
          <span className="text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
        </div>
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">{c.content}</div>
        <div className="mt-2 flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 rounded-full text-xs" onClick={onReply}>Reply</Button>
          <Button size="sm" variant="ghost" className="h-7 rounded-full text-xs" onClick={onReport}><Flag className="size-3" /> Report</Button>
          {canDelete && (
            <Button size="sm" variant="ghost" className="h-7 rounded-full text-xs text-destructive" onClick={onDelete}>
              <Trash2 className="size-3" /> Delete
            </Button>
          )}
        </div>
      </div>
    </div>
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
