import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/movies/CategoryPage";

export const Route = createFileRoute("/nollywood")({
  head: () => ({ meta: [{ title: "Nollywood — D4TECH Movies" }] }),
  component: () => <CategoryPage kicker="Naija" title="Nollywood" subtitle="Nigerian cinema at its finest." filter={(m) => m.category === "Nollywood"} />,
});
