import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { PLACEHOLDER_BACKDROP, PLACEHOLDER_POSTER } from "@/lib/placeholders";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UploadCloud, X, RefreshCw, Loader2, CheckCircle2, Search as SearchIcon, Sparkles, Pause, Play } from "lucide-react";
import { useTmdbSearch, useTmdbDetail, tmdbPoster, tmdbBackdrop, tmdbYouTubeKey, type TmdbItem } from "@/lib/tmdb";
import { uploadManager, useUploadManager, formatBytes, formatEta } from "@/lib/upload-manager";
import type { BucketName } from "@/lib/uploads";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload — D4MOVIES" },
      { name: "description", content: "Smart upload with automatic metadata. Publish movies, TV series and anime instantly." },
      { property: "og:title", content: "Upload to D4MOVIES" },
      { property: "og:description", content: "Smart, background uploads with automatic metadata." },
    ],
  }),
  component: UploadPage,
});

const CATEGORIES = ["Hollywood", "Nollywood", "Bollywood", "Korean Drama", "Chinese Drama", "Anime", "TV Series"] as const;
const QUALITIES = ["HD", "FHD", "4K"] as const;

type SlotKey = "movie" | "trailer" | "poster" | "backdrop" | "subtitle" | "thumbnail";
type Slot = { jobId?: string; url?: string; path?: string };

function UploadPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useUploadManager(); // subscribe to job updates

  const [title, setTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState("Drama, Action");
  const [country, setCountry] = useState("United States");
  const [language, setLanguage] = useState("English");
  const [cast, setCast] = useState("");
  const [director, setDirector] = useState("");
  const [producer, setProducer] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [duration, setDuration] = useState(120);
  const [ageRating, setAgeRating] = useState("PG-13");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Hollywood");
  const [quality, setQuality] = useState<(typeof QUALITIES)[number]>("HD");
  const [externalRef, setExternalRef] = useState<{ id: number; media_type: "movie" | "tv" } | null>(null);
  const [posterOverride, setPosterOverride] = useState<string | null>(null);
  const [backdropOverride, setBackdropOverride] = useState<string | null>(null);
  const [trailerYt, setTrailerYt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [slots, setSlots] = useState<Record<SlotKey, Slot>>({
    movie: {}, trailer: {}, poster: {}, backdrop: {}, subtitle: {}, thumbnail: {},
  });

  const setSlot = (k: SlotKey, patch: Slot) => setSlots((s) => ({ ...s, [k]: { ...s[k], ...patch } }));

  const slug = useMemo(
    () => title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) + "-" + Math.random().toString(36).slice(2, 6),
    [title],
  );

  // --- Smart search + autofill ---
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 220);
    return () => clearTimeout(t);
  }, [query]);
  const search = useTmdbSearch(debounced);
  const detail = useTmdbDetail(externalRef?.media_type === "movie" ? externalRef.id : undefined);

  useEffect(() => {
    if (!detail.data) return;
    const d = detail.data;
    setDescription(d.overview ?? "");
    setOriginalTitle(d.original_title ?? "");
    setLanguage((d.original_language || "en").toUpperCase());
    setCountry(d.production_countries?.[0]?.name ?? country);
    setYear(Number((d.release_date ?? "").slice(0, 4)) || year);
    setDuration(d.runtime || duration);
    setGenres((d.genres ?? []).map((g) => g.name).join(", "));
    setCast((d.credits?.cast ?? []).slice(0, 10).map((c) => c.name).join(", "));
    const dir = (d.credits?.crew ?? []).find((c) => c.job === "Director");
    if (dir) setDirector(dir.name);
    const prod = (d.credits?.crew ?? []).find((c) => c.job === "Producer");
    if (prod) setProducer(prod.name);
    setPosterOverride(tmdbPoster(d.poster_path, "w500"));
    setBackdropOverride(tmdbBackdrop(d.backdrop_path, "w1280"));
    const yt = tmdbYouTubeKey(d);
    setTrailerYt(yt ? `https://www.youtube.com/watch?v=${yt}` : null);
  }, [detail.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickResult = (item: TmdbItem) => {
    const t = item.title ?? (item as unknown as { name?: string }).name ?? "";
    setTitle(t);
    setQuery(t);
    setSearchOpen(false);
    if (item.media_type === "tv") setCategory("TV Series");
    setExternalRef({ id: item.id, media_type: (item.media_type ?? "movie") as "movie" | "tv" });
  };

  if (!loading && !user) {
    return (
      <AppShell>
        <PageHeader kicker="Publish" title="Upload to D4MOVIES" />
        <div className="mx-auto max-w-md px-4 pb-16 text-center space-y-4">
          <p className="text-muted-foreground">You need an account to upload. Sign in or create one — it's free.</p>
          <div className="flex justify-center gap-2">
            <Button asChild className="rounded-full glow-emerald"><Link to="/login">Sign in</Link></Button>
            <Button asChild variant="outline" className="rounded-full"><Link to="/register">Register</Link></Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const startUpload = async (key: SlotKey, bucket: BucketName, kind: string, file: File) => {
    if (!user) return;
    const jobId = await uploadManager.enqueue({
      file,
      bucket,
      kind,
      userId: user.id,
      label: key,
    });
    setSlot(key, { jobId, url: undefined, path: undefined });
  };

  const jobFor = (key: SlotKey) => {
    const id = slots[key].jobId;
    return id ? uploadManager.get(id) : undefined;
  };

  const cancelSlot = (key: SlotKey) => {
    const id = slots[key].jobId;
    if (id) uploadManager.cancel(id);
    setSlot(key, { jobId: undefined });
  };

  const submit = async () => {
    if (!user) return;
    if (!title.trim()) return toast.error("Title is required");

    const anyUploading = (Object.keys(slots) as SlotKey[]).some((k) => {
      const j = jobFor(k);
      return j && (j.status === "uploading" || j.status === "queued" || j.status === "paused");
    });
    if (anyUploading) return toast.error("Wait for uploads to finish or cancel them.");

    // Resolve URLs from finished jobs
    const finished: Record<SlotKey, { url?: string; path?: string }> = {
      movie: {}, trailer: {}, poster: {}, backdrop: {}, subtitle: {}, thumbnail: {},
    };
    (Object.keys(slots) as SlotKey[]).forEach((k) => {
      const j = jobFor(k);
      if (j?.status === "done") finished[k] = { url: j.url, path: j.path };
    });

    const posterUrl = finished.poster.url ?? posterOverride ?? PLACEHOLDER_POSTER;
    const backdropUrl = finished.backdrop.url ?? backdropOverride ?? PLACEHOLDER_BACKDROP;
    const trailerUrl = finished.trailer.url ?? trailerYt ?? null;
    const movieUrl = finished.movie.url ?? null;

    if (!movieUrl && !trailerUrl) {
      return toast.error("Upload a movie file, or select a title so we can attach a trailer.");
    }

    setSubmitting(true);
    const { data: inserted, error } = await supabase
      .from("movies")
      .insert({
        title: title.trim(),
        slug,
        description,
        poster: posterUrl,
        backdrop: backdropUrl,
        trailer_url: trailerUrl,
        movie_url: movieUrl,
        subtitle_url: finished.subtitle.url ?? null,
        thumbnail: finished.thumbnail.url ?? null,
        genres: genres.split(",").map((g) => g.trim()).filter(Boolean),
        actors: cast.split(",").map((c) => c.trim()).filter(Boolean),
        director: director || null,
        producer: producer || null,
        original_title: originalTitle || null,
        language,
        country,
        release_year: year,
        category,
        quality,
        runtime_minutes: duration,
        age_rating: ageRating,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        created_by: user.id,
      })
      .select("id, slug")
      .single();
    setSubmitting(false);

    if (error || !inserted) {
      toast.error(error?.message ?? "Failed to publish");
      return;
    }

    const doneIds = (Object.keys(slots) as SlotKey[])
      .map((k) => jobFor(k))
      .filter((j) => j?.status === "done")
      .map((j) => j!.id);
    if (doneIds.length) await uploadManager.attachToMovie(doneIds, inserted.id, user.id);

    toast.success("Published! Your title is live.");
    nav({ to: "/movie/$id", params: { id: inserted.slug } });
  };

  const results = (search.data ?? []).filter((r) => r.media_type === "movie" || r.media_type === "tv").slice(0, 8);

  return (
    <AppShell>
      <PageHeader
        kicker="Publish"
        title="Smart Upload"
        subtitle="Search for a title — we fill in the artwork, cast, and details. You just upload the video."
      />
      <div className="mx-auto max-w-5xl px-4 md:px-6 pb-16 space-y-6">
        {/* Smart search */}
        <div className="glass-strong rounded-3xl p-4 md:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Sparkles className="size-4 text-gold" />
            Search a title to auto-fill everything
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <SearchIcon className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search movies, TV series or anime…"
                className="bg-transparent flex-1 outline-none text-sm"
              />
              {search.isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
              {query && (
                <button onClick={() => { setQuery(""); setSearchOpen(false); }} className="p-1 rounded hover:bg-white/10">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            {searchOpen && debounced.length >= 2 && results.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-2 rounded-2xl glass-strong border border-white/10 shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto">
                {results.map((r) => {
                  const t = r.title ?? (r as unknown as { name?: string }).name ?? "Untitled";
                  const date = r.release_date ?? r.first_air_date ?? "";
                  return (
                    <button
                      key={`${r.media_type}-${r.id}`}
                      onClick={() => pickResult(r)}
                      className="w-full flex gap-3 items-center px-3 py-2 hover:bg-white/5 text-left"
                    >
                      <img src={tmdbPoster(r.poster_path, "w342")} alt="" className="w-10 h-14 object-cover rounded-md shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{t}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {r.media_type === "tv" ? "TV" : "Movie"} · {date.slice(0, 4) || "—"} · ★ {r.vote_average?.toFixed(1) ?? "—"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {externalRef && (
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              Metadata imported. Fields below were auto-filled — edit anything you need.
              <button
                onClick={() => { setExternalRef(null); setPosterOverride(null); setBackdropOverride(null); setTrailerYt(null); }}
                className="ml-auto underline hover:text-foreground"
              >
                Clear
              </button>
            </div>
          )}
          {(posterOverride || backdropOverride) && (
            <div className="mt-3 flex gap-3">
              {posterOverride && <img src={posterOverride} className="w-16 h-24 object-cover rounded-lg" alt="" />}
              {backdropOverride && <img src={backdropOverride} className="flex-1 h-24 object-cover rounded-lg" alt="" />}
            </div>
          )}
        </div>

        {/* Files */}
        <div className="grid md:grid-cols-2 gap-4">
          <FileDrop label="Movie file" accept="video/*" hint="MP4 / WebM / MOV — streams privately" slot={slots.movie} job={jobFor("movie")} onFile={(f) => startUpload("movie", "movies", "movie", f)} onCancel={() => cancelSlot("movie")} />
          <FileDrop label="Trailer" accept="video/*" hint={trailerYt ? "Auto-attached from search. Upload to override." : "Short preview clip"} slot={slots.trailer} job={jobFor("trailer")} onFile={(f) => startUpload("trailer", "trailers", "trailer", f)} onCancel={() => cancelSlot("trailer")} />
          <FileDrop label="Poster" accept="image/*" hint={posterOverride ? "Auto-attached. Upload to override." : "2:3 portrait"} slot={slots.poster} job={jobFor("poster")} onFile={(f) => startUpload("poster", "posters", "poster", f)} onCancel={() => cancelSlot("poster")} />
          <FileDrop label="Backdrop" accept="image/*" hint={backdropOverride ? "Auto-attached. Upload to override." : "16:9 landscape"} slot={slots.backdrop} job={jobFor("backdrop")} onFile={(f) => startUpload("backdrop", "backdrops", "backdrop", f)} onCancel={() => cancelSlot("backdrop")} />
          <FileDrop label="Subtitles" accept=".vtt,.srt" hint=".vtt or .srt" slot={slots.subtitle} job={jobFor("subtitle")} onFile={(f) => startUpload("subtitle", "subtitles", "subtitle", f)} onCancel={() => cancelSlot("subtitle")} />
          <FileDrop label="Thumbnail" accept="image/*" hint="Optional 1280×720" slot={slots.thumbnail} job={jobFor("thumbnail")} onFile={(f) => startUpload("thumbnail", "thumbnails", "thumbnail", f)} onCancel={() => cancelSlot("thumbnail")} />
        </div>

        {/* Metadata */}
        <div className="glass rounded-3xl p-5 md:p-6 grid md:grid-cols-2 gap-4">
          <Field label="Title *"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Movie title" /></Field>
          <Field label="Original title"><Input value={originalTitle} onChange={(e) => setOriginalTitle(e.target.value)} placeholder="Original language title" /></Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
              {CATEGORIES.map((c) => <option key={c} className="bg-background">{c}</option>)}
            </select>
          </Field>
          <Field label="Quality">
            <select value={quality} onChange={(e) => setQuality(e.target.value as typeof QUALITIES[number])} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
              {QUALITIES.map((q) => <option key={q} className="bg-background">{q}</option>)}
            </select>
          </Field>
          <Field label="Release year"><Input type="number" value={year} onChange={(e) => setYear(+e.target.value)} /></Field>
          <Field label="Duration (min)"><Input type="number" value={duration} onChange={(e) => setDuration(+e.target.value)} /></Field>
          <Field label="Genres (comma separated)"><Input value={genres} onChange={(e) => setGenres(e.target.value)} /></Field>
          <Field label="Tags (comma separated)"><Input value={tags} onChange={(e) => setTags(e.target.value)} /></Field>
          <Field label="Country"><Input value={country} onChange={(e) => setCountry(e.target.value)} /></Field>
          <Field label="Language"><Input value={language} onChange={(e) => setLanguage(e.target.value)} /></Field>
          <Field label="Director"><Input value={director} onChange={(e) => setDirector(e.target.value)} /></Field>
          <Field label="Producer"><Input value={producer} onChange={(e) => setProducer(e.target.value)} /></Field>
          <Field label="Age rating">
            <select value={ageRating} onChange={(e) => setAgeRating(e.target.value)} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
              {["G","PG","PG-13","R","NC-17","TV-MA"].map((r) => <option key={r} className="bg-background">{r}</option>)}
            </select>
          </Field>
          <Field label="Cast (comma separated)"><Input value={cast} onChange={(e) => setCast(e.target.value)} /></Field>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Short synopsis…" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" onClick={() => nav({ to: "/" })} className="rounded-full">Cancel</Button>
          <Button onClick={submit} disabled={submitting} className="rounded-full glow-emerald">
            {submitting ? <><Loader2 className="animate-spin" /> Publishing…</> : "Publish now"}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Uploads continue in the background — feel free to browse other pages.
        </p>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function FileDrop({
  label, accept, hint, slot, job, onFile, onCancel,
}: {
  label: string; accept: string; hint: string;
  slot: Slot;
  job: ReturnType<typeof uploadManager.get>;
  onFile: (f: File) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const status = job?.status;

  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm">{label}</div>
          <div className="text-xs text-muted-foreground">{hint}</div>
        </div>
        {status === "done" && <CheckCircle2 className="size-5 text-primary" />}
      </div>

      {!job && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-dashed border-white/15 py-6 hover:bg-white/5 grid place-items-center gap-1 text-sm text-muted-foreground"
        >
          <UploadCloud className="size-5" />
          Click to select file
        </button>
      )}

      {job && (status === "uploading" || status === "queued" || status === "paused") && (
        <div className="space-y-2">
          <div className="text-xs truncate">{job.name}</div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-gold transition-all" style={{ width: `${job.progress}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {status === "uploading" && `${job.progress}% · ${formatBytes(job.speed)}/s · ${formatEta(job.eta)}`}
              {status === "queued" && "Queued…"}
              {status === "paused" && `Paused at ${job.progress}%`}
            </span>
            <div className="flex items-center gap-1">
              {status === "uploading" && (
                <button className="p-1 hover:bg-white/10 rounded" onClick={() => uploadManager.pause(job.id)} aria-label="Pause">
                  <Pause className="size-3.5" />
                </button>
              )}
              {status === "paused" && (
                <button className="p-1 hover:bg-white/10 rounded" onClick={() => uploadManager.resume(job.id)} aria-label="Resume">
                  <Play className="size-3.5" />
                </button>
              )}
              <button className="text-destructive p-1 hover:bg-white/10 rounded" onClick={onCancel} aria-label="Cancel">
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {job && status === "done" && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{job.name} · {formatBytes(job.size)}</span>
          <button onClick={onCancel} className="inline-flex items-center gap-1 hover:text-foreground">
            <X className="size-3" /> Replace
          </button>
        </div>
      )}

      {job && status === "error" && (
        <div className="space-y-2">
          <div className="text-xs text-destructive">{job.error}</div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => uploadManager.retry(job.id)}>
              <RefreshCw className="size-3" /> Retry
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
