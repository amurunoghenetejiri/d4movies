import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — D4TECH Movies" }] }),
  component: Settings,
});

function Settings() {
  const [state, setState] = useState({
    darkMode: true, autoPlay: true, notifications: true, subtitles: true, hd: true, privacy: false, twoFA: false,
  });
  const T = (k: keyof typeof state) => (v: boolean) => { setState((s) => ({ ...s, [k]: v })); toast(`Updated ${k}`); };

  return (
    <AppShell>
      <PageHeader kicker="Account" title="Settings" subtitle="Fine-tune your D4TECH experience." />
      <div className="mx-auto max-w-3xl px-4 md:px-6 space-y-4">
        <Section title="Playback">
          <Row label="Auto Play next episode" v={state.autoPlay} on={T("autoPlay")} />
          <Row label="Prefer HD/4K quality" v={state.hd} on={T("hd")} />
          <Row label="Subtitles on by default" v={state.subtitles} on={T("subtitles")} />
          <SelectRow label="Playback quality" options={["Auto", "4K", "FHD", "HD", "SD"]} />
          <SelectRow label="Preferred language" options={["English", "Spanish", "French", "Hindi", "Korean", "Japanese", "Mandarin"]} />
        </Section>
        <Section title="Appearance">
          <Row label="Dark mode" v={state.darkMode} on={T("darkMode")} />
          <SelectRow label="Interface language" options={["English", "Français", "Español", "日本語", "한국어"]} />
        </Section>
        <Section title="Notifications">
          <Row label="Push notifications" v={state.notifications} on={T("notifications")} />
        </Section>
        <Section title="Privacy & Security">
          <Row label="Private profile" v={state.privacy} on={T("privacy")} />
          <Row label="Two-factor authentication" v={state.twoFA} on={T("twoFA")} />
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground border-b border-border">{title}</div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}
function Row({ label, v, on }: { label: string; v: boolean; on: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <Label className="text-sm">{label}</Label>
      <Switch checked={v} onCheckedChange={on} />
    </div>
  );
}
function SelectRow({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <Label className="text-sm">{label}</Label>
      <select className="bg-transparent text-sm border border-border rounded-full px-3 py-1.5">
        {options.map((o) => <option key={o} className="bg-background">{o}</option>)}
      </select>
    </div>
  );
}
