import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Info, Star } from "lucide-react";
import type { Movie } from "@/lib/movies";
import { Button } from "@/components/ui/button";

export function HeroCarousel({ movies }: { movies: Movie[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % movies.length), 6000);
    return () => clearInterval(t);
  }, [movies.length]);
  const m = movies[i];
  return (
    <section className="relative h-[78vh] min-h-[520px] w-full overflow-hidden">
      {movies.map((mv, idx) => (
        <div
          key={mv.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${idx === i ? "opacity-100" : "opacity-0"}`}
        >
          <img src={mv.backdrop} alt="" className="h-full w-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        </div>
      ))}
      <div className="relative z-10 h-full mx-auto max-w-7xl px-4 md:px-6 flex flex-col justify-end pb-16 md:pb-24">
        <div key={m.id} className="max-w-2xl animate-fade-up">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold">
            <span className="inline-block size-1.5 rounded-full bg-primary animate-pulse" /> Featured Today
          </span>
          <h1 className="mt-3 text-4xl md:text-6xl font-bold leading-[1.05]">
            <span className="text-gradient-emerald">{m.title}</span>
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1"><Star className="size-4 fill-gold text-gold" /> {m.rating}</span>
            <span className="text-muted-foreground">{m.year}</span>
            <span className="text-muted-foreground">{m.runtime}</span>
            <span className="rounded-full glass px-2 py-0.5 text-[11px] font-semibold">{m.quality}</span>
            {m.genres.map((g) => (
              <span key={g} className="text-muted-foreground">• {g}</span>
            ))}
          </div>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl line-clamp-3">
            {m.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full glow-emerald">
              <Link to="/watch/$id" params={{ id: m.id }}><Play className="fill-current" /> Watch Now</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-full">
              <Link to="/movie/$id" params={{ id: m.id }}><Info /> More Info</Link>
            </Button>
          </div>
        </div>
        <div className="mt-8 flex gap-2">
          {movies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`slide ${idx + 1}`}
              className={`h-1 rounded-full transition-all ${idx === i ? "w-10 bg-primary" : "w-4 bg-white/25"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
