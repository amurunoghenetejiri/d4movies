import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications, useMarkNotificationRead } from "@/lib/user-data";
import { Bell, Info, LifeBuoy, Mail, ShieldCheck, FileText, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — D4TECH Movies" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [prefs, setPrefs] = useState({
    darkMode: true, autoPlay: true, notifications: true, subtitles: true, hd: true, privacy: false, twoFA: false,
  });
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const notifQ = useNotifications();
  const markRead = useMarkNotificationRead();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("d4tech-prefs");
    if (saved) try { setPrefs(JSON.parse(saved)); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setUsername(profile.username ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const savePref = (k: keyof typeof prefs) => (v: boolean) => {
    setPrefs((s) => {
      const next = { ...s, [k]: v };
      localStorage.setItem("d4tech-prefs", JSON.stringify(next));
      return next;
    });
    toast("Updated");
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, username, phone })
      .eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success("Profile saved");
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("profile-images").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error(error.message); return; }
    const { data: signed, error: signErr } = await supabase.storage
      .from("profile-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signErr || !signed?.signedUrl) { toast.error(signErr?.message ?? "Failed to publish avatar"); return; }
    await supabase.from("profiles").update({ avatar_url: signed.signedUrl }).eq("id", user.id);
    await supabase.from("media_files").insert({
      user_id: user.id, bucket: "profile-images", path, url: signed.signedUrl,
      file_name: file.name, file_size: file.size, file_type: file.type, kind: "avatar",
    });
    await refreshProfile();
    toast.success("Avatar updated");
  };

  const deleteAccount = async () => {
    if (!user) return;
    if (!window.confirm("This will sign you out and delete your local session. Proceed?")) return;
    await supabase.auth.signOut();
    toast("Signed out. Contact support to fully delete your account.");
    nav({ to: "/" });
  };

  if (!loading && !user) {
    return (
      <AppShell>
        <PageHeader kicker="Account" title="Settings" subtitle="Sign in to manage your account." />
        <div className="text-center py-8">
          <Button asChild className="rounded-full glow-emerald"><Link to="/login">Sign in</Link></Button>
        </div>
      </AppShell>
    );
  }

  const notifs = notifQ.data ?? [];
  const unread = notifs.filter((n: any) => !n.read).length;

  return (
    <AppShell>
      <PageHeader kicker="Account" title="Settings" subtitle="Fine-tune your D4TECH experience." />
      <div className="mx-auto max-w-3xl px-4 md:px-6 space-y-4 pb-24">
        <Section title="Profile">
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full bg-gradient-to-br from-primary to-gold grid place-items-center overflow-hidden">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="size-full object-cover" />
                  : <span className="text-2xl font-bold text-primary-foreground">{(fullName || user?.email || "D4")[0]?.toUpperCase()}</span>}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                <Button variant="outline" className="rounded-full" onClick={() => fileRef.current?.click()}>Change avatar</Button>
              </div>
            </div>
            <div><Label>Full name</Label><Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div><Label>Username</Label><Input className="mt-1" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
            <div><Label>Phone</Label><Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" /></div>
            <Button className="rounded-full" onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
          </div>
        </Section>

        <Section title="Playback">
          <Row label="Auto Play next episode" v={prefs.autoPlay} on={savePref("autoPlay")} />
          <Row label="Prefer HD/4K quality" v={prefs.hd} on={savePref("hd")} />
          <Row label="Subtitles on by default" v={prefs.subtitles} on={savePref("subtitles")} />
        </Section>

        <Section title="Appearance">
          <Row label="Dark mode" v={prefs.darkMode} on={savePref("darkMode")} />
        </Section>

        <Section title={`Notifications${unread ? ` · ${unread} new` : ""}`}>
          <Row label="Push notifications" v={prefs.notifications} on={savePref("notifications")} />
          <div className="px-5 py-3 space-y-2 max-h-72 overflow-y-auto">
            {notifs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">You're all caught up.</p>
            )}
            {notifs.map((n: any) => (
              <button
                key={n.id}
                onClick={() => markRead.mutate(n.id)}
                className={`w-full text-left rounded-xl p-3 hover:bg-white/5 border border-white/5 ${n.read ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="size-4 text-primary shrink-0" />
                  <div className="text-sm font-semibold flex-1 truncate">{n.title}</div>
                  {!n.read && <span className="size-2 rounded-full bg-primary shrink-0" />}
                </div>
                {n.body && <div className="text-xs text-muted-foreground mt-1">{n.body}</div>}
                <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Privacy & Security">
          <Row label="Private profile" v={prefs.privacy} on={savePref("privacy")} />
          <Row label="Two-factor authentication" v={prefs.twoFA} on={savePref("twoFA")} />
          <div className="px-5 py-3">
            <Button variant="destructive" className="rounded-full" onClick={deleteAccount}>Sign out & clear session</Button>
          </div>
        </Section>

        <Section title="More">
          <LinkRow to="/about" icon={Info} label="About D4MOVIES" />
          <LinkRow to="/contact" icon={Mail} label="Contact us" />
          <LinkRow to="/support" icon={LifeBuoy} label="Support" />
          <LinkRow to="/privacy" icon={ShieldCheck} label="Privacy Policy" />
          <LinkRow to="/terms" icon={FileText} label="Terms of Service" />
          <LinkRow to="/dmca" icon={FileText} label="DMCA Policy" />
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
function LinkRow({ to, icon: Icon, label }: { to: any; icon: any; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 text-sm">
      <Icon className="size-4 text-primary" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
