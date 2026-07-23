import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TmdbCard } from "./TmdbCard";
import type { TmdbItem } from "@/lib/tmdb";

export function TmdbRow({
  title,
  subtitle,
  items,
  loading,
}: {
  title: string;
  subtitle?: string;
  items: TmdbItem[] | undefined;
  loading?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.85), behavior: "smooth" });

  if (!loading && (!items || items.length === 0)) return null;

  return (
    <section className="relative px-4 md:px-6">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg md:text-2xl font-bold">{title}</h2>
          {subtitle && <p className="text-xs md:text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="hidden md:flex gap-1">
          <button onClick={() => scroll(-1)} className="size-9 rounded-full glass grid place-items-center hover:bg-white/10" aria-label="Prev">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => scroll(1)} className="size-9 rounded-full glass grid place-items-center hover:bg-white/10" aria-label="Next">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 md:gap-4 overflow-x-auto scroll-smooth snap-x pb-2 no-scrollbar">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-40 md:w-48 aspect-[2/3] rounded-2xl bg-white/5 animate-pulse shrink-0" />
            ))
          : items!.map((it) => <TmdbCard key={it.id} item={it} />)}
      </div>
    </section>
  );
}
