import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/movies/CategoryPage";

export const Route = createFileRoute("/korean-drama")({
  head: () => ({ meta: [{ title: "Korean Drama — D4TECH Movies" }] }),
  component: () => <CategoryPage kicker="K-Drama" title="Korean Drama" subtitle="Heart, style and unforgettable stories from Korea." filter={(m) => m.category === "Korean Drama"} />,
});
