import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Users, Film, Eye, Database, Flag, Star, Pin, EyeOff,
  Trash2, Shield, ShieldOff, Search, TrendingUp, HardDrive, DollarSign,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — D4MOVIES" },
      { name: "description", content: "Manage users, movies, reports, and creator rewards on D4MOVIES." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "movies" | "users" | "reports" | "rewards";

function AdminPage() {
  const { isAdmin, loading, user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (loading) return;
    if (!user) { toast.error("Sign in required"); nav({ to: "/login" }); return; }
    if (!isAdmin) { toast.error("Admin access only"); nav({ to: "/" }); }
  }, [isAdmin, loading, user, nav]);

  if (loading || !isAdmin) {
    return <AppShell><div className="pt-40 text-center text-muted-foreground">Checking access…</div></AppShell>;
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "movies", label: "Movies", icon: Film },
    { id: "users", label: "Users", icon: Users },
    { id: "reports", label: "Reports", icon: Flag },
    { id: "rewards", label: "Rewards", icon: DollarSign },
  ];

  return (
    <AppShell>
      <PageHeader
        kicker="D4TECH Admin"
        title="Admin Dashboard"
        subtitle="Manage the D4MOVIES universe — stats, content, users, reports, and creator payouts."
      />

      <div className="mx-auto max-w-7xl px-4 md:px-6 pb-16">
        {/* Tabs */}
        <div className="glass rounded-2xl p-1.5 flex flex-wrap gap-1 mb-6">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-primary text-primary-foreground glow-emerald" : "hover:bg-white/5 text-foreground/80"
                }`}
              >
                <Icon className="size-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "overview" && <Overview />}
        {tab === "movies" && <MoviesAdmin />}
        {tab === "users" && <UsersAdmin />}
        {tab === "reports" && <ReportsAdmin />}
        {tab === "rewards" && <RewardsAdmin />}
      </div>
    </AppShell>
  );
}

// ---------- Overview ----------
function Overview() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [users, movies, hidden, watchHistory, downloads, media, reports, comments] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("movies").select("id", { count: "exact", head: true }),
        supabase.from("movies").select("id", { count: "exact", head: true }).eq("is_hidden", true),
        supabase.from("watch_history").select("id", { count: "exact", head: true }),
        supabase.from("downloads").select("id", { count: "exact", head: true }),
        supabase.from("media_files").select("file_size"),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("comments").select("id", { count: "exact", head: true }),
      ]);
      const storageBytes = (media.data ?? []).reduce((sum: number, r: any) => sum + (Number(r.file_size) || 0), 0);
      return {
        users: users.count ?? 0,
        movies: movies.count ?? 0,
        hidden: hidden.count ?? 0,
        views: watchHistory.count ?? 0,
        downloads: downloads.count ?? 0,
        storageBytes,
        openReports: reports.count ?? 0,
        comments: comments.count ?? 0,
      };
    },
  });

  const s = stats.data;
  const gb = s ? (s.storageBytes / 1024 / 1024 / 1024).toFixed(2) : "0.00";

  const cards = [
    { label: "Total Users", value: s?.users ?? "—", icon: Users, color: "from-emerald-500/30 to-emerald-500/5" },
    { label: "Total Movies", value: s?.movies ?? "—", icon: Film, color: "from-yellow-500/30 to-yellow-500/5" },
    { label: "Watch Sessions", value: s?.views ?? "—", icon: Eye, color: "from-blue-500/30 to-blue-500/5" },
    { label: "Downloads", value: s?.downloads ?? "—", icon: Database, color: "from-purple-500/30 to-purple-500/5" },
    { label: "Storage Used", value: `${gb} GB`, icon: HardDrive, color: "from-pink-500/30 to-pink-500/5" },
    { label: "Open Reports", value: s?.openReports ?? "—", icon: Flag, color: "from-red-500/30 to-red-500/5" },
    { label: "Hidden Titles", value: s?.hidden ?? "—", icon: EyeOff, color: "from-slate-500/30 to-slate-500/5" },
    { label: "Comments", value: s?.comments ?? "—", icon: Shield, color: "from-teal-500/30 to-teal-500/5" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className={`glass rounded-2xl p-4 md:p-5 relative overflow-hidden bg-gradient-to-br ${c.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">{c.label}</span>
              <Icon className="size-4 text-foreground/60" />
            </div>
            <div className="mt-2 text-2xl md:text-3xl font-bold text-gradient-emerald">
              {stats.isLoading ? "…" : c.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Movies ----------
function MoviesAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const movies = useQuery({
    queryKey: ["admin-movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("id, title, slug, category, release_year, quality, is_hidden, is_pinned, featured, created_by, poster, rating")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase.from("movies").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["admin-movies"] });
      toast.success(`${v.field.replace("is_", "").replace("_", " ")} updated`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      // 1. Fetch media files for storage cleanup
      const { data: media } = await supabase.from("media_files")
        .select("bucket, path").eq("movie_id", id);
      // 2. Remove storage objects grouped by bucket
      const groups = new Map<string, string[]>();
      for (const m of media ?? []) {
        if (!m.bucket || !m.path) continue;
        const arr = groups.get(m.bucket) ?? [];
        arr.push(m.path);
        groups.set(m.bucket, arr);
      }
      for (const [bucket, paths] of groups) {
        await supabase.storage.from(bucket).remove(paths);
      }
      // 3. Delete media file rows (RLS: admin can)
      await supabase.from("media_files").delete().eq("movie_id", id);
      // 4. Delete movie
      const { error } = await supabase.from("movies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-movies"] });
      toast.success("Movie deleted with storage files");
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  const list = useMemo(() => {
    const rows = movies.data ?? [];
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter((r: any) =>
      r.title?.toLowerCase().includes(s) || r.slug?.toLowerCase().includes(s) || r.category?.toLowerCase().includes(s));
  }, [movies.data, q]);

  return (
    <div className="glass rounded-2xl p-3 md:p-5">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles…" className="pl-9 rounded-full bg-white/5" />
        </div>
        <Link to="/upload" className="text-xs rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground glow-emerald">+ Upload New</Link>
      </div>

      <div className="overflow-x-auto -mx-3 md:mx-0">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2 hidden md:table-cell">Category</th>
              <th className="px-3 py-2 hidden sm:table-cell">Year</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.isLoading && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</td></tr>}
            {!movies.isLoading && list.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No movies found.</td></tr>}
            {list.map((m: any) => (
              <tr key={m.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <img src={m.poster || ""} alt="" className="w-10 h-14 rounded-md object-cover bg-white/5" />
                    <div className="min-w-0">
                      <div className="font-semibold truncate max-w-[180px] md:max-w-none">{m.title}</div>
                      <div className="text-xs text-muted-foreground">★ {Number(m.rating || 0).toFixed(1)} • {m.quality}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 hidden md:table-cell text-muted-foreground">{m.category}</td>
                <td className="px-3 py-3 hidden sm:table-cell text-muted-foreground">{m.release_year}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {m.is_hidden && <span className="text-[10px] rounded-full bg-red-500/20 text-red-300 px-2 py-0.5">Hidden</span>}
                    {m.is_pinned && <span className="text-[10px] rounded-full bg-yellow-500/20 text-yellow-300 px-2 py-0.5">Pinned</span>}
                    {m.featured && <span className="text-[10px] rounded-full bg-primary/20 text-primary px-2 py-0.5">Featured</span>}
                    {!m.is_hidden && !m.is_pinned && !m.featured && <span className="text-[10px] text-muted-foreground">Public</span>}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1">
                    <IconAction title={m.is_pinned ? "Unpin" : "Pin"} onClick={() => toggle.mutate({ id: m.id, field: "is_pinned", value: !m.is_pinned })}>
                      <Pin className={`size-4 ${m.is_pinned ? "text-yellow-400" : ""}`} />
                    </IconAction>
                    <IconAction title={m.featured ? "Unfeature" : "Feature"} onClick={() => toggle.mutate({ id: m.id, field: "featured", value: !m.featured })}>
                      <Star className={`size-4 ${m.featured ? "text-primary" : ""}`} />
                    </IconAction>
                    <IconAction title={m.is_hidden ? "Unhide" : "Hide"} onClick={() => toggle.mutate({ id: m.id, field: "is_hidden", value: !m.is_hidden })}>
                      <EyeOff className={`size-4 ${m.is_hidden ? "text-red-400" : ""}`} />
                    </IconAction>
                    <IconAction
                      title="Delete"
                      onClick={() => {
                        if (confirm(`Delete "${m.title}" and all its files? This cannot be undone.`)) del.mutate(m.id);
                      }}
                    >
                      <Trash2 className="size-4 text-red-400" />
                    </IconAction>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-muted-foreground mt-3">Showing {list.length} of {movies.data?.length ?? 0} titles</div>
    </div>
  );
}

// ---------- Users ----------
function UsersAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, email, avatar_url, subscription_status, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const roleMap = new Map<string, string[]>();
      for (const r of roles ?? []) {
        const arr = roleMap.get(r.user_id) ?? [];
        arr.push(r.role);
        roleMap.set(r.user_id, arr);
      }
      return (profiles ?? []).map((p: any) => ({ ...p, roles: roleMap.get(p.id) ?? ["user"] }));
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role, grant }: { userId: string; role: "admin" | "moderator"; grant: boolean }) => {
      if (grant) {
        const { error } = await supabase.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Role updated"); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const setStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase.from("profiles").update({ subscription_status: status }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Status updated"); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const list = useMemo(() => {
    const rows = users.data ?? [];
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter((u: any) =>
      u.email?.toLowerCase().includes(s) || u.full_name?.toLowerCase().includes(s) || u.username?.toLowerCase().includes(s));
  }, [users.data, q]);

  return (
    <div className="glass rounded-2xl p-3 md:p-5">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="pl-9 rounded-full bg-white/5" />
      </div>
      <div className="overflow-x-auto -mx-3 md:mx-0">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2 hidden sm:table-cell">Status</th>
              <th className="px-3 py-2">Roles</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.isLoading && <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Loading…</td></tr>}
            {list.map((u: any) => {
              const isAdminU = u.roles.includes("admin");
              const isMod = u.roles.includes("moderator");
              const suspended = u.subscription_status === "suspended" || u.subscription_status === "banned";
              return (
                <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar_url || ""} alt="" className="size-9 rounded-full bg-white/10 object-cover" />
                      <div className="min-w-0">
                        <div className="font-semibold truncate max-w-[160px] md:max-w-none">{u.full_name || u.username || "User"}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[160px] md:max-w-none">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <span className={`text-[10px] rounded-full px-2 py-0.5 ${
                      suspended ? "bg-red-500/20 text-red-300" :
                      u.subscription_status === "premium" ? "bg-yellow-500/20 text-yellow-300" :
                      "bg-white/5 text-muted-foreground"
                    }`}>{u.subscription_status}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {isAdminU && <span className="text-[10px] rounded-full bg-primary/20 text-primary px-2 py-0.5">admin</span>}
                      {isMod && <span className="text-[10px] rounded-full bg-blue-500/20 text-blue-300 px-2 py-0.5">mod</span>}
                      {!isAdminU && !isMod && <span className="text-[10px] text-muted-foreground">user</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1 flex-wrap">
                      <IconAction title={isMod ? "Remove Moderator" : "Make Moderator"} onClick={() => setRole.mutate({ userId: u.id, role: "moderator", grant: !isMod })}>
                        {isMod ? <ShieldOff className="size-4 text-blue-400" /> : <Shield className="size-4" />}
                      </IconAction>
                      <IconAction title={isAdminU ? "Revoke Admin" : "Grant Admin"} onClick={() => setRole.mutate({ userId: u.id, role: "admin", grant: !isAdminU })}>
                        <Shield className={`size-4 ${isAdminU ? "text-primary" : ""}`} />
                      </IconAction>
                      <IconAction title={suspended ? "Reinstate" : "Suspend"} onClick={() => setStatus.mutate({ userId: u.id, status: suspended ? "free" : "suspended" })}>
                        <EyeOff className={`size-4 ${suspended ? "text-red-400" : ""}`} />
                      </IconAction>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Reports ----------
function ReportsAdmin() {
  const qc = useQueryClient();
  const reports = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id, target_type, target_id, reason, status, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("reports").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reports"] }); toast.success("Report updated"); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="glass rounded-2xl p-3 md:p-5">
      {reports.isLoading && <div className="py-8 text-center text-muted-foreground">Loading…</div>}
      {!reports.isLoading && (reports.data?.length ?? 0) === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <Flag className="mx-auto size-8 mb-3 opacity-50" />
          No reports yet. Everything's clean.
        </div>
      )}
      <div className="space-y-2">
        {(reports.data ?? []).map((r: any) => (
          <div key={r.id} className="flex flex-wrap items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-white/10 px-2 py-0.5">{r.target_type}</span>
                <span>{new Date(r.created_at).toLocaleString()}</span>
                <span className={`rounded-full px-2 py-0.5 ${
                  r.status === "open" ? "bg-red-500/20 text-red-300" :
                  r.status === "resolved" ? "bg-emerald-500/20 text-emerald-300" :
                  "bg-white/5"
                }`}>{r.status}</span>
              </div>
              <div className="mt-1 text-sm font-medium">{r.reason}</div>
              <div className="text-[11px] text-muted-foreground mt-1 font-mono truncate">Target: {r.target_id}</div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="rounded-full text-xs" onClick={() => setStatus.mutate({ id: r.id, status: "resolved" })}>Resolve</Button>
              <Button size="sm" variant="ghost" className="rounded-full text-xs" onClick={() => setStatus.mutate({ id: r.id, status: "dismissed" })}>Dismiss</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Rewards ----------
function RewardsAdmin() {
  const rewards = useQuery({
    queryKey: ["admin-rewards"],
    queryFn: async () => {
      // Points = 0.1 per upload; 200 pts = ₦2,000; min withdrawal ₦10,000 (=1,000 pts)
      const [{ data: uploaders }, { data: profiles }] = await Promise.all([
        supabase.from("movies").select("created_by").not("created_by", "is", null),
        supabase.from("profiles").select("id, full_name, username, email, avatar_url"),
      ]);
      const counts = new Map<string, number>();
      for (const u of uploaders ?? []) {
        if (!u.created_by) continue;
        counts.set(u.created_by, (counts.get(u.created_by) ?? 0) + 1);
      }
      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const rows = Array.from(counts.entries()).map(([id, uploads]) => {
        const points = +(uploads * 0.1).toFixed(2);
        const naira = Math.floor(points * 10); // 200pts=₦2000 → 1pt=₦10
        return { profile: profileMap.get(id), uploads, points, naira, eligible: naira >= 10000 };
      }).sort((a, b) => b.points - a.points);
      return rows;
    },
  });

  const totalNaira = (rewards.data ?? []).reduce((s, r) => s + r.naira, 0);
  const totalPoints = (rewards.data ?? []).reduce((s, r) => s + r.points, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Points" value={totalPoints.toFixed(1)} />
        <StatCard label="Total Owed" value={`₦${totalNaira.toLocaleString()}`} />
        <StatCard label="Eligible Creators" value={(rewards.data ?? []).filter(r => r.eligible).length} />
      </div>
      <div className="glass rounded-2xl p-3 md:p-5">
        <div className="text-xs text-muted-foreground mb-3">
          <span className="text-gradient-emerald font-semibold">Formula:</span> 0.1 pt per upload • 200 pts = ₦2,000 • Min payout ₦10,000
        </div>
        <div className="overflow-x-auto -mx-3 md:mx-0">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Creator</th>
                <th className="px-3 py-2">Uploads</th>
                <th className="px-3 py-2">Points</th>
                <th className="px-3 py-2">Balance</th>
                <th className="px-3 py-2 text-right">Payout</th>
              </tr>
            </thead>
            <tbody>
              {rewards.isLoading && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!rewards.isLoading && (rewards.data?.length ?? 0) === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No creator uploads yet.</td></tr>
              )}
              {(rewards.data ?? []).map((r, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <img src={r.profile?.avatar_url || ""} alt="" className="size-9 rounded-full bg-white/10 object-cover" />
                      <div className="min-w-0">
                        <div className="font-semibold truncate max-w-[160px]">{r.profile?.full_name || r.profile?.username || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[160px]">{r.profile?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">{r.uploads}</td>
                  <td className="px-3 py-3 text-gradient-emerald font-semibold">{r.points}</td>
                  <td className="px-3 py-3 text-gradient-gold font-semibold">₦{r.naira.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right">
                    <Button
                      size="sm"
                      disabled={!r.eligible}
                      onClick={() => toast.success(`Payout of ₦${r.naira.toLocaleString()} marked as processed`)}
                      className="rounded-full text-xs"
                    >
                      {r.eligible ? "Approve" : "Below Min"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- Helpers ----------
function IconAction({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="size-8 grid place-items-center rounded-full hover:bg-white/10 transition"
    >
      {children}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl md:text-2xl font-bold text-gradient-emerald">{value}</div>
    </div>
  );
}
