import { useState } from "react";
import { useUploadManager, formatBytes, formatEta } from "@/lib/upload-manager";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, Pause, Play, RefreshCw, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingUploadDock() {
  const m = useUploadManager();
  const jobs = m.list();
  // Minimized (bubble) by default so it never blocks the UI while you browse.
  const [expanded, setExpanded] = useState(false);

  if (jobs.length === 0) return null;

  const active = jobs.filter((j) => j.status === "uploading" || j.status === "queued");
  const totalPct = active.length
    ? Math.round(active.reduce((a, j) => a + j.progress, 0) / active.length)
    : 100;
  const hasError = jobs.some((j) => j.status === "error");
  const isDone = active.length === 0 && !hasError;

  // Minimized bubble
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        aria-label="Open upload manager"
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[60] size-14 rounded-full glass-strong border border-white/15 shadow-2xl grid place-items-center hover:scale-105 transition-transform"
      >
        {/* Animated ring while uploading */}
        {active.length > 0 && (
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle
              cx="28" cy="28" r="24" fill="none"
              stroke="url(#g)" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${(totalPct / 100) * 150.8} 150.8`}
              className="transition-[stroke-dasharray] duration-500"
            />
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#00C853" />
                <stop offset="1" stopColor="#FFD700" />
              </linearGradient>
            </defs>
          </svg>
        )}
        <div className="relative">
          <UploadCloud
            className={cn(
              "size-6",
              active.length > 0 ? "text-primary animate-pulse" : hasError ? "text-destructive" : "text-primary",
            )}
          />
          {active.length > 0 && (
            <span className="absolute -top-2 -right-3 text-[10px] font-bold bg-gold text-gold-foreground rounded-full h-4 min-w-4 px-1 grid place-items-center">
              {active.length}
            </span>
          )}
          {isDone && (
            <CheckCircle2 className="absolute -bottom-1 -right-1 size-4 text-primary bg-background rounded-full" />
          )}
          {hasError && active.length === 0 && (
            <AlertCircle className="absolute -bottom-1 -right-1 size-4 text-destructive bg-background rounded-full" />
          )}
        </div>
      </button>
    );
  }

  // Expanded manager panel
  return (
    <div className="fixed bottom-24 md:bottom-6 right-3 md:right-6 z-[60] w-[92vw] max-w-sm">
      <div className="glass-strong rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <button
          onClick={() => setExpanded(false)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5"
        >
          <div className="relative">
            <UploadCloud className={cn("size-5", active.length > 0 ? "text-primary animate-pulse" : "text-primary")} />
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
          <ChevronDown className="size-4" />
        </button>

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
      </div>
    </div>
  );
}
