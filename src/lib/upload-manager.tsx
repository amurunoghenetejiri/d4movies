import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getLongLivedUrl, safeFileName, type BucketName } from "@/lib/uploads";

export type JobStatus = "queued" | "uploading" | "paused" | "done" | "error" | "cancelled";

export type UploadJob = {
  id: string;
  name: string;
  size: number;
  type: string;
  bucket: BucketName;
  kind: string;
  userId: string;
  movieId?: string | null;
  file: File | null; // may be null after done
  path: string;
  progress: number; // 0..100
  loaded: number;
  status: JobStatus;
  error?: string;
  url?: string;
  startedAt: number;
  updatedAt: number;
  speed: number; // bytes/sec
  eta: number; // seconds remaining
  label?: string;
};

type Listener = () => void;

class ManagerStore {
  jobs: Map<string, UploadJob> = new Map();
  xhrs: Map<string, XMLHttpRequest> = new Map();
  listeners: Set<Listener> = new Set();

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
  emit() {
    for (const l of this.listeners) l();
  }
  list(): UploadJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.startedAt - a.startedAt);
  }
  get(id: string) {
    return this.jobs.get(id);
  }
  private patch(id: string, patch: Partial<UploadJob>) {
    const j = this.jobs.get(id);
    if (!j) return;
    this.jobs.set(id, { ...j, ...patch, updatedAt: Date.now() });
    this.emit();
  }

  async enqueue(spec: {
    file: File;
    bucket: BucketName;
    kind: string;
    userId: string;
    movieId?: string | null;
    label?: string;
  }): Promise<string> {
    const id = crypto.randomUUID();
    const path = `${spec.userId}/${spec.kind}/${Date.now()}-${safeFileName(spec.file.name)}`;
    const job: UploadJob = {
      id,
      name: spec.file.name,
      size: spec.file.size,
      type: spec.file.type,
      bucket: spec.bucket,
      kind: spec.kind,
      userId: spec.userId,
      movieId: spec.movieId ?? null,
      file: spec.file,
      path,
      progress: 0,
      loaded: 0,
      status: "queued",
      startedAt: Date.now(),
      updatedAt: Date.now(),
      speed: 0,
      eta: 0,
      label: spec.label,
    };
    this.jobs.set(id, job);
    this.emit();
    this.start(id).catch(() => void 0);
    return id;
  }

  private async start(id: string) {
    const job = this.jobs.get(id);
    if (!job || !job.file) return;

    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      this.patch(id, { status: "error", error: "Sign in to upload." });
      return;
    }

    const url =
      (import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, "") +
      `/storage/v1/object/${job.bucket}/${encodeURI(job.path)}`;

    const xhr = new XMLHttpRequest();
    this.xhrs.set(id, xhr);
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("x-upsert", "true");
    if (job.type) xhr.setRequestHeader("Content-Type", job.type);

    let lastTs = Date.now();
    let lastLoaded = 0;
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const now = Date.now();
      const dt = (now - lastTs) / 1000;
      const speed = dt > 0 ? (e.loaded - lastLoaded) / dt : 0;
      const remaining = e.total - e.loaded;
      const eta = speed > 0 ? remaining / speed : 0;
      lastTs = now;
      lastLoaded = e.loaded;
      this.patch(id, {
        status: "uploading",
        loaded: e.loaded,
        progress: Math.round((e.loaded / e.total) * 100),
        speed,
        eta,
      });
    };
    xhr.onload = async () => {
      this.xhrs.delete(id);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const signed = await getLongLivedUrl(job.bucket, job.path);
          await supabase.from("media_files").insert({
            user_id: job.userId,
            movie_id: job.movieId ?? null,
            bucket: job.bucket,
            path: job.path,
            url: signed,
            file_name: job.name,
            file_size: job.size,
            file_type: job.type,
            kind: job.kind,
          });
          this.patch(id, { status: "done", progress: 100, url: signed, file: null, speed: 0, eta: 0 });
        } catch (e: any) {
          this.patch(id, { status: "error", error: e?.message ?? "Failed to finalize" });
        }
      } else {
        this.patch(id, { status: "error", error: xhr.responseText || `HTTP ${xhr.status}` });
      }
    };
    xhr.onerror = () => {
      this.xhrs.delete(id);
      this.patch(id, { status: "error", error: "Network error" });
    };
    xhr.onabort = () => {
      this.xhrs.delete(id);
      const cur = this.jobs.get(id);
      if (cur?.status !== "cancelled" && cur?.status !== "paused") {
        this.patch(id, { status: "paused" });
      }
    };

    this.patch(id, { status: "uploading" });
    xhr.send(job.file);
  }

  pause(id: string) {
    const xhr = this.xhrs.get(id);
    if (xhr) {
      this.patch(id, { status: "paused" });
      xhr.abort();
    }
  }

  resume(id: string) {
    const job = this.jobs.get(id);
    if (!job || !job.file) return;
    // Storage POST doesn't support byte-range resume; restart the whole file.
    this.patch(id, { progress: 0, loaded: 0, status: "queued" });
    this.start(id).catch(() => void 0);
  }

  retry(id: string) {
    this.resume(id);
  }

  cancel(id: string) {
    const xhr = this.xhrs.get(id);
    this.patch(id, { status: "cancelled" });
    if (xhr) xhr.abort();
  }

  remove(id: string) {
    this.jobs.delete(id);
    this.xhrs.delete(id);
    this.emit();
  }

  clearFinished() {
    for (const [id, j] of this.jobs) {
      if (j.status === "done" || j.status === "cancelled" || j.status === "error") {
        this.jobs.delete(id);
      }
    }
    this.emit();
  }

  attachToMovie(ids: string[], movieId: string, userId: string) {
    const paths = ids.map((i) => this.jobs.get(i)?.path).filter(Boolean) as string[];
    if (paths.length === 0) return Promise.resolve();
    return supabase
      .from("media_files")
      .update({ movie_id: movieId })
      .eq("user_id", userId)
      .in("path", paths);
  }
}

export const uploadManager = new ManagerStore();

const Ctx = createContext<ManagerStore | null>(null);

export function UploadManagerProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={uploadManager}>{children}</Ctx.Provider>;
}

export function useUploadManager() {
  const m = useContext(Ctx) ?? uploadManager;
  const [, force] = useState(0);
  useEffect(() => m.subscribe(() => force((n) => n + 1)), [m]);
  return m;
}

export function useUploadJob(id: string | undefined | null): UploadJob | undefined {
  useUploadManager();
  if (!id) return undefined;
  return uploadManager.get(id);
}

export function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = b / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}

export function formatEta(s: number): string {
  if (!isFinite(s) || s <= 0) return "—";
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

// Warn on tab close if uploads are in flight.
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (e) => {
    const active = uploadManager.list().some((j) => j.status === "uploading" || j.status === "queued");
    if (active) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}
