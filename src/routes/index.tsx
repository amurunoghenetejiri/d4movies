import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { HeroCarousel } from "@/components/movies/HeroCarousel";
import { MovieRow } from "@/components/movies/MovieRow";
import { movies } from "@/lib/movies";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "D4TECH Movies — Stream. Discover. Enjoy." },
      { name: "description", content: "Watch premium movies, TV series, anime and world dramas in HD & 4K on D4TECH Movies." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const featured = movies.filter((m) => m.featured).slice(0, 6);
  const trending = movies.filter((m) => m.trending);
  const topRated = [...movies].sort((a, b) => b.rating - a.rating).slice(0, 15);
  const cat = (c: string) => movies.filter((m) => m.category === c);
  const byGenre = (g: string) => movies.filter((m) => m.genres.includes(g));

  return (
    <AppShell>
      <HeroCarousel movies={featured} />
      <div className="mt-2 md:mt-6 space-y-10 md:space-y-14">
        <MovieRow title="Trending Now" subtitle="What everyone's watching this week" movies={trending} size="md" />
        <MovieRow title="Continue Watching" subtitle="Pick up right where you left off" movies={movies.slice(0, 10)} size="md" />
        <MovieRow title="Recently Added" subtitle="Fresh drops on D4TECH" movies={movies.slice(10, 24)} />
        <MovieRow title="Top Rated" subtitle="Critically acclaimed picks" movies={topRated} />
        <MovieRow title="Editor's Picks" subtitle="Curated by our team" movies={movies.slice(6, 18)} />
        <MovieRow title="Recommended For You" movies={movies.slice(20, 34)} />
        <MovieRow title="Hollywood" movies={cat("Hollywood")} />
        <MovieRow title="Nollywood" movies={cat("Nollywood")} />
        <MovieRow title="Bollywood" movies={cat("Bollywood")} />
        <MovieRow title="Korean Drama" movies={cat("Korean Drama")} />
        <MovieRow title="Chinese Drama" movies={cat("Chinese Drama")} />
        <MovieRow title="Anime" movies={cat("Anime")} />
        <MovieRow title="Action" movies={byGenre("Action")} />
        <MovieRow title="Adventure" movies={byGenre("Adventure")} />
        <MovieRow title="Comedy" movies={byGenre("Comedy")} />
        <MovieRow title="Drama" movies={byGenre("Drama")} />
        <MovieRow title="Romance" movies={byGenre("Romance")} />
        <MovieRow title="Sci-Fi" movies={byGenre("Sci-Fi")} />
        <MovieRow title="Fantasy" movies={byGenre("Fantasy")} />
        <MovieRow title="Crime" movies={byGenre("Crime")} />
        <MovieRow title="Animation" movies={byGenre("Animation")} />
        <MovieRow title="Documentary" movies={byGenre("Documentary")} />
        <MovieRow title="Family" movies={byGenre("Family")} />
      </div>
    </AppShell>
  );
}
