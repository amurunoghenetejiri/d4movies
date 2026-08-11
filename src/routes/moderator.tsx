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
  Users, Film, Flag, EyeOff, Pin, Star, Search, TrendingUp,
  MessageSquare, Shield, Trash2, History, Eye,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/moderator")({
  head: () => ({
    meta: [
      { title: "Moderator Dashboard — D4MOVIES" },
      { name: "description", content: "Moderate content, reports, comments, and users on D4MOVIES." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ModeratorPage,
});

type Tab = "overview" | "reports" | "movies" | "comments" | "users" | "actions";

async function logModAction(
  moderatorId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>,
) {
  try {
    await supabase.from("mod_actions" as any).insert({
      moderator_id: moderatorId,
      action,
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      details: details ?? {},
    });
  } catch {
    /* non-blocking */
  }
}

function ModeratorPage() {
  const { isModerator, isAdmin, loading, user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      toast.error("Sign in required");
      nav({ to: "/login" });
      return;
    }
    if (!isModerator) {
      toast.error("Moderator access only");
      nav({ to: "/" });
    }
  }, [isModerator, loading, user, nav]);

  if (loading || !isModerator) {
    return (
      <AppShell>
        <div className="pt-40 text-center text-muted-foreground">Checking access…</div>
      </AppShell>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "reports", label: "Reports", icon: Flag },
    { id: "movies", label: "Content", icon: Film },
    { id: "comments", label: "Comments", icon: MessageSquare },
    { id: "users", label: "Users", icon: Users },
    { id: "actions", label: "My actions", icon: History },
  ];

  return (
    <AppShell>
      <PageHeader
        kicker="D4TECH Moderator"
        title="Moderator Dashboard"
        subtitle="Review reports, moderate content & comments, and keep the community safe."
      />

      <div className="mx-auto max-w-7xl px-4 md:px-6 pb-16">
        {isAdmin && (
          <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2">
            <span>You also have admin access.</span>
            <Link to="/admin" className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
              Open Admin Dashboard
            </Link>
          </div>
        )}

        <div className="glass rounded-2xl p-1.5 flex flex-wrap gap-1 mb-6">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-primary text-primary-foreground glow-emerald"
                    : "hover:bg-white/5 text-foreground/80"
                }`}
              >
                <Icon className="size-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "overview" && <Overview />}
        {tab === "reports" && <ReportsMod userId={user!.id} />}
        {tab === "movies" && <MoviesMod userId={user!.id} />}
        {tab === "comments" && <CommentsMod userId={user!.id} />}
        {tab === "users" && <UsersMod userId={user!.id} />}
        {tab === "actions" && <ActionsMod userId={user!.id} />}
      </div>
    </AppShell>
  );
}

function Overview() {
  const stats = useQuery({
    queryKey: ["mod-stats"],
    queryFn: async () => {
      const [openReports, hidden, movies, comments] = await Promise.all([
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("movies").select("id", { count: "exact", head: true }).eq("is_hidden", true),
        supabase.from("movies").select("id", { count: "exact", head: true }),
        supabase.from("comments").select("id", { count: "exact", head: true }),
      ]);
      return {
        openReports: openReports.count ?? 0,
        hidden: hidden.count ?? 0,
        movies: movies.count ?? 0,
        comments: comments.count ?? 0,
      };
    },
  });

  const s = stats.data;
  const cards = [
    { label: "Open Reports", value: s?.openReports ?? "—", icon: Flag, color: "from-red-500/30 to-red-500/5" },
    { label: "Hidden Titles", value: s?.hidden ?? "—", icon: EyeOff, color: "from-slate-500/30 to-slate-500/5" },
    { label: "Total Movies", value: s?.movies ?? "—", icon: Film, color: "from-yellow-500/30 to-yellow-500/5" },
    { label: "Comments", value: s?.comments ?? "—", icon: MessageSquare, color: "from-teal-500/30 to-teal-500/5" },
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

function ReportsMod({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const reports = useQuery({
    queryKey: ["mod-reports"],
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
      await logModAction(userId, `report_${status}`, "report", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mod-reports"] });
      qc.invalidateQueries({ queryKey: ["mod-stats"] });
      toast.success("Report updated");
    },
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span className="rounded-full bg-white/10 px-2 py-0.5">{r.target_type}</span>
                <span>{new Date(r.created_at).toLocaleString()}</span>
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    r.status === "open"
                      ? "bg-red-500/20 text-red-300"
                      : r.status === "resolved"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-white/5"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <div className="mt-1 text-sm font-medium">{r.reason}</div>
              <div className="text-[11px] text-muted-foreground mt-1 font-mono truncate">Target: {r.target_id}</div>
            </div>
            {r.status === "open" && (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="rounded-full text-xs" onClick={() => setStatus.mutate({ id: r.id, status: "resolved" })}>
                  Resolve
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full text-xs" onClick={() => setStatus.mutate({ id: r.id, status: "dismissed" })}>
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MoviesMod({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const movies = useQuery({
    queryKey: ["mod-movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("id, title, slug, category, release_year, quality, is_hidden, is_pinned, featured, poster, rating")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase.from("movies").update({ [field]: value } as any).eq("id", id);
      if (error) throw error;
      await logModAction(userId, `movie_${field}_${value ? "on" : "off"}`, "movie", id, { field, value });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mod-movies"] });
      qc.invalidateQueries({ queryKey: ["mod-stats"] });
      toast.success("Content updated");
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  const list = useMemo(() => {
    const rows = movies.data ?? [];
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter(
      (r: any) =>
        r.title?.toLowerCase().includes(s) ||
        r.slug?.toLowerCase().includes(s) ||
        r.category?.toLowerCase().includes(s),
    );
  }, [movies.data, q]);

  return (
    <div className="glass rounded-2xl p-3 md:p-5">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles…" className="pl-9 rounded-full bg-white/5" />
      </div>
      <div className="overflow-x-auto -mx-3 md:mx-0">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2 hidden md:table-cell">Category</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.isLoading && (
              <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
            )}
            {!movies.isLoading && list.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No movies found.</td></tr>
            )}
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
                      {m.is_hidden ? <Eye className="size-4 text-red-400" /> : <EyeOff className="size-4" />}
                    </IconAction>
                    <Link to="/movie/$id" params={{ id: m.id }} className="size-8 grid place-items-center rounded-full hover:bg-white/10 text-xs text-muted-foreground">
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Moderators can hide, pin, and feature content. Hard delete is reserved for admins when possible.
      </p>
    </div>
  );
}

function CommentsMod({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const comments = useQuery({
    queryKey: ["mod-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, content, created_at, user_id, movie_id")
        .order("created_at", { ascending: false })
        .limit(150);
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
      await logModAction(userId, "comment_delete", "comment", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mod-comments"] });
      qc.invalidateQueries({ queryKey: ["mod-stats"] });
      toast.success("Comment removed");
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  return (
    <div className="glass rounded-2xl p-3 md:p-5 space-y-2">
      {comments.isLoading && <div className="py-8 text-center text-muted-foreground">Loading…</div>}
      {!comments.isLoading && (comments.data?.length ?? 0) === 0 && (
        <div className="py-16 text-center text-muted-foreground">No comments yet.</div>
      )}
      {(comments.data ?? []).map((c: any) => (
        <div key={c.id} className="flex flex-wrap items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
            <div className="mt-1 text-sm">{c.content}</div>
            <div className="text-[11px] text-muted-foreground mt-1 font-mono truncate">
              user: {c.user_id} · movie: {c.movie_id}
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full text-xs text-red-300"
            onClick={() => {
              if (confirm("Delete this comment?")) del.mutate(c.id);
            }}
          >
            <Trash2 className="size-3.5 mr-1" /> Delete
          </Button>
        </div>
      ))}
    </div>
  );
}

function UsersMod({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const users = useQuery({
    queryKey: ["mod-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, username, email, avatar_url, subscription_status, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
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

  const setStatus = useMutation({
    mutationFn: async ({ targetId, status }: { targetId: string; status: string }) => {
      const { error } = await supabase.from("profiles").update({ subscription_status: status }).eq("id", targetId);
      if (error) throw error;
      await logModAction(userId, status === "suspended" ? "user_suspend" : "user_reinstate", "user", targetId, { status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mod-users"] });
      toast.success("User status updated");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const list = useMemo(() => {
    const rows = users.data ?? [];
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter(
      (u: any) =>
        u.email?.toLowerCase().includes(s) ||
        u.full_name?.toLowerCase().includes(s) ||
        u.username?.toLowerCase().includes(s),
    );
  }, [users.data, q]);

  return (
    <div className="glass rounded-2xl p-3 md:p-5">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="pl-9 rounded-full bg-white/5" />
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Moderators can suspend or reinstate users. Promoting to admin/mod is admin-only.
      </p>
      <div className="overflow-x-auto -mx-3 md:mx-0">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Roles</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.isLoading && (
              <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
            )}
            {list.map((u: any) => {
              const suspended = u.subscription_status === "suspended" || u.subscription_status === "banned";
              const isStaff = u.roles.includes("admin") || u.roles.includes("moderator");
              return (
                <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar_url || ""} alt="" className="size-9 rounded-full bg-white/10 object-cover" />
                      <div className="min-w-0">
                        <div className="font-semibold truncate max-w-[160px]">{u.full_name || u.username || "User"}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[160px]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`text-[10px] rounded-full px-2 py-0.5 ${
                        suspended ? "bg-red-500/20 text-red-300" : "bg-white/5 text-muted-foreground"
                      }`}
                    >
                      {u.subscription_status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.includes("admin") && (
                        <span className="text-[10px] rounded-full bg-primary/20 text-primary px-2 py-0.5">admin</span>
                      )}
                      {u.roles.includes("moderator") && (
                        <span className="text-[10px] rounded-full bg-blue-500/20 text-blue-300 px-2 py-0.5">mod</span>
                      )}
                      {!isStaff && <span className="text-[10px] text-muted-foreground">user</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {!isStaff && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-xs"
                        onClick={() =>
                          setStatus.mutate({
                            targetId: u.id,
                            status: suspended ? "free" : "suspended",
                          })
                        }
                      >
                        {suspended ? "Reinstate" : "Suspend"}
                      </Button>
                    )}
                    {isStaff && <span className="text-xs text-muted-foreground">Protected</span>}
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

function ActionsMod({ userId }: { userId: string }) {
  const actions = useQuery({
    queryKey: ["mod-actions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mod_actions" as any)
        .select("id, action, target_type, target_id, details, created_at")
        .eq("moderator_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });

  return (
    <div className="glass rounded-2xl p-3 md:p-5 space-y-2">
      {actions.isLoading && <div className="py-8 text-center text-muted-foreground">Loading…</div>}
      {!actions.isLoading && (actions.data?.length ?? 0) === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <Shield className="mx-auto size-8 mb-3 opacity-50" />
          No actions logged yet. Your moderation work will appear here.
        </div>
      )}
      {(actions.data ?? []).map((a: any) => (
        <div key={a.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-white/10 px-2 py-0.5 font-medium text-foreground">{a.action}</span>
            {a.target_type && <span>{a.target_type}</span>}
            <span className="ml-auto">{new Date(a.created_at).toLocaleString()}</span>
          </div>
          {a.target_id && (
            <div className="mt-1 text-[11px] font-mono text-muted-foreground truncate">{a.target_id}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function IconAction({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} className="size-8 grid place-items-center rounded-full hover:bg-white/10 transition">
      {children}
    </button>
  );
}
