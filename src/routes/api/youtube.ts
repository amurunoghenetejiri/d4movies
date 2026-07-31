import { createFileRoute } from "@tanstack/react-router";

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
          yt.searchParams.set("q", q.trim() || "#shorts");
          yt.searchParams.set("order", q.trim() ? "relevance" : "date");
        } else {
          yt.searchParams.set("q", q.trim() || "shorts");
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
