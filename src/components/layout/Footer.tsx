import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const cols = [
  {
    title: "Explore",
    links: [
      { to: "/movies", label: "Movies" },
      { to: "/tv-series", label: "TV Series" },
      { to: "/anime", label: "Anime" },
      { to: "/trending", label: "Trending" },
      { to: "/coming-soon", label: "Coming Soon" },
    ],
  },
  {
    title: "Regions",
    links: [
      { to: "/hollywood", label: "Hollywood" },
      { to: "/nollywood", label: "Nollywood" },
      { to: "/bollywood", label: "Bollywood" },
      { to: "/korean-drama", label: "Korean Drama" },
      { to: "/chinese-drama", label: "Chinese Drama" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
      { to: "/faq", label: "FAQ" },
      { to: "/support", label: "Support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy", label: "Privacy Policy" },
      { to: "/terms", label: "Terms of Service" },
      { to: "/dmca", label: "DMCA Policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-black/40">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-14">
        <div className="grid gap-10 md:grid-cols-6">
          <div className="md:col-span-2">
            <Logo size={48} withText glow />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              Stream. Discover. Enjoy. D4TECH Movies delivers premium cinema and series from every corner of the world in stunning HD & 4K.
            </p>
            <div className="mt-5 flex gap-2">
              {[Twitter, Instagram, Youtube, Facebook].map((I, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid place-items-center size-9 rounded-full glass hover:bg-primary/20 hover:text-primary transition"
                  aria-label="social"
                >
                  <I className="size-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold tracking-wider uppercase text-foreground/80">{c.title}</h4>
              <ul className="mt-3 space-y-2 text-sm">
                {c.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-muted-foreground hover:text-primary transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 D4TECH Movies. All Rights Reserved.</p>
          <p>Made with ♥ for movie lovers worldwide.</p>
        </div>
      </div>
    </footer>
  );
}
