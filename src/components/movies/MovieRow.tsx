import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Movie } from "@/lib/movies";
import { MovieCard } from "./MovieCard";
import { Button } from "@/components/ui/button";

export function MovieRow({ title, subtitle, movies, size }: { title: string; subtitle?: string; movies: Movie[]; size?: "sm" | "md" | "lg" }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * 600, behavior: "smooth" });
  };
  if (movies.length === 0) return null;
  return (
    <section className="animate-fade-up">
      <div className="flex items-end justify-between px-4 md:px-6 mb-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="hidden md:flex gap-1">
          <Button size="icon" variant="ghost" className="rounded-full" onClick={() => scroll(-1)} aria-label="Scroll left"><ChevronLeft /></Button>
          <Button size="icon" variant="ghost" className="rounded-full" onClick={() => scroll(1)} aria-label="Scroll right"><ChevronRight /></Button>
        </div>
      </div>
      <div ref={ref} className="scrollbar-hide flex gap-3 md:gap-4 overflow-x-auto scroll-smooth px-4 md:px-6 pb-4">
        {movies.map((m) => (
          <MovieCard key={m.id} m={m} size={size} />
        ))}
      </div>
    </section>
  );
}
