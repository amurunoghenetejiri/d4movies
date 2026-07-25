import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { HeroCarousel } from "@/components/movies/HeroCarousel";
import { MovieRow } from "@/components/movies/MovieRow";
import { TmdbRow } from "@/components/movies/TmdbRow";
import { useAllMovies } from "@/lib/movies";
import { useHistory } from "@/lib/user-data";
import { useAuth } from "@/hooks/use-auth";
import {
  TMDB_ENABLED, TMDB_GENRES,
  useTmdbNowPlaying, useTmdbPopular, useTmdbTopRated, useTmdbTrending,
  useTmdbTvPopular, useTmdbUpcoming, useTmdbByGenre,
} from "@/lib/tmdb";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "D4MOVIES — Stream. Discover. Enjoy." },
      { name: "description", content: "Premium streaming for movies, TV series, anime and world dramas in HD & 4K on D4STREAMS." },
      { property: "og:title", content: "D4MOVIES — Stream. Discover. Enjoy." },
      { property: "og:description", content: "Trending, top-rated, and freshly uploaded movies across every genre." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const movies = useAllMovies();
  const { user } = useAuth();
  const history = useHistory();

  // TMDb feeds
  const trending = useTmdbTrending();
  const popular = useTmdbPopular();
  const topRated = useTmdbTopRated();
  const nowPlaying = useTmdbNowPlaying();
  const upcoming = useTmdbUpcoming();
  const tvPopular = useTmdbTvPopular();
  const action = useTmdbByGenre(TMDB_GENRES.Action);
  const adventure = useTmdbByGenre(TMDB_GENRES.Adventure);
  const comedy = useTmdbByGenre(TMDB_GENRES.Comedy);
  const horror = useTmdbByGenre(TMDB_GENRES.Horror);
  const romance = useTmdbByGenre(TMDB_GENRES.Romance);
  const animation = useTmdbByGenre(TMDB_GENRES.Animation);
  const crime = useTmdbByGenre(TMDB_GENRES.Crime);
  const sciFi = useTmdbByGenre(TMDB_GENRES["Sci-Fi"]);
  const thriller = useTmdbByGenre(TMDB_GENRES.Thriller);

  // Hero: prefer TMDb trending; fall back to any uploaded movie
  const heroSource = movies.filter((m) => m.featured).slice(0, 6);
  const continueWatching = (history.data ?? []).filter((h) => h.progress < 100).map((h) => h.movie);

  return (
    <AppShell>
      <HeroCarousel movies={heroSource.length ? heroSource : movies.slice(0, 6)} />

      <div className="mt-4 md:mt-8 space-y-8 md:space-y-12">
        {!TMDB_ENABLED && (
          <div className="mx-4 md:mx-6 glass rounded-2xl px-4 py-3 text-sm text-muted-foreground">
            <span className="text-gradient-emerald font-semibold">Tip:</span> Add a <code className="text-primary">VITE_TMDB_API_KEY</code> secret to fill the library with live TMDb data across every category.
          </div>
        )}

        {user && continueWatching.length > 0 && (
          <MovieRow title="Continue Watching" subtitle="Pick up right where you left off" movies={continueWatching} size="md" />
        )}

        {movies.length > 0 && (
          <MovieRow title="Fresh Uploads" subtitle="From our creator community" movies={movies.slice(0, 14)} />
        )}

        <TmdbRow title="Trending This Week" subtitle="What the world is watching" items={trending.data} loading={trending.isLoading} />
        <TmdbRow title="Popular Movies" subtitle="The crowd favorites" items={popular.data} loading={popular.isLoading} />
        <TmdbRow title="Top Rated" subtitle="Critically acclaimed" items={topRated.data} loading={topRated.isLoading} />
        <TmdbRow title="Now Playing" subtitle="In theaters right now" items={nowPlaying.data} loading={nowPlaying.isLoading} />
        <TmdbRow title="Coming Soon" subtitle="On the horizon" items={upcoming.data} loading={upcoming.isLoading} />
        <TmdbRow title="Popular TV Series" subtitle="Binge the moment" items={tvPopular.data} loading={tvPopular.isLoading} />
        <TmdbRow title="Action" items={action.data} loading={action.isLoading} />
        <TmdbRow title="Adventure" items={adventure.data} loading={adventure.isLoading} />
        <TmdbRow title="Comedy" items={comedy.data} loading={comedy.isLoading} />
        <TmdbRow title="Horror" items={horror.data} loading={horror.isLoading} />
        <TmdbRow title="Romance" items={romance.data} loading={romance.isLoading} />
        <TmdbRow title="Animation" items={animation.data} loading={animation.isLoading} />
        <TmdbRow title="Crime" items={crime.data} loading={crime.isLoading} />
        <TmdbRow title="Sci-Fi" items={sciFi.data} loading={sciFi.isLoading} />
        <TmdbRow title="Thriller" items={thriller.data} loading={thriller.isLoading} />

        {movies.length === 0 && !TMDB_ENABLED && (
          <div className="mx-4 md:mx-6 glass rounded-2xl p-8 text-center">
            <h2 className="text-xl font-bold text-gradient-emerald">Library is empty</h2>
            <p className="mt-2 text-muted-foreground text-sm">No uploads yet and TMDb isn't configured. Be the first — upload a movie to start.</p>
            <Link to="/upload" className="mt-4 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground glow-emerald">Upload now</Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
