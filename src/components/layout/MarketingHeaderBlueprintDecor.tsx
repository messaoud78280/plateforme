/**
 * Fond type plan / blueprint pour le header marketing — uniquement visuel.
 * Même logique que le hero / le corps : grille 44px + sous-grille 11px + maille bleue type hero.
 */

const MONO = "ui-monospace, monospace, Menlo, monospace";
const S_SLATE = "rgba(15, 23, 42, 0.09)";
const M_SLATE = "rgba(15, 23, 42, 0.13)";
const TECH_BLUE = "rgba(37, 99, 235, 0.16)";

type Props = {
  /** Pages déjà sur fond uni : grille un peu plus douce */
  plainBg?: boolean;
};

export function MarketingHeaderBlueprintDecor({ plainBg = false }: Props) {
  const coarse = plainBg ? "opacity-[0.2] md:opacity-[0.24]" : "opacity-[0.26] md:opacity-[0.3]";
  const fine = plainBg ? "opacity-[0.14] md:opacity-[0.18]" : "opacity-[0.18] md:opacity-[0.22]";
  const svgLayer = plainBg ? "opacity-[0.32] md:opacity-[0.4]" : "opacity-[0.4] md:opacity-[0.48]";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-white" />
      {/* Grille section (identique au bas de page d’accueil) */}
      <div className={`absolute inset-0 bework-blueprint-grid ${coarse}`} />
      {/* Maille millimétrée bleutée (identique au hero) */}
      <div className={`absolute inset-0 bework-blueprint-grid--hero ${fine}`} />
      <svg
        className={`absolute inset-0 h-full w-full ${svgLayer}`}
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        fill="none"
      >
        <g className="max-md:opacity-[0.88] md:opacity-100">
          <g transform="translate(920 18)" className="hidden sm:block">
            <path
              d="M 0 0 L 0 10 M 200 0 L 200 10 M 0 5 L 200 5"
              stroke={M_SLATE}
              strokeWidth={0.75}
              vectorEffect="nonScalingStroke"
            />
            <text x="88" y="-2" fill={TECH_BLUE} style={{ fontFamily: MONO, fontSize: 8 }} opacity={0.75}>
              240
            </text>
          </g>
          <g transform="translate(16 72)" opacity={0.55}>
            <path d="M 0 0 L 0 36 M 0 0 L 44 0" stroke={S_SLATE} strokeWidth={0.55} vectorEffect="nonScalingStroke" />
            <path d="M 6 6 L 6 22 M 6 6 L 22 6" stroke={TECH_BLUE} strokeWidth={0.45} strokeDasharray="2 3" vectorEffect="nonScalingStroke" />
          </g>
          <line
            x1="0"
            y1="118"
            x2="1200"
            y2="118"
            stroke={TECH_BLUE}
            strokeWidth={0.4}
            vectorEffect="nonScalingStroke"
            opacity={0.35}
            className="hidden md:block"
          />
        </g>
      </svg>
    </div>
  );
}
