import { Link } from "@tanstack/react-router";
import { Play, Star } from "lucide-react";
import { tmdbPoster, type TmdbItem } from "@/lib/tmdb";

export function TmdbCard({ item, size = "md" }: { item: TmdbItem; size?: "sm" | "md" | "lg" }) {
  const width = size === "lg" ? "w-44 md:w-64" : size === "sm" ? "w-24 md:w-36" : "w-28 md:w-48";
  const title = (item as any).title ?? (item as any).name ?? "Untitled";
  const date = item.release_date ?? item.first_air_date ?? "";
  const year = date ? new Date(date).getFullYear() : "";
  return (
    <Link to="/tmdb/$id" params={{ id: String(item.id) }} className={`group relative shrink-0 ${width} hover-lift block`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-border/60 bg-muted">
        <img
          src={tmdbPoster(item.poster_path)}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full glass flex items-center gap-1">
            <Star className="size-3 fill-gold text-gold" /> {item.vote_average.toFixed(1)}
          </span>
        </div>
        <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="grid place-items-center size-14 rounded-full bg-primary/90 text-primary-foreground shadow-2xl glow-emerald">
            <Play className="size-6 fill-current" />
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-3">
          <h3 className="text-xs font-semibold line-clamp-1 text-foreground">{title}</h3>
          <p className="text-[10px] md:text-[11px] text-muted-foreground">{year}</p>
        </div>
      </div>
    </Link>
  );
}
