import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — D4TECH Movies" }] }),
  component: () => (
    <AppShell>
      <PageHeader kicker="Get in touch" title="Contact us" subtitle="We'd love to hear from you." />
      <div className="mx-auto max-w-5xl px-4 md:px-6 grid md:grid-cols-[1fr_1.4fr] gap-6">
        <div className="space-y-3">
          {[
            { icon: Mail, label: "Email", value: "hello@d4tech.movies" },
            { icon: Phone, label: "Phone", value: "+1 (555) D4-MOVIES" },
            { icon: MessageSquare, label: "Live chat", value: "24/7 in-app support" },
          ].map((c) => (
            <div key={c.label} className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className="grid place-items-center size-11 rounded-full bg-primary/15 text-primary"><c.icon /></div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">{c.label}</div>
                <div className="font-medium">{c.value}</div>
              </div>
            </div>
          ))}
        </div>
        <form className="glass rounded-3xl p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Message sent"); (e.target as HTMLFormElement).reset(); }}>
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Name</Label><Input required placeholder="Your name" className="mt-1" /></div>
            <div><Label>Email</Label><Input type="email" required placeholder="you@d4tech.com" className="mt-1" /></div>
          </div>
          <div><Label>Subject</Label><Input required placeholder="How can we help?" className="mt-1" /></div>
          <div><Label>Message</Label><Textarea required rows={6} placeholder="Tell us more..." className="mt-1" /></div>
          <Button type="submit" className="rounded-full w-full glow-emerald">Send message</Button>
        </form>
      </div>
    </AppShell>
  ),
});
