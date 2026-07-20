import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/movies/CategoryPage";

export const Route = createFileRoute("/hollywood")({
  head: () => ({ meta: [{ title: "Hollywood — D4TECH Movies" }] }),
  component: () => <CategoryPage kicker="USA" title="Hollywood" subtitle="Blockbusters and instant classics." filter={(m) => m.category === "Hollywood"} />,
});
