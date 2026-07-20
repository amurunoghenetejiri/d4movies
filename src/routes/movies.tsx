import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/movies/CategoryPage";

export const Route = createFileRoute("/movies")({
  head: () => ({ meta: [{ title: "All Movies — D4TECH Movies" }, { name: "description", content: "Browse every movie on D4TECH Movies." }] }),
  component: () => <CategoryPage kicker="Library" title="All Movies" subtitle="Every title on D4TECH — browse, filter and press play." />,
});
