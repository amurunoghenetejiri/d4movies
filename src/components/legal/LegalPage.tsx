import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import type { ReactNode } from "react";

export function LegalPage({ title, kicker, updated, children }: { title: string; kicker: string; updated: string; children: ReactNode }) {
  return (
    <AppShell>
      <PageHeader kicker={kicker} title={title} subtitle={`Last updated: ${updated}`} />
      <article className="mx-auto max-w-3xl px-4 md:px-6 space-y-5 text-sm md:text-base leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground">
        {children}
      </article>
    </AppShell>
  );
}
