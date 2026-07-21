import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { HeroCarousel } from "@/components/movies/HeroCarousel";
import { MovieRow } from "@/components/movies/MovieRow";
import { useAllMovies } from "@/lib/movies";
import { useHistory } from "@/lib/user-data";
import { useAuth } from "@/hooks/use-auth";

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
  const movies = useAllMovies();
  const { user } = useAuth();
  const history = useHistory();

  const featured = movies.filter((m) => m.featured).slice(0, 6);
  const trending = movies.filter((m) => m.trending);
  const topRated = [...movies].sort((a, b) => b.rating - a.rating).slice(0, 15);
  const cat = (c: string) => movies.filter((m) => m.category === c);
  const byGenre = (g: string) => movies.filter((m) => m.genres.includes(g));
  const continueWatching = (history.data ?? []).filter((h) => h.progress < 100).map((h) => h.movie);

  return (
    <AppShell>
      <HeroCarousel movies={featured.length ? featured : movies.slice(0, 6)} />
      <div className="mt-2 md:mt-6 space-y-10 md:space-y-14">
        <MovieRow title="Trending Now" subtitle="What everyone's watching this week" movies={trending} size="md" />
        {user && continueWatching.length > 0 && (
          <MovieRow title="Continue Watching" subtitle="Pick up right where you left off" movies={continueWatching} size="md" />
        )}
        <MovieRow title="Recently Added" subtitle="Fresh drops on D4TECH" movies={movies.slice(0, 14)} />
        <MovieRow title="Top Rated" subtitle="Critically acclaimed picks" movies={topRated} />
        <MovieRow title="Editor's Picks" subtitle="Curated by our team" movies={movies.slice(6, 18)} />
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
      </div>
    </AppShell>
  );
}
