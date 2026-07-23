import { queryOptions, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MovieCategory =
  | "Hollywood"
  | "Nollywood"
  | "Bollywood"
  | "Korean Drama"
  | "Chinese Drama"
  | "Anime"
  | "TV Series";

export type Movie = {
  id: string; // slug used in URLs
  dbId: string; // UUID from Supabase
  title: string;
  year: number;
  rating: number;
  runtime: string;
  runtimeMinutes: number;
  quality: "HD" | "4K" | "FHD";
  genres: string[];
  category: MovieCategory;
  country: string;
  language: string;
  description: string;
  director: string;
  cast: string[];
  poster: string;
  backdrop: string;
  trending?: boolean;
  featured?: boolean;
  topRated?: boolean;
  comingSoon?: boolean;
  trailerUrl?: string;
  movieUrl?: string;
  subtitleUrl?: string;
  thumbnail?: string;
  originalTitle?: string;
  producer?: string;
  ageRating?: string;
  tags?: string[];
  isHidden?: boolean;
  isPinned?: boolean;
  createdBy?: string | null;
};

type MovieRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  poster: string | null;
  backdrop: string | null;
  trailer_url: string | null;
  movie_url: string | null;
  genres: string[];
  actors: string[];
  director: string | null;
  language: string | null;
  country: string | null;
  release_year: number;
  category: MovieCategory;
  quality: "HD" | "4K" | "FHD";
  runtime_minutes: number;
  rating: number;
  trending: boolean;
  featured: boolean;
  top_rated: boolean;
  coming_soon: boolean;
  created_by: string | null;
};

export function mapMovie(r: MovieRow): Movie {
  return {
    id: r.slug,
    dbId: r.id,
    title: r.title,
    year: r.release_year,
    rating: Number(r.rating),
    runtimeMinutes: r.runtime_minutes,
    runtime: `${Math.floor(r.runtime_minutes / 60)}h ${r.runtime_minutes % 60}m`,
    quality: r.quality,
    genres: r.genres ?? [],
    category: r.category,
    country: r.country ?? "Global",
    language: r.language ?? "English",
    description: r.description ?? "",
    director: r.director ?? "—",
    cast: r.actors ?? [],
    poster: r.poster ?? PLACEHOLDER_POSTER,
    backdrop: r.backdrop ?? PLACEHOLDER_BACKDROP,

    trending: r.trending,
    featured: r.featured,
    topRated: r.top_rated,
    comingSoon: r.coming_soon,
    trailerUrl: r.trailer_url ?? undefined,
    movieUrl: r.movie_url ?? undefined,
    subtitleUrl: (r as any).subtitle_url ?? undefined,
    thumbnail: (r as any).thumbnail ?? undefined,
    originalTitle: (r as any).original_title ?? undefined,
    producer: (r as any).producer ?? undefined,
    ageRating: (r as any).age_rating ?? undefined,
    tags: (r as any).tags ?? [],
    isHidden: (r as any).is_hidden ?? false,
    isPinned: (r as any).is_pinned ?? false,
    createdBy: r.created_by,
  };
}

export const moviesQueryOptions = () =>
  queryOptions({
    queryKey: ["movies"],
    queryFn: async (): Promise<Movie[]> => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as MovieRow[]).map(mapMovie);
    },
    staleTime: 60_000,
  });

export function useAllMovies(): Movie[] {
  const { data } = useQuery(moviesQueryOptions());
  return data ?? [];
}

export function useMovieBySlug(slug: string | undefined): Movie | undefined {
  const list = useAllMovies();
  return useMemo(() => list.find((m) => m.id === slug), [list, slug]);
}

export function useGenres(): string[] {
  const list = useAllMovies();
  return useMemo(
    () => Array.from(new Set(list.flatMap((m) => m.genres))).sort(),
    [list],
  );
}
export function useCountries(): string[] {
  const list = useAllMovies();
  return useMemo(
    () => Array.from(new Set(list.map((m) => m.country))).sort(),
    [list],
  );
}
