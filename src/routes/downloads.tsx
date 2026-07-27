import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDownloads, useRemoveDownload } from "@/lib/user-data";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Play, Trash2, FolderOpen, FileVideo } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "Downloads — D4MOVIES" },
      { name: "description", content: "Your downloaded D4MOVIES titles and local device videos." },
      { property: "og:title", content: "Downloads — D4MOVIES" },
      { property: "og:description", content: "Watch downloaded movies and your own local videos, all in D4MOVIES." },
    ],
  }),
  component: Downloads,
});

type LocalVid = { name: string; size: number; url: string; type: string };

function Downloads() {
  const [tab, setTab] = useState<"downloaded" | "local">("downloaded");

  return (
    <AppShell>
      <PageHeader kicker="Library" title="Downloads" subtitle="Your downloaded titles and local device videos." />
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="glass rounded-full p-1 inline-flex mb-4">
          <button
            onClick={() => setTab("downloaded")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === "downloaded" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Downloaded
          </button>
          <button
            onClick={() => setTab("local")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === "local" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Local Videos
          </button>
        </div>
        {tab === "downloaded" ? <DownloadedTab /> : <LocalTab />}
      </div>
    </AppShell>
  );
}

function DownloadedTab() {
  const { user, loading } = useAuth();
  const q = useDownloads();
  const remove = useRemoveDownload();

  if (!loading && !user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-3">Sign in to see your downloads.</p>
        <Button asChild className="rounded-full glow-emerald"><Link to="/login">Sign in</Link></Button>
      </div>
    );
  }
  const items = q.data ?? [];
  return (
    <div className="space-y-3">
      {q.isLoading && <p className="text-center text-muted-foreground py-8">Loading…</p>}
      {items.length === 0 && !q.isLoading && (
        <div className="text-center text-muted-foreground py-16">No downloads yet.</div>
      )}
      {items.map((it) => (
        <div key={it.id} className="glass rounded-2xl p-3 flex gap-3 items-center">
          <img src={it.movie.poster} alt="" className="w-16 h-24 object-cover rounded-lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-semibold truncate">{it.movie.title}</div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold text-gold-foreground font-bold">{it.movie.quality}</span>
            </div>
            <div className="text-xs text-muted-foreground">{it.movie.runtime} • {it.movie.year}</div>
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className={`h-full rounded-full ${it.status === "ready" ? "bg-gold" : "bg-primary"}`} style={{ width: `${it.progress}%` }} />
            </div>
            <div className="text-[11px] mt-1 text-muted-foreground capitalize">{it.status}</div>
          </div>
          <div className="flex flex-col gap-1">
            <Button asChild size="icon" variant="ghost" className="rounded-full">
              <Link to="/watch/$id" params={{ id: it.movie.id }}><Play /></Link>
            </Button>
            <Button size="icon" variant="ghost" onClick={() => remove.mutate(it.id)} className="rounded-full text-destructive"><Trash2 /></Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function LocalTab() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [videos, setVideos] = useState<LocalVid[]>([]);
  const [playing, setPlaying] = useState<LocalVid | null>(null);

  useEffect(() => {
    // We allow file picker fallback on any browser; label "supported" more strictly for directory access.
    setSupported(typeof window !== "undefined");
    return () => {
      // revoke object URLs on unmount
      setVideos((v) => { v.forEach((x) => URL.revokeObjectURL(x.url)); return []; });
    };
  }, []);

  const pickFiles = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "video/*";
      input.multiple = true;
      input.onchange = () => {
        const files = Array.from(input.files ?? []);
        if (!files.length) return;
        const list: LocalVid[] = files
          .filter((f) => f.type.startsWith("video/"))
          .map((f) => ({ name: f.name, size: f.size, url: URL.createObjectURL(f), type: f.type }));
        setVideos((prev) => [...prev, ...list]);
        if (!list.length) toast("No video files selected");
      };
      input.click();
    } catch (e) {
      toast.error("Your browser blocked file access");
    }
  };

  const removeLocal = (u: LocalVid) => {
    URL.revokeObjectURL(u.url);
    setVideos((v) => v.filter((x) => x !== u));
    if (playing === u) setPlaying(null);
  };

  if (supported === null) return null;

  return (
    <div>
      <div className="glass rounded-2xl p-4 mb-4 flex items-center gap-3">
        <FolderOpen className="size-5 text-primary" />
        <div className="flex-1 text-sm">
          <div className="font-medium">Play videos from your device</div>
          <div className="text-xs text-muted-foreground">Pick files from your device to play them right here.</div>
        </div>
        <Button size="sm" className="rounded-full" onClick={pickFiles}>Choose files</Button>
      </div>

      {playing && (
        <div className="glass-strong rounded-2xl overflow-hidden mb-4">
          <video src={playing.url} controls autoPlay playsInline className="w-full max-h-[70vh] bg-black" />
          <div className="p-3 flex items-center justify-between">
            <div className="min-w-0">
              <div className="font-semibold truncate">{playing.name}</div>
              <div className="text-xs text-muted-foreground">{(playing.size / (1024 * 1024)).toFixed(1)} MB</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPlaying(null)}>Close</Button>
          </div>
        </div>
      )}

      {videos.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 text-sm">No local videos loaded yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {videos.map((v) => (
            <button key={v.url} onClick={() => setPlaying(v)} className="glass rounded-2xl overflow-hidden text-left hover:ring-1 hover:ring-primary transition-all">
              <div className="aspect-video bg-black/60 grid place-items-center">
                <FileVideo className="size-8 text-primary" />
              </div>
              <div className="p-2">
                <div className="text-sm font-medium truncate">{v.name}</div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{(v.size / (1024 * 1024)).toFixed(1)} MB</span>
                  <span onClick={(e) => { e.stopPropagation(); removeLocal(v); }} className="text-destructive cursor-pointer">Remove</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
