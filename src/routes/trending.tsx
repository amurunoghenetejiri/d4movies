import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/movies/CategoryPage";

export const Route = createFileRoute("/trending")({
  head: () => ({ meta: [{ title: "Trending — D4TECH Movies" }] }),
  component: () => <CategoryPage kicker="Hot" title="Trending" subtitle="What the world is watching right now." filter={(m) => !!m.trending} />,
});
