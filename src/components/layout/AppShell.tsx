import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

// Footer removed sitewide per product decision. Keep prop for backwards compatibility.
export function AppShell({ children }: { children: ReactNode; hideFooter?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-28">{children}</main>
    </div>
  );
}
