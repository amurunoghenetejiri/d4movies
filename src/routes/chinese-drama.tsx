import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/movies/CategoryPage";

export const Route = createFileRoute("/chinese-drama")({
  head: () => ({ meta: [{ title: "Chinese Drama — D4TECH Movies" }] }),
  component: () => <CategoryPage kicker="C-Drama" title="Chinese Drama" subtitle="Historical epics and modern romance from China." filter={(m) => m.category === "Chinese Drama"} />,
});
