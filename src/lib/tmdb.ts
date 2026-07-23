import { useQuery } from "@tanstack/react-query";
import { PLACEHOLDER_BACKDROP, PLACEHOLDER_POSTER } from "./placeholders";

export const TMDB_KEY = (import.meta.env.VITE_TMDB_API_KEY as string | undefined) ?? "";
export const TMDB_ENABLED = TMDB_KEY.length > 0;

const IMG = "https://image.tmdb.org/t/p";
export const tmdbPoster = (p: string | null, size: "w342" | "w500" | "original" = "w500") =>
  p ? `${IMG}/${size}${p}` : PLACEHOLDER_POSTER;
export const tmdbBackdrop = (p: string | null, size: "w780" | "w1280" | "original" = "w1280") =>
  p ? `${IMG}/${size}${p}` : PLACEHOLDER_BACKDROP;


export type TmdbItem = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  media_type?: "movie" | "tv";
};

async function tmdbFetch<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  if (!TMDB_ENABLED) throw new Error("TMDB key missing");
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("api_key", TMDB_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`TMDB ${r.status}`);
  return r.json();
}

const list = (path: string, params: Record<string, string | number> = {}) => ({
  queryKey: ["tmdb", path, params] as const,
  queryFn: async () => {
    const d = await tmdbFetch<{ results: TmdbItem[] }>(path, params);
    return d.results ?? [];
  },
  enabled: TMDB_ENABLED,
  staleTime: 5 * 60_000,
});

export const useTmdbTrending = () => useQuery(list("/trending/movie/week"));
export const useTmdbPopular = () => useQuery(list("/movie/popular"));
export const useTmdbTopRated = () => useQuery(list("/movie/top_rated"));
export const useTmdbNowPlaying = () => useQuery(list("/movie/now_playing"));
export const useTmdbUpcoming = () => useQuery(list("/movie/upcoming"));
export const useTmdbTvPopular = () => useQuery(list("/tv/popular"));
export const useTmdbByGenre = (genreId: number) =>
  useQuery(list("/discover/movie", { with_genres: genreId, sort_by: "popularity.desc" }));

// Common TMDb genre IDs
export const TMDB_GENRES = {
  Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80,
  Documentary: 99, Drama: 18, Family: 10751, Fantasy: 14, History: 36,
  Horror: 27, Music: 10402, Mystery: 9648, Romance: 10749, "Sci-Fi": 878,
  Thriller: 53, War: 10752, Western: 37,
} as const;

export type TmdbDetail = TmdbItem & {
  runtime: number;
  genres: { id: number; name: string }[];
  tagline: string;
  original_language: string;
  original_title: string;
  production_countries: { name: string }[];
  videos?: { results: { key: string; site: string; type: string; official: boolean }[] };
  credits?: {
    cast: { name: string; character: string; profile_path: string | null }[];
    crew: { name: string; job: string }[];
  };
};

export const useTmdbDetail = (id: string | number | undefined) =>
  useQuery({
    queryKey: ["tmdb", "detail", id],
    queryFn: () => tmdbFetch<TmdbDetail>(`/movie/${id}`, { append_to_response: "videos,credits" }),
    enabled: TMDB_ENABLED && !!id,
    staleTime: 10 * 60_000,
  });

export const useTmdbSearch = (q: string) =>
  useQuery({
    queryKey: ["tmdb", "search", q],
    queryFn: async () => {
      const d = await tmdbFetch<{ results: TmdbItem[] }>("/search/multi", { query: q, include_adult: "false" });
      return (d.results ?? []).filter((r) => (r.media_type as string) !== "person");
    },
    enabled: TMDB_ENABLED && q.trim().length >= 2,
    staleTime: 60_000,
  });

export function tmdbYouTubeKey(detail: TmdbDetail | undefined): string | null {
  const vids = detail?.videos?.results ?? [];
  const yt = vids.filter((v) => v.site === "YouTube");
  const trailer = yt.find((v) => v.type === "Trailer" && v.official) ?? yt.find((v) => v.type === "Trailer") ?? yt[0];
  return trailer?.key ?? null;
}
