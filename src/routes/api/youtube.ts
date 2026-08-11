import { createFileRoute } from "@tanstack/react-router";

/** Movie-focused short queries — rotated randomly so the feed stays fresh and on-topic. */
const MOVIE_SHORT_QUERIES = [
  "movie trailer shorts",
  "film trailer #shorts",
  "movie clips #shorts",
  "behind the scenes movie",
  "movie scenes english",
  "hollywood movie trailer",
  "hollywood film trailer",
  "movie facts #shorts",
  "cinema trailer shorts",
  "hollywood cartoon movie trailer",
  "animated movie trailer shorts",
  "hollywood movie scenes",
  "hollywood film clips",
  "movie premiere trailer",
  "best movie trailers 2024 2025 2026",
];

function pickMovieQuery(): string {
  const i = Math.floor(Math.random() * MOVIE_SHORT_QUERIES.length);
  return MOVIE_SHORT_QUERIES[i] ?? "movie trailer shorts";
}

export const Route = createFileRoute("/api/youtube")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = process.env.YOUTUBE_API_KEY;
        if (!key) {
          return Response.json({ error: "YOUTUBE_API_KEY not configured" }, { status: 500 });
        }
        const url = new URL(request.url);
        const type = url.searchParams.get("type") ?? "shorts";
        const q = url.searchParams.get("q") ?? "";
        const pageToken = url.searchParams.get("pageToken") ?? "";

        const yt = new URL("https://www.googleapis.com/youtube/v3/search");
        yt.searchParams.set("key", key);
        yt.searchParams.set("part", "snippet");
        yt.searchParams.set("type", "video");
        yt.searchParams.set("maxResults", "25");
        yt.searchParams.set("safeSearch", "moderate");
        yt.searchParams.set("videoEmbeddable", "true");
        yt.searchParams.set("videoSyndicated", "true");

        if (type === "shorts") {
          yt.searchParams.set("videoDuration", "short");
          // Prefer explicit user search; otherwise use a random movie-related query
          const searchQ = q.trim() || pickMovieQuery();
          yt.searchParams.set("q", searchQ);
          yt.searchParams.set("order", q.trim() ? "relevance" : "date");
        } else {
          yt.searchParams.set("q", q.trim() || "movie trailer");
          yt.searchParams.set("order", "relevance");
        }
        if (pageToken) yt.searchParams.set("pageToken", pageToken);

        const r = await fetch(yt.toString());
        if (!r.ok) {
          const text = await r.text();
          return Response.json({ error: "YouTube error", detail: text }, { status: r.status });
        }
        const data = (await r.json()) as {
          nextPageToken?: string;
          items?: Array<{
            id: { videoId?: string };
            snippet: {
              title: string;
              description: string;
              channelTitle: string;
              publishedAt: string;
              thumbnails: Record<string, { url: string }>;
            };
          }>;
        };

        const seen = new Set<string>();
        const items = (data.items ?? [])
          .filter((it) => {
            const id = it.id?.videoId;
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
          })
          .map((it) => ({
            id: it.id.videoId as string,
            title: it.snippet.title,
            description: it.snippet.description,
            channel: it.snippet.channelTitle,
            publishedAt: it.snippet.publishedAt,
            thumbnail:
              it.snippet.thumbnails?.high?.url ??
              it.snippet.thumbnails?.medium?.url ??
              it.snippet.thumbnails?.default?.url ??
              "",
          }));

        return Response.json(
          { items, nextPageToken: data.nextPageToken ?? null },
          { headers: { "cache-control": "public, max-age=60" } },
        );
      },
    },
  },
});
