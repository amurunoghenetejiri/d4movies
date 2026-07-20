import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/movies/CategoryPage";

export const Route = createFileRoute("/latest")({
  head: () => ({ meta: [{ title: "Latest Releases — D4TECH Movies" }] }),
  component: () => <CategoryPage kicker="New" title="Latest Releases" subtitle="Fresh titles added this week." />,
});
