import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import type { ReactNode } from "react";

export function AuthLayout({ title, subtitle, children, foot }: { title: string; subtitle?: string; children: ReactNode; foot?: ReactNode }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative overflow-hidden">
        <img src="https://picsum.photos/seed/d4-auth/1200/1600" alt="" className="absolute inset-0 h-full w-full object-cover scale-105" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/70 to-primary/30" />
        <div className="absolute inset-0 p-10 flex flex-col justify-between">
          <Link to="/"><Logo size={56} withText glow /></Link>
          <div className="max-w-md">
            <h2 className="text-3xl font-bold leading-tight">
              <span className="text-gradient-emerald">A cinema in your pocket.</span>
            </h2>
            <p className="mt-3 text-muted-foreground">Stream unlimited movies, series, anime and world dramas in stunning HD & 4K.</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="md:hidden mb-6 flex justify-center"><Link to="/"><Logo size={72} withText glow /></Link></div>
          <h1 className="text-3xl font-bold"><span className="text-gradient-emerald">{title}</span></h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {foot && <div className="mt-6 text-sm text-muted-foreground">{foot}</div>}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_auth-layout")({ component: () => null });
