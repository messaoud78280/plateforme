interface BeWorkLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export function BeWorkLogo({
  className = "",
  size = "md",
  showTagline = false,
}: BeWorkLogoProps) {
  const textSize =
    size === "sm"
      ? "text-2xl md:text-3xl"
      : size === "md"
        ? "text-3xl md:text-4xl"
        : "text-4xl md:text-5xl";

  return (
    <span className={`inline-block ${className}`}>
      <span
        className={`font-extrabold tracking-tight ${textSize}`}
        style={{ fontFamily: "var(--font-orbitron), system-ui, sans-serif" }}
      >
        <span className="text-[#64748b]">Be</span>
        <span className="text-[#1d4ed8]">Work</span>
      </span>
      {showTagline && (
        <span className="mt-0.5 hidden text-[10px] font-medium tracking-wide text-[#94a3b8] sm:block md:text-xs">
          L&apos;assistant administratif à la demande
        </span>
      )}
    </span>
  );
}
