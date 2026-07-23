
type Props = {
  size?: number;
  withText?: boolean;
  className?: string;
  glow?: boolean;
};

export function Logo({ size = 98, withText = false, className = "", glow = false }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="D4 Movies"
        width={size}
        height={size}
        className={`rounded-lg object-contain ${glow ? "animate-float-glow" : ""}`}
        style={{ width: size, height: size }}
        loading="eager"
      />
      {withText && (
        <span className="font-display text-lg font-bold tracking-tight">
          <span className="text-gradient-emerald">D4</span>{" "}
          <span className="text-foreground/90">Movies</span>
        </span>
      )} 
    </div>
  );
}
