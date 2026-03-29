interface BeWorkLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  /** Ligne principale du sous-titre (ex. positionnement métier) */
  tagline?: string;
  /** Ligne secondaire, plus discrète (ex. promesse IA / zone) */
  taglineSub?: string;
}

export function BeWorkLogo({
  className = "",
  size = "md",
  showTagline = false,
  tagline,
  taglineSub,
}: BeWorkLogoProps) {
  const textSize =
    size === "sm"
      ? "text-2xl md:text-3xl"
      : size === "md"
        ? "text-3xl md:text-4xl"
        : "text-4xl md:text-5xl";

  const iconSize =
    size === "sm" ? "h-8 w-8 text-sm" : size === "md" ? "h-9 w-9 text-base" : "h-10 w-10 text-lg";

  /** Aligne le sous-titre avec le début du mot « BeWork », pas sous le pictogramme */
  const taglineIndent =
    size === "sm" ? "pl-10" : size === "md" ? "pl-11" : "pl-12";

  const defaultTagline = "L'assistant administratif à la demande";

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
        <span
          className={`${taglineIndent} mt-1.5 max-w-[calc(100vw-3rem)] py-0.5 sm:max-w-xl`}
        >
          <span className="block text-xs font-semibold leading-snug text-[#0f172a] sm:text-sm">
            {tagline ?? defaultTagline}
          </span>
          {taglineSub ? (
            <span className="mt-1 block text-[11px] font-medium leading-snug text-[#64748b] sm:text-[0.8125rem]">
              {taglineSub}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );
}
