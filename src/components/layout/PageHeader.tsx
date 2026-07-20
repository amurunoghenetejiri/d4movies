export function PageHeader({ title, subtitle, kicker }: { title: string; subtitle?: string; kicker?: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 pt-28 md:pt-32 pb-4 animate-fade-up">
      {kicker && (
        <span className="inline-block text-xs uppercase tracking-widest text-primary font-semibold">
          {kicker}
        </span>
      )}
      <h1 className="mt-2 text-3xl md:text-5xl font-bold">
        <span className="text-gradient-emerald">{title}</span>
      </h1>
      {subtitle && <p className="mt-2 text-muted-foreground max-w-2xl">{subtitle}</p>}
    </div>
  );
}
