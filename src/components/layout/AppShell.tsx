import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function AppShell({ children, hideFooter = false }: { children: ReactNode; hideFooter?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-28 md:pb-0">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
