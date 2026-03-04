interface BeWorkLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/** Dégradé bleu métallique : professionnel, épuré, futuriste */
const logoGradient =
  "bg-gradient-to-r from-[#1e3a5f] via-[#2563eb] to-[#0ea5e9] bg-clip-text text-transparent";
const logoShadow = "drop-shadow-[0_1px_2px_rgba(30,58,95,0.25)]";

export function BeWorkLogo({
  className = "",
  size = "md",
}: BeWorkLogoProps) {
  const textSize =
    size === "sm"
      ? "text-2xl md:text-3xl"
      : size === "md"
        ? "text-3xl md:text-4xl"
        : "text-4xl md:text-5xl";

  return (
    <span
      className={`font-extrabold tracking-tight ${textSize} ${logoGradient} ${logoShadow} ${className}`}
      style={{ fontFamily: "var(--font-orbitron), system-ui, sans-serif" }}
    >
      BeWork
    </span>
  );
}
