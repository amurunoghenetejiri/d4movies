import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/movies/CategoryPage";

export const Route = createFileRoute("/coming-soon")({
  head: () => ({ meta: [{ title: "Coming Soon — D4TECH Movies" }] }),
  component: () => <CategoryPage kicker="Preview" title="Coming Soon" subtitle="Get ready — these premieres are on the way." filter={(m) => !!m.comingSoon || m.year >= 2025} />,
});
