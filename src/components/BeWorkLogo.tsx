interface BeWorkLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BeWorkLogo({
  className = "",
  size = "md",
}: BeWorkLogoProps) {
  const textSize =
    size === "sm"
      ? "text-lg md:text-xl"
      : size === "md"
        ? "text-xl md:text-2xl"
        : "text-2xl md:text-3xl";

  return (
    <span
      className={`font-extrabold tracking-tight ${textSize} bg-gradient-to-r from-[#1d4ed8] via-[#3b82f6] to-[#60a5fa] bg-clip-text text-transparent drop-shadow-sm ${className}`}
      style={{ fontFamily: "var(--font-orbitron), system-ui, sans-serif" }}
    >
      BeWork
    </span>
  );
}
