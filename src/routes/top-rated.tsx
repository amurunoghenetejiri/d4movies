import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/movies/CategoryPage";

export const Route = createFileRoute("/top-rated")({
  head: () => ({ meta: [{ title: "Top Rated — D4TECH Movies" }] }),
  component: () => <CategoryPage kicker="Elite" title="Top Rated" subtitle="The highest-rated films on D4TECH." filter={(m) => m.rating >= 8} />,
});
