import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { allCountries, movies } from "@/lib/movies";
import { Globe } from "lucide-react";

export const Route = createFileRoute("/countries")({
  head: () => ({ meta: [{ title: "Countries — D4TECH Movies" }] }),
  component: Countries,
});

function Countries() {
  return (
    <AppShell>
      <PageHeader kicker="World" title="Countries" subtitle="Cinema from every corner of the globe." />
      <div className="mx-auto max-w-7xl px-4 md:px-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allCountries.map((c) => {
          const count = movies.filter((m) => m.country === c).length;
          return (
            <Link to="/search" search={{ q: c }} key={c} className="glass rounded-2xl p-5 hover-lift flex items-center gap-3">
              <div className="grid place-items-center size-12 rounded-full bg-primary/15 text-primary">
                <Globe />
              </div>
              <div>
                <div className="font-semibold">{c}</div>
                <div className="text-xs text-muted-foreground">{count} titles</div>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
