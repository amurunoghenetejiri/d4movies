import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Search, User, Menu, X, Home, Film, Tv, UserCircle, TrendingUp, LogOut, Settings as SettingsIcon, Shield, Heart, Bookmark, Clock, Download, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const nav = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => { setOpen(false); setMenuOpen(false); });
    return unsub;
  }, [router]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const doSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    nav({ to: "/" });
  };

  const initials = (profile?.full_name ?? profile?.username ?? user?.email ?? "D4")[0]?.toUpperCase();

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-strong" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-12 md:h-14 max-w-7xl items-center justify-between gap-3 px-3 md:px-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo size={87} className="md:hidden" />
            <Logo size={140} className="hidden md:flex" />
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
            {/* Search */}
            <Button asChild variant="ghost" size="icon" className="rounded-full">
              <Link to="/search" aria-label="Search"><Search className="size-5" /></Link>
            </Button>

            {/* Profile */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="size-7 rounded-full bg-gradient-to-br from-primary to-gold grid place-items-center text-sm font-bold text-primary-foreground"
                  aria-label="Account"
                >
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="size-full rounded-full object-cover" />
                    : initials}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-12 w-64 glass-strong rounded-2xl p-2 z-[70]">
                    <div className="px-3 py-2">
                      <div className="font-semibold text-sm truncate">{profile?.full_name ?? profile?.username ?? "D4TECH User"}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    </div>
                    <div className="h-px bg-border my-1" />
                    <MenuLink to="/profile" icon={User}>Profile</MenuLink>
                    <MenuLink to="/upload" icon={UploadCloud}>Upload</MenuLink>
                    <MenuLink to="/watchlist" icon={Bookmark}>Watchlist</MenuLink>
                    <MenuLink to="/favorites" icon={Heart}>Favorites</MenuLink>
                    <MenuLink to="/history" icon={Clock}>History</MenuLink>
                    <MenuLink to="/downloads" icon={Download}>Downloads</MenuLink>
                    <MenuLink to="/settings" icon={SettingsIcon}>Settings</MenuLink>
                    {isAdmin && <MenuLink to="/admin" icon={Shield}>Admin</MenuLink>}
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={doSignOut}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5 text-destructive"
                    >
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button asChild variant="ghost" size="icon" className="rounded-full" aria-label="Sign in">
                <Link to="/login"><UserCircle className="size-5" /></Link>
              </Button>
            )}

            {/* Menu */}
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setOpen(true)} aria-label="Menu">
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[82%] max-w-sm glass-strong p-5 flex flex-col gap-1 animate-zoom-soft overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Logo size={40} />
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-5" />
              </Button>
            </div>
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="rounded-lg px-3 py-3 text-base hover:bg-white/5">
                {l.label}
              </Link>
            ))}
            <div className="h-px bg-border my-3" />
            {user ? (
              <>
                <Link to="/profile" className="rounded-lg px-3 py-3 text-base hover:bg-white/5">Profile</Link>
                <Link to="/upload" className="rounded-lg px-3 py-3 text-base hover:bg-white/5">Upload</Link>
                <Link to="/watchlist" className="rounded-lg px-3 py-3 text-base hover:bg-white/5">Watchlist</Link>
                <Link to="/favorites" className="rounded-lg px-3 py-3 text-base hover:bg-white/5">Favorites</Link>
                <Link to="/history" className="rounded-lg px-3 py-3 text-base hover:bg-white/5">History</Link>
                <Link to="/downloads" className="rounded-lg px-3 py-3 text-base hover:bg-white/5">Downloads</Link>
                <Link to="/settings" className="rounded-lg px-3 py-3 text-base hover:bg-white/5">Settings</Link>
                {isAdmin && <Link to="/admin" className="rounded-lg px-3 py-3 text-base hover:bg-white/5">Admin</Link>}
                <Button className="mt-3 rounded-full" variant="destructive" onClick={doSignOut}>Sign out</Button>
              </>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button asChild variant="outline"><Link to="/login">Login</Link></Button>
                <Button asChild><Link to="/register">Sign up</Link></Button>
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="fixed bottom-3 inset-x-3 z-40 md:hidden">
        <div className="glass-strong flex items-center justify-around rounded-full py-2 px-3 shadow-2xl">
          {[
            { to: "/", label: "Home", icon: Home },
            { to: "/movies", label: "Movies", icon: Film },
            { to: "/tv-series", label: "TV", icon: Tv },
            { to: "/trending", label: "Trend", icon: TrendingUp },
            { to: "/profile", label: "Me", icon: UserCircle },
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

function MenuLink({ to, icon: Icon, children }: { to: any; icon: any; children: React.ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">
      <Icon className="size-4" /> {children}
    </Link>
  );
}
