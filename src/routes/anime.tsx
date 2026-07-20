import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/movies/CategoryPage";

export const Route = createFileRoute("/anime")({
  head: () => ({ meta: [{ title: "Anime — D4TECH Movies" }] }),
  component: () => <CategoryPage kicker="Anime" title="Anime" subtitle="From Tokyo to the world — the finest animation." filter={(m) => m.category === "Anime"} />,
});
