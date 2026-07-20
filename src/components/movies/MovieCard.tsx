import { Link } from "@tanstack/react-router";
import { Bookmark, Heart, Play, Star, Download, Share2 } from "lucide-react";
import type { Movie } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function MovieCard({ m, size = "md" }: { m: Movie; size?: "sm" | "md" | "lg" }) {
  const width = size === "lg" ? "w-56 md:w-64" : size === "sm" ? "w-32 md:w-36" : "w-40 md:w-48";
  return (
    <div className={`group relative shrink-0 ${width} hover-lift`}>
      <Link to="/movie/$id" params={{ id: m.id }} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-border/60 bg-muted">
          <img
            src={m.poster}
            alt={m.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
          <div className="absolute top-2 left-2 flex gap-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold text-gold-foreground">
              {m.quality}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full glass flex items-center gap-1">
              <Star className="size-3 fill-gold text-gold" /> {m.rating}
            </span>
          </div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="grid place-items-center size-14 rounded-full bg-primary/90 text-primary-foreground shadow-2xl glow-emerald">
              <Play className="size-6 fill-current" />
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 p-3">
            <h3 className="text-sm font-semibold line-clamp-1 text-foreground">{m.title}</h3>
            <p className="text-[11px] text-muted-foreground">
              {m.year} • {m.runtime} • {m.genres[0]}
            </p>
          </div>
        </div>
      </Link>
      <div className="mt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="size-7 rounded-full" aria-label="Watchlist"
            onClick={() => toast.success("Added to Watchlist", { description: m.title })}>
            <Bookmark className="size-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="size-7 rounded-full" aria-label="Favorite"
            onClick={() => toast.success("Added to Favorites", { description: m.title })}>
            <Heart className="size-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="size-7 rounded-full" aria-label="Share"
            onClick={() => toast("Link copied", { description: m.title })}>
            <Share2 className="size-3.5" />
          </Button>
        </div>
        <Button size="icon" variant="ghost" className="size-7 rounded-full text-gold" aria-label="Download"
          onClick={() => toast.success("Download queued", { description: m.title })}>
          <Download className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
