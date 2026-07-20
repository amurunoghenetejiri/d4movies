import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Do I need to create an account to watch?", a: "No — you can browse, search, watch demos and download without signing up. An account unlocks watchlists, favorites and personalized recommendations." },
  { q: "What quality can I stream in?", a: "D4TECH streams in HD, Full HD and 4K where available. Quality auto-adjusts to your connection unless you set a preference in Settings." },
  { q: "Which regions are covered?", a: "Hollywood, Nollywood, Bollywood, Korean drama, Chinese drama and anime — plus curated TV series from around the world." },
  { q: "Can I download movies to watch offline?", a: "Yes, downloads are supported in the Downloads section. Full offline library sync ships in Phase 2." },
  { q: "How much does D4TECH cost?", a: "Phase 1 is completely free to explore. Subscription tiers arrive in a future phase." },
  { q: "Do you support subtitles and multiple audio tracks?", a: "Yes — pick your preferred subtitle language and audio track from the player controls or in Settings." },
];

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — D4TECH Movies" }] }),
  component: () => (
    <AppShell>
      <PageHeader kicker="Help" title="Frequently asked questions" />
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <div className="glass rounded-2xl p-2">
          <Accordion type="single" collapsible>
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={String(i)} className="border-none">
                <AccordionTrigger className="px-4 text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="px-4 text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </AppShell>
  ),
});
