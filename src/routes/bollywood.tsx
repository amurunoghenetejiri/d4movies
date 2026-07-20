import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/movies/CategoryPage";

export const Route = createFileRoute("/bollywood")({
  head: () => ({ meta: [{ title: "Bollywood — D4TECH Movies" }] }),
  component: () => <CategoryPage kicker="India" title="Bollywood" subtitle="Music, drama and dance — straight from Mumbai." filter={(m) => m.category === "Bollywood"} />,
});
