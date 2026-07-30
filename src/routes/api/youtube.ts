import { createFileRoute } from "@tanstack/react-router";

// YouTube proxy — keeps API key server-side.
// GET /api/youtube?type=search&q=...&pageToken=...
// GET /api/youtube?type=shorts&q=...&pageToken=...
export const Route = createFileRoute("/api/youtube")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = process.env.YOUTUBE_API_KEY;
        if (!key) {
          return Response.json({ error: "YOUTUBE_API_KEY not configured" }, { status: 500 });
        }
import { createFileRoute } from "@tanstack/react-router";

// YouTube proxy — keeps API key server-side.
// GET /api/youtube?type=search&q=...&pageToken=...
// GET /api/youtube?type=shorts&q=...&pageToken=...
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
          yt.searchParams.set(
            "q",
            q
              ? `${q} #shorts`
              : "official movie trailer #shorts OR behind the scenes #shorts OR movie clip #shorts",
          );
          yt.searchParams.set("order", q ? "relevance" : "viewCount");
        } else {
          yt.searchParams.set("q", q || "official movie trailer");
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

        const ids = (data.items ?? [])
          .map((it) => it.id?.videoId)
          .filter((id): id is string => !!id);

        let embeddable = new Set<string>(ids);
        if (ids.length > 0) {
          const details = new URL("https://www.googleapis.com/youtube/v3/videos");
          details.searchParams.set("key", key);
          details.searchParams.set("part", "status,snippet");
          details.searchParams.set("id", ids.join(","));
          const dr = await fetch(details.toString());
          if (dr.ok) {
            const djson = (await dr.json()) as {
              items?: Array<{
                id: string;
                status?: { embeddable?: boolean; privacyStatus?: string };
              }>;
            };
            embeddable = new Set(
              (djson.items ?? [])
                .filter(
                  (v) =>
                    v.status?.embeddable === true &&
                    (v.status?.privacyStatus === "public" || v.status?.privacyStatus === "unlisted"),
                )
                .map((v) => v.id),
            );
          }
        }

        const items = (data.items ?? [])
          .filter((it) => it.id?.videoId && embeddable.has(it.id.videoId))
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
          { headers: { "cache-control": "public, max-age=120" } },
        );
      },
    },
  },
});
