import type { Movie } from "@/lib/movies";
import { MovieCard } from "./MovieCard";

export function MovieGrid({ movies }: { movies: Movie[] }) {
  if (movies.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-16 text-center text-muted-foreground">
        No movies found. Try adjusting your filters.
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {movies.map((m) => (
          <div key={m.id} className="flex justify-center">
            <MovieCard m={m} />
          </div>
        ))}
      </div>
    </div>
  );
}
