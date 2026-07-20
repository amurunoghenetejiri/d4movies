import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/movies/CategoryPage";

export const Route = createFileRoute("/tv-series")({
  head: () => ({ meta: [{ title: "TV Series — D4TECH Movies" }] }),
  component: () => <CategoryPage kicker="Series" title="TV Series" subtitle="Binge-worthy shows, curated for you." filter={(m) => m.category === "TV Series"} />,
});
