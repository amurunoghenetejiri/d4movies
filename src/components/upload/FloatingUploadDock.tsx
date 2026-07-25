import { useState } from "react";
import { useUploadManager, formatBytes, formatEta } from "@/lib/upload-manager";
import { Button } from "@/components/ui/button";
import { UploadCloud, ChevronDown, ChevronUp, Pause, Play, X, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingUploadDock() {
  const m = useUploadManager();
  const jobs = m.list();
  const [open, setOpen] = useState(true);

  if (jobs.length === 0) return null;

  const active = jobs.filter((j) => j.status === "uploading" || j.status === "queued");
  const totalPct = active.length
    ? Math.round(active.reduce((a, j) => a + j.progress, 0) / active.length)
    : 100;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-3 md:right-6 z-[60] w-[92vw] max-w-sm">
      <div className="glass-strong rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5"
        >
          <div className="relative">
            <UploadCloud className="size-5 text-primary" />
            {active.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 text-[10px] font-bold bg-gold text-gold-foreground rounded-full h-4 min-w-4 px-1 grid place-items-center">
                {active.length}
              </span>
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold">
              {active.length > 0 ? `Uploading ${active.length} file${active.length > 1 ? "s" : ""}` : "Uploads complete"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {active.length > 0 ? `${totalPct}% overall` : `${jobs.length} recent`}
            </div>
          </div>
          {open ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </button>

        {open && (
          <div className="max-h-[50vh] overflow-y-auto divide-y divide-white/5">
            {jobs.map((j) => (
              <div key={j.id} className="px-4 py-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium truncate flex-1">{j.label ? `${j.label} · ` : ""}{j.name}</div>
                  {j.status === "done" && <CheckCircle2 className="size-4 text-primary shrink-0" />}
                  {j.status === "error" && <AlertCircle className="size-4 text-destructive shrink-0" />}
                </div>
                {(j.status === "uploading" || j.status === "queued" || j.status === "paused") && (
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        j.status === "paused"
                          ? "bg-muted-foreground/50"
                          : "bg-gradient-to-r from-primary to-gold",
                      )}
                      style={{ width: `${j.progress}%` }}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {j.status === "uploading" &&
                      `${j.progress}% · ${formatBytes(j.speed)}/s · ${formatEta(j.eta)}`}
                    {j.status === "queued" && "Queued…"}
                    {j.status === "paused" && `Paused at ${j.progress}%`}
                    {j.status === "done" && `Done · ${formatBytes(j.size)}`}
                    {j.status === "error" && (j.error ?? "Failed")}
                    {j.status === "cancelled" && "Cancelled"}
                  </span>
                  <div className="flex items-center gap-1">
                    {j.status === "uploading" && (
                      <button className="p-1 hover:bg-white/10 rounded" onClick={() => m.pause(j.id)} aria-label="Pause">
                        <Pause className="size-3.5" />
                      </button>
                    )}
                    {j.status === "paused" && j.file && (
                      <button className="p-1 hover:bg-white/10 rounded" onClick={() => m.resume(j.id)} aria-label="Resume">
                        <Play className="size-3.5" />
                      </button>
                    )}
                    {j.status === "error" && j.file && (
                      <button className="p-1 hover:bg-white/10 rounded" onClick={() => m.retry(j.id)} aria-label="Retry">
                        <RefreshCw className="size-3.5" />
                      </button>
                    )}
                    {(j.status === "uploading" || j.status === "queued" || j.status === "paused") && (
                      <button className="p-1 hover:bg-white/10 rounded text-destructive" onClick={() => m.cancel(j.id)} aria-label="Cancel">
                        <X className="size-3.5" />
                      </button>
                    )}
                    {(j.status === "done" || j.status === "cancelled" || j.status === "error") && (
                      <button className="p-1 hover:bg-white/10 rounded" onClick={() => m.remove(j.id)} aria-label="Dismiss">
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {jobs.some((j) => j.status === "done" || j.status === "error" || j.status === "cancelled") && (
              <div className="px-4 py-2">
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => m.clearFinished()}>
                  Clear finished
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
