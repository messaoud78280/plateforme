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

  const iconSize =
    size === "sm" ? "h-8 w-8 text-sm" : size === "md" ? "h-9 w-9 text-base" : "h-10 w-10 text-lg";

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span className="inline-flex items-center gap-2">
        <span
          className={`flex shrink-0 items-center justify-center rounded-full bg-[#0f172a] font-extrabold text-white ${iconSize}`}
          style={{ fontFamily: "var(--font-orbitron), system-ui, sans-serif" }}
        >
          BW
        </span>
        <span
          className={`font-extrabold tracking-tight ${textSize}`}
          style={{ fontFamily: "var(--font-orbitron), system-ui, sans-serif" }}
        >
          <span className="text-[#64748b]">Be</span>
          <span className="text-[#1d4ed8]">Work</span>
        </span>
      </span>
      {showTagline && (
        <span className="mt-0.5 hidden text-[10px] font-medium tracking-wide text-[#94a3b8] sm:block md:text-xs">
          L&apos;assistant administratif à la demande
        </span>
      )}
    </span>
  );
}
