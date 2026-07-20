import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Logo } from "@/components/brand/Logo";
import { Film, Globe, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — D4TECH Movies" }, { name: "description", content: "The story behind D4TECH Movies." }] }),
  component: () => (
    <AppShell>
      <PageHeader kicker="Our Story" title="About D4TECH Movies" subtitle="A premium streaming home built for movie lovers everywhere." />
      <div className="mx-auto max-w-4xl px-4 md:px-6 space-y-8">
        <div className="glass rounded-3xl p-8 text-center">
          <Logo size={96} glow />
          <p className="mt-4 text-lg text-muted-foreground">
            D4TECH Movies brings together Hollywood, Nollywood, Bollywood, K-drama, C-drama and anime — all in one beautifully crafted streaming experience.
          </p>
          <div className="mt-2 text-sm tracking-[0.35em] uppercase">
            <span>Stream. </span><span className="text-gradient-gold">Discover. </span><span>Enjoy.</span>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: Film, title: "Cinematic quality", body: "HD & 4K streaming with premium audio for every title." },
            { icon: Globe, title: "Global cinema", body: "Curated collections from every corner of the world." },
            { icon: Sparkles, title: "Discovery-first", body: "Smart recommendations that feel personal, not algorithmic." },
            { icon: ShieldCheck, title: "Yours, safely", body: "Privacy-first design with modern security you can trust." },
          ].map((c) => (
            <div key={c.title} className="glass rounded-2xl p-5">
              <c.icon className="size-6 text-primary" />
              <h3 className="mt-3 font-semibold">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  ),
});
