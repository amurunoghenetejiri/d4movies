import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LifeBuoy, MessageSquare, Mail, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support — D4TECH Movies" }] }),
  component: () => (
    <AppShell>
      <PageHeader kicker="Help" title="Support Center" subtitle="We're here 24/7. Choose the channel that suits you best." />
      <div className="mx-auto max-w-5xl px-4 md:px-6 grid md:grid-cols-2 gap-4">
        {[
          { icon: HelpCircle, title: "Browse FAQ", body: "Answers to the most common questions.", to: "/faq" as const },
          { icon: MessageSquare, title: "Live chat", body: "Chat with a support agent in real time.", to: "/contact" as const },
          { icon: Mail, title: "Email us", body: "hello@d4tech.movies — replies within 24 hours.", to: "/contact" as const },
          { icon: LifeBuoy, title: "Troubleshooting", body: "Fix playback, downloads and account issues.", to: "/faq" as const },
        ].map((c) => (
          <Link key={c.title} to={c.to} className="glass rounded-2xl p-6 hover-lift">
            <c.icon className="size-6 text-primary" />
            <h3 className="mt-3 font-semibold">{c.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{c.body}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  ),
});
