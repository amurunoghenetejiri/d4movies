import { supabase } from "@/integrations/supabase/client";

export type BucketName =
  | "movies"
  | "trailers"
  | "posters"
  | "backdrops"
  | "subtitles"
  | "thumbnails"
  | "profile-images";

// 10-year signed URL (max is effectively unbounded, we use a long window)
const LONG_EXPIRES = 60 * 60 * 24 * 365 * 10;

export function safeFileName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_");
}

export async function getLongLivedUrl(bucket: BucketName, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, LONG_EXPIRES);
  if (error || !data?.signedUrl) throw error ?? new Error("Failed to sign URL");
  return data.signedUrl;
}

export type UploadResult = {
  bucket: BucketName;
  path: string;
  url: string;
  size: number;
  type: string;
  name: string;
};

/** Upload a File to Supabase Storage with progress. Uses XHR under the hood via the
 *  storage endpoint so we can report percentage. */
export async function uploadFileWithProgress(opts: {
  bucket: BucketName;
  userId: string;
  file: File;
  kind: string;
  movieId?: string | null;
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
}): Promise<UploadResult> {
  const { bucket, userId, file, kind, movieId = null, onProgress, signal } = opts;
  const path = `${userId}/${kind}/${Date.now()}-${safeFileName(file.name)}`;

  // Use resumable upload for large videos, direct upload for small assets.
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("You need to be signed in to upload.");

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, "");
  const endpoint = `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURI(path)}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("x-upsert", "true");
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText || `HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    if (signal) signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });

  const url = await getLongLivedUrl(bucket, path);

  await supabase.from("media_files").insert({
    user_id: userId,
    movie_id: movieId,
    bucket,
    path,
    url,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type,
    kind,
  });

  return { bucket, path, url, size: file.size, type: file.type, name: file.name };
}
