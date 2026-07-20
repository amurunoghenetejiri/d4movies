import { Link, useRouter } from "@tanstack/react-router";
import { Bell, Search, User, Menu, X, Home, Film, Tv, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Home" },
  { to: "/movies", label: "Movies" },
  { to: "/tv-series", label: "TV Series" },
  { to: "/anime", label: "Anime" },
  { to: "/trending", label: "Trending" },
  { to: "/latest", label: "Latest" },
  { to: "/genres", label: "Genres" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => setOpen(false));
    return unsub;
  }, [router]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-strong" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo size={36} withText />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground [&.active]:text-foreground [&.active]:bg-white/5"
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 md:gap-2">
            <Button asChild variant="ghost" size="icon" className="rounded-full">
              <Link to="/search" aria-label="Search"><Search className="size-5" /></Link>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hidden md:inline-flex" aria-label="Notifications">
              <Bell className="size-5" />
            </Button>
            <Button asChild variant="ghost" size="icon" className="rounded-full hidden md:inline-flex" aria-label="Profile">
              <Link to="/profile"><User className="size-5" /></Link>
            </Button>
            <Button asChild size="sm" className="hidden md:inline-flex rounded-full">
              <Link to="/register">Sign up</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex rounded-full">
              <Link to="/login">Login</Link>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[82%] max-w-sm glass-strong p-5 flex flex-col gap-1 animate-zoom-soft">
            <div className="flex items-center justify-between mb-4">
              <Logo size={36} withText />
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-5" />
              </Button>
            </div>
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="rounded-lg px-3 py-3 text-base hover:bg-white/5">
                {l.label}
              </Link>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button asChild variant="outline"><Link to="/login">Login</Link></Button>
              <Button asChild><Link to="/register">Sign up</Link></Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-3 inset-x-3 z-40 md:hidden">
        <div className="glass-strong flex items-center justify-around rounded-full py-2 px-3 shadow-2xl">
          {[
            { to: "/", label: "Home", icon: Home },
            { to: "/movies", label: "Movies", icon: Film },
            { to: "/tv-series", label: "TV", icon: Tv },
            { to: "/trending", label: "Trend", icon: TrendingUp },
            { to: "/profile", label: "Me", icon: Sparkles },
          ].map((i) => (
            <Link
              key={i.to}
              to={i.to}
              className="flex flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-[10px] text-muted-foreground hover:text-foreground [&.active]:text-primary"
              activeOptions={{ exact: i.to === "/" }}
            >
              <i.icon className="size-5" />
              <span>{i.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
