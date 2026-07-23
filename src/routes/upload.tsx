import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { uploadFileWithProgress, type BucketName } from "@/lib/uploads";
import { toast } from "sonner";
import { UploadCloud, X, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload — D4MOVIES" },
      { name: "description", content: "Upload movies, TV series, anime, and trailers to D4MOVIES. Publish instantly, no approval required." },
      { property: "og:title", content: "Upload to D4MOVIES" },
      { property: "og:description", content: "Share films with the D4MOVIES community. Instant publishing." },
    ],
  }),
  component: UploadPage,
});

type FileSlot = {
  file: File | null;
  progress: number;
  status: "idle" | "uploading" | "done" | "error";
  error?: string;
  url?: string;
  path?: string;
  controller?: AbortController;
};

const emptySlot = (): FileSlot => ({ file: null, progress: 0, status: "idle" });

const CATEGORIES = ["Hollywood", "Nollywood", "Bollywood", "Korean Drama", "Chinese Drama", "Anime", "TV Series"] as const;
const QUALITIES = ["HD", "FHD", "4K"] as const;

function UploadPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

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

  const [slots, setSlots] = useState<Record<string, FileSlot>>({
    movie: emptySlot(),
    trailer: emptySlot(),
    poster: emptySlot(),
    backdrop: emptySlot(),
    subtitle: emptySlot(),
    thumbnail: emptySlot(),
  });
  const [submitting, setSubmitting] = useState(false);

  const slug = useMemo(
    () => title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) + "-" + Math.random().toString(36).slice(2, 6),
    [title],
  );

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

  const setSlot = (key: string, patch: Partial<FileSlot>) =>
    setSlots((s) => ({ ...s, [key]: { ...s[key], ...patch } }));

  const doUpload = async (key: string, bucket: BucketName, kind: string, file: File) => {
    if (!user) return;
    const controller = new AbortController();
    setSlot(key, { file, status: "uploading", progress: 0, error: undefined, controller });
    try {
      const res = await uploadFileWithProgress({
        bucket,
        userId: user.id,
        file,
        kind,
        onProgress: (p) => setSlot(key, { progress: p }),
        signal: controller.signal,
      });
      setSlot(key, { status: "done", progress: 100, url: res.url, path: res.path });
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setSlot(key, { status: "idle", progress: 0, file: null });
        return;
      }
      setSlot(key, { status: "error", error: e?.message ?? "Upload failed" });
    }
  };

  const cancel = (key: string) => {
    const s = slots[key];
    s.controller?.abort();
    setSlot(key, { status: "idle", progress: 0, file: null });
  };

  const retry = (key: string, bucket: BucketName, kind: string) => {
    const s = slots[key];
    if (s.file) doUpload(key, bucket, kind, s.file);
  };

  const submit = async () => {
    if (!user) return;
    if (!title.trim()) return toast.error("Title is required");
    if (!slots.movie.url && !slots.trailer.url) {
      return toast.error("Upload at least a movie file or a trailer.");
    }
    if (Object.values(slots).some((s) => s.status === "uploading")) {
      return toast.error("Wait for uploads to finish.");
    }

    setSubmitting(true);
    const { data: inserted, error } = await supabase
      .from("movies")
      .insert({
        title: title.trim(),
        slug,
        description,
        poster: slots.poster.url ?? PLACEHOLDER_POSTER,
        backdrop: slots.backdrop.url ?? PLACEHOLDER_BACKDROP,

        trailer_url: slots.trailer.url ?? null,
        movie_url: slots.movie.url ?? null,
        subtitle_url: slots.subtitle.url ?? null,
        thumbnail: slots.thumbnail.url ?? null,
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

    // Backfill movie_id on media_files
    const paths = Object.values(slots).filter((s) => s.path).map((s) => s.path!);
    if (paths.length > 0) {
      await supabase.from("media_files").update({ movie_id: inserted.id }).eq("user_id", user.id).in("path", paths);
    }

    toast.success("Published! Your movie is live.");
    nav({ to: "/movie/$id", params: { id: inserted.slug } });
  };

  return (
    <AppShell>
      <PageHeader kicker="Publish" title="Upload to D4MOVIES" subtitle="Movies, series, anime, docs, shorts and trailers. Publishes instantly — no approval." />
      <div className="mx-auto max-w-5xl px-4 md:px-6 pb-16 space-y-8">
        {/* Files */}
        <div className="grid md:grid-cols-2 gap-4">
          <FileDrop label="Movie file" accept="video/*" hint="MP4, WebM, MOV — private, streams via signed URL" slotKey="movie" slots={slots} onFile={(f) => doUpload("movie", "movies", "movie", f)} onCancel={() => cancel("movie")} onRetry={() => retry("movie", "movies", "movie")} />
          <FileDrop label="Trailer" accept="video/*" hint="Short preview clip shown on hover" slotKey="trailer" slots={slots} onFile={(f) => doUpload("trailer", "trailers", "trailer", f)} onCancel={() => cancel("trailer")} onRetry={() => retry("trailer", "trailers", "trailer")} />
          <FileDrop label="Poster" accept="image/*" hint="2:3 portrait, min 500×750" slotKey="poster" slots={slots} onFile={(f) => doUpload("poster", "posters", "poster", f)} onCancel={() => cancel("poster")} onRetry={() => retry("poster", "posters", "poster")} />
          <FileDrop label="Backdrop" accept="image/*" hint="16:9 landscape, min 1600×900" slotKey="backdrop" slots={slots} onFile={(f) => doUpload("backdrop", "backdrops", "backdrop", f)} onCancel={() => cancel("backdrop")} onRetry={() => retry("backdrop", "backdrops", "backdrop")} />
          <FileDrop label="Subtitles" accept=".vtt,.srt" hint=".vtt or .srt" slotKey="subtitle" slots={slots} onFile={(f) => doUpload("subtitle", "subtitles", "subtitle", f)} onCancel={() => cancel("subtitle")} onRetry={() => retry("subtitle", "subtitles", "subtitle")} />
          <FileDrop label="Thumbnail" accept="image/*" hint="Optional 1280×720 thumb" slotKey="thumbnail" slots={slots} onFile={(f) => doUpload("thumbnail", "thumbnails", "thumbnail", f)} onCancel={() => cancel("thumbnail")} onRetry={() => retry("thumbnail", "thumbnails", "thumbnail")} />
        </div>

        {/* Metadata */}
        <div className="glass rounded-3xl p-5 md:p-6 grid md:grid-cols-2 gap-4">
          <Field label="Title *"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Movie title" /></Field>
          <Field label="Original title"><Input value={originalTitle} onChange={(e) => setOriginalTitle(e.target.value)} placeholder="Original language title" /></Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
              {CATEGORIES.map((c) => <option key={c} className="bg-background">{c}</option>)}
            </select>
          </Field>
          <Field label="Quality">
            <select value={quality} onChange={(e) => setQuality(e.target.value as any)} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
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
  label, accept, hint, slotKey, slots, onFile, onCancel, onRetry,
}: {
  label: string; accept: string; hint: string; slotKey: string;
  slots: Record<string, FileSlot>;
  onFile: (f: File) => void; onCancel: () => void; onRetry: () => void;
}) {
  const s = slots[slotKey];
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm">{label}</div>
          <div className="text-xs text-muted-foreground">{hint}</div>
        </div>
        {s.status === "done" && <CheckCircle2 className="size-5 text-primary" />}
      </div>

      {s.status === "idle" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-dashed border-white/15 py-6 hover:bg-white/5 grid place-items-center gap-1 text-sm text-muted-foreground"
        >
          <UploadCloud className="size-5" />
          Click to select file
        </button>
      )}

      {s.status === "uploading" && (
        <div className="space-y-2">
          <div className="text-xs truncate">{s.file?.name}</div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-gold transition-all" style={{ width: `${s.progress}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>{s.progress}%</span>
            <button className="text-destructive" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      )}

      {s.status === "done" && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{s.file?.name}</span>
          <button onClick={onCancel} className="inline-flex items-center gap-1 hover:text-foreground"><X className="size-3" /> Replace</button>
        </div>
      )}

      {s.status === "error" && (
        <div className="space-y-2">
          <div className="text-xs text-destructive">{s.error}</div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full" onClick={onRetry}><RefreshCw className="size-3" /> Retry</Button>
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
