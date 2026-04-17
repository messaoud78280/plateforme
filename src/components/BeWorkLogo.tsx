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
    size === "sm" ? "h-11 w-11 text-base" : size === "md" ? "h-12 w-12 text-lg" : "h-14 w-14 text-xl";

  /** Aligne le sous-titre avec le début du mot « BeWork », pas sous le pictogramme (pastille + gap-2) */
  const taglineIndent = size === "sm" ? "pl-[3.25rem]" : size === "md" ? "pl-14" : "pl-16";

  const defaultTagline = "L'assistant administratif à la demande";

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span className="inline-flex items-center gap-2">
        <span
          className={`bework-logo-badge-metallic relative flex shrink-0 items-center justify-center rounded-full font-sans font-extrabold text-white ${iconSize}`}
        >
          <span
            className="pointer-events-none absolute -left-1/4 -top-1/2 h-full w-[90%] rounded-full bg-gradient-to-b from-white/25 to-transparent opacity-80 blur-[3px]"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute inset-0 rounded-full opacity-40"
            style={{
              background:
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
            }}
            aria-hidden
          />
          <span className="relative z-10 tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">BW</span>
        </span>
        <span className={`font-sans font-extrabold tracking-tight ${textSize}`}>
          <span className="text-metallic-black">Be</span>
          <span className="bg-gradient-to-r from-[#60a5fa] via-[#3b82f6] to-[#1d4ed8] bg-clip-text text-transparent [text-shadow:none]">
            Work
          </span>
        </span>
      </span>
      {showTagline && (
        <span
          className={`${taglineIndent} mt-1.5 max-w-[calc(100vw-3rem)] py-0.5 sm:max-w-xl`}
        >
          <span className="block text-xs font-semibold leading-snug text-black sm:text-sm">
            {tagline ?? defaultTagline}
          </span>
          {taglineSub ? (
            <span className="mt-1 block text-[11px] font-medium leading-snug text-black sm:text-[0.8125rem]">
              {taglineSub}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );
}
