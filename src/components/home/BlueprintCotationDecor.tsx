/**
 * Décorations type plan / cotations BTP — uniquement visuelles (absolute, pointer-events-none).
 * Ne pas utiliser pour du contenu : pas d’impact sur le flux, pas d’interaction.
 */

import type { ReactNode } from "react";

const MONO = "ui-monospace, monospace, Menlo, monospace";

/** Gris léger — traits secondaires */
const S_SLATE = "rgba(15, 23, 42, 0.10)";
/** Gris technique — cotes principales */
const M_SLATE = "rgba(15, 23, 42, 0.16)";
/** Bleu technique */
const TECH_BLUE = "rgba(37, 99, 235, 0.22)";
/** Bleu ponctuel (repères, cotes mises en avant) */
const TECH_BLUE_ACCENT = "rgba(37, 99, 235, 0.30)";

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

type DecorRootProps = {
  className?: string;
  children: ReactNode;
};

function DecorRoot({ className, children }: DecorRootProps) {
  return (
    <div className={cx("pointer-events-none select-none", className)} aria-hidden="true">
      {children}
    </div>
  );
}

/** Cotations zone titre hero (gauche), sous le contenu (z ≤ 1). */
export function BlueprintCotationHero({ className }: { className?: string }) {
  return (
    <DecorRoot
      className={cx(
        "absolute left-0 top-[1%] z-[1] h-[min(48vh,380px)] w-[min(100%,38rem)] max-sm:h-[min(40vh,280px)] max-sm:w-[min(100%,18rem)] max-sm:opacity-[0.52] sm:opacity-[0.62] md:top-[2%] md:h-[min(52vh,440px)] md:w-[min(100%,44rem)] md:opacity-[0.74] lg:opacity-[0.78]",
        className,
      )}
    >
      <svg
        className="h-full w-full overflow-visible"
        viewBox="0 0 440 320"
        fill="none"
        preserveAspectRatio="xMinYMin meet"
      >
        <defs>
          <clipPath id="bp-hero-deco-clip">
            <rect x="0" y="0" width="210" height="300" />
          </clipPath>
          <pattern id="bp-hero-mini-grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <path
              d="M 22 0 L 0 0 0 22"
              fill="none"
              stroke="rgba(37, 99, 235, 0.09)"
              strokeWidth={0.55}
              vectorEffect="nonScalingStroke"
            />
          </pattern>
        </defs>
        {/* Quadrillage léger — uniquement colonne gauche (évite le bloc titre dense) */}
        <g clipPath="url(#bp-hero-deco-clip)">
          <rect x="0" y="0" width="210" height="300" fill="url(#bp-hero-mini-grid)" opacity={0.55} />
        </g>
        <g opacity={0.98}>
          {/* Cotation horizontale 245 — trait principal */}
          <path
            d="M 32 118 L 32 108 M 268 118 L 268 108 M 32 104 L 268 104"
            stroke={M_SLATE}
            strokeWidth={1.08}
            strokeLinecap="square"
            vectorEffect="nonScalingStroke"
          />
          <path
            d="M 32 108 L 32 104 M 268 108 L 268 104"
            stroke={S_SLATE}
            strokeWidth={0.72}
            vectorEffect="nonScalingStroke"
          />
          <text
            x={150}
            y={98}
            fill={TECH_BLUE_ACCENT}
            style={{ fontFamily: MONO, fontSize: 10.5 }}
            opacity={0.92}
          >
            245
          </text>
          {/* Verticale 180 */}
          <path
            d="M 372 40 L 382 40 M 372 208 L 382 208 M 378 40 L 378 208"
            stroke={M_SLATE}
            strokeWidth={1.05}
            strokeLinecap="square"
            vectorEffect="nonScalingStroke"
          />
          <path
            d="M 372 40 L 378 40 M 372 208 L 378 208"
            stroke={S_SLATE}
            strokeWidth={0.7}
            vectorEffect="nonScalingStroke"
          />
          <text x={386} y={128} fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 9.5 }} opacity={0.9}>
            180
          </text>
          {/* Ø72 */}
          <path
            d="M 48 248 L 48 238 M 120 248 L 120 238 M 48 234 L 120 234"
            stroke={S_SLATE}
            strokeWidth={0.78}
            vectorEffect="nonScalingStroke"
          />
          <text x={68} y={228} fill={TECH_BLUE} style={{ fontFamily: MONO, fontSize: 9.5 }} opacity={0.88}>
            Ø72
          </text>
          {/* R18 */}
          <path
            d="M 302 72 A 18 18 0 0 1 320 54"
            stroke={TECH_BLUE_ACCENT}
            strokeWidth={0.95}
            strokeDasharray="2 3"
            vectorEffect="nonScalingStroke"
            opacity={0.82}
          />
          <text x={324} y={56} fill={TECH_BLUE_ACCENT} style={{ fontFamily: MONO, fontSize: 9.5 }} opacity={0.82}>
            R18
          </text>
          {/* 90° — repère angle */}
          <path
            d="M 200 52 L 200 72 M 200 72 L 220 72"
            stroke={TECH_BLUE}
            strokeWidth={0.85}
            vectorEffect="nonScalingStroke"
            opacity={0.75}
          />
          <path d="M 200 72 L 212 60" stroke={S_SLATE} strokeWidth={0.55} vectorEffect="nonScalingStroke" opacity={0.7} />
          <text x={204} y={48} fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 8.5 }} opacity={0.82}>
            90°
          </text>
          {/* 1:1 échelle */}
          <text x={312} y={286} fill={TECH_BLUE} style={{ fontFamily: MONO, fontSize: 9 }} opacity={0.78}>
            1:1
          </text>
          {/* 240 */}
          <text x={24} y={44} fill={S_SLATE} style={{ fontFamily: MONO, fontSize: 8.5 }} opacity={0.8}>
            240
          </text>
          {/* 152.00 */}
          <text x={318} y={118} fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 8.5 }} opacity={0.76}>
            152.00
          </text>
          <text x={24} y={286} fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 8.5 }} opacity={0.78}>
            ±0.2 mm
          </text>
          {/* L-frame zone titre */}
          <path
            d="M 18 28 L 18 200 M 18 28 L 320 28"
            stroke={S_SLATE}
            strokeWidth={0.62}
            strokeDasharray="3 4"
            vectorEffect="nonScalingStroke"
            opacity={0.62}
          />
          {/* Rosace / nord — zone droite (visuel image) */}
          <g transform="translate(312 232)" className="hidden sm:block" opacity={0.48}>
            <circle cx="56" cy="32" r="24" stroke={S_SLATE} strokeWidth={0.55} fill="none" strokeDasharray="3 4" />
            <line x1="56" y1="10" x2="56" y2="20" stroke={TECH_BLUE_ACCENT} strokeWidth={0.9} vectorEffect="nonScalingStroke" />
            <polygon points="56,10 59,17 53,17" fill={TECH_BLUE_ACCENT} opacity={0.42} />
            <text x="56" y="58" textAnchor="middle" fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 8 }} opacity={0.78}>
              N
            </text>
            <path d="M 40 68 L 72 68" stroke={S_SLATE} strokeWidth={0.45} strokeDasharray="2 3" vectorEffect="nonScalingStroke" opacity={0.55} />
            <text x="56" y="78" textAnchor="middle" fill={S_SLATE} style={{ fontFamily: MONO, fontSize: 6.5 }} opacity={0.62}>
              conv. étude
            </text>
          </g>
        </g>
      </svg>
    </DecorRoot>
  );
}

/** Section problème : repères coins + cotations (mobile allégé). */
export function BlueprintCotationProblemMarks({ className }: { className?: string }) {
  return (
    <DecorRoot className={cx("absolute inset-0 z-0 overflow-hidden", className)}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 700" preserveAspectRatio="none" fill="none">
        <defs>
          <pattern id="bp-problem-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(15, 23, 42, 0.11)" strokeWidth="0.45" />
          </pattern>
        </defs>
        <rect
          x="16"
          y="480"
          width="160"
          height="140"
          fill="url(#bp-problem-hatch)"
          className="hidden md:block opacity-[0.5]"
        />
        <g className="max-md:opacity-[0.42] md:opacity-[0.72]">
          {/* Haut droite — cotation */}
          <g transform="translate(880 36)">
            <path
              d="M 0 0 L 0 14 M 200 0 L 200 14 M 0 7 L 200 7"
              stroke={M_SLATE}
              strokeWidth={1}
              vectorEffect="nonScalingStroke"
            />
            <text x={92} y={-2} fill={TECH_BLUE_ACCENT} style={{ fontFamily: MONO, fontSize: 9.5 }} opacity={0.88}>
              245
            </text>
          </g>
          {/* Bas gauche */}
          <g transform="translate(48 612)" className="hidden sm:block">
            <path
              d="M 0 0 L 14 0 M 0 56 L 14 56 M 7 0 L 7 56"
              stroke={M_SLATE}
              strokeWidth={0.92}
              vectorEffect="nonScalingStroke"
            />
            <text x={20} y={34} fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 9.5 }} opacity={0.84}>
              180
            </text>
          </g>
          {/* Haut gauche — discret, masqué sur très petit écran */}
          <g transform="translate(32 28)" className="hidden sm:block">
            <path d="M 0 0 L 56 0 M 0 0 L 0 40" stroke={S_SLATE} strokeWidth={0.72} vectorEffect="nonScalingStroke" opacity={0.75} />
            <text x={4} y={54} fill={TECH_BLUE} style={{ fontFamily: MONO, fontSize: 8 }} opacity={0.72}>
              240
            </text>
          </g>
        </g>
        {/* Rails denses — desktop uniquement */}
        <g className="hidden md:block" opacity={0.55}>
          <g transform="translate(1020 120)">
            <path
              d="M 0 0 L 12 0 M 0 320 L 12 320 M 6 0 L 6 320"
              stroke={S_SLATE}
              strokeWidth={0.85}
              vectorEffect="nonScalingStroke"
            />
            <text x={18} y={168} fill={TECH_BLUE} style={{ fontFamily: MONO, fontSize: 9 }} opacity={0.8}>
              180
            </text>
          </g>
          <g transform="translate(72 480)">
            <path
              d="M 0 0 L 0 12 M 160 0 L 160 12 M 0 6 L 160 6"
              stroke={S_SLATE}
              strokeWidth={0.78}
              vectorEffect="nonScalingStroke"
            />
            <text x={64} y={-2} fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 8.5 }} opacity={0.78}>
              152.00
            </text>
          </g>
          <g transform="translate(1088 520)" className="hidden lg:block" opacity={0.42}>
            <path d="M 0 0 L 32 0 M 0 0 L 0 32" stroke={M_SLATE} strokeWidth={0.72} vectorEffect="nonScalingStroke" />
            <circle cx="48" cy="48" r="4" stroke={TECH_BLUE} strokeWidth={0.5} fill="none" vectorEffect="nonScalingStroke" opacity={0.65} />
          </g>
        </g>
      </svg>
    </DecorRoot>
  );
}

/** Repères autour du bloc grille cartes (missions) — md+ (évite surcharge mobile). */
export function BlueprintCotationMissionsFrame({ className }: { className?: string }) {
  return (
    <DecorRoot className={cx("absolute inset-0 z-0 hidden overflow-hidden md:block", className)}>
      <svg className="h-full w-full" viewBox="0 0 900 420" fill="none" preserveAspectRatio="none">
        <g className="opacity-[0.72] lg:opacity-[0.82]">
          <path
            d="M 24 20 L 24 52 M 24 20 L 56 20"
            stroke={M_SLATE}
            strokeWidth={0.88}
            vectorEffect="nonScalingStroke"
          />
          <path
            d="M 876 20 L 876 52 M 876 20 L 844 20"
            stroke={M_SLATE}
            strokeWidth={0.88}
            vectorEffect="nonScalingStroke"
          />
          <path
            d="M 24 400 L 24 368 M 24 400 L 56 400"
            stroke={M_SLATE}
            strokeWidth={0.88}
            vectorEffect="nonScalingStroke"
          />
          <path
            d="M 876 400 L 876 368 M 876 400 L 844 400"
            stroke={M_SLATE}
            strokeWidth={0.88}
            vectorEffect="nonScalingStroke"
          />
          <path
            d="M 120 12 L 780 12"
            stroke={TECH_BLUE}
            strokeWidth={0.62}
            strokeDasharray="4 5"
            vectorEffect="nonScalingStroke"
            opacity={0.62}
          />
          <text x={420} y={10} textAnchor="middle" fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 8.5 }} opacity={0.78}>
            720
          </text>
          <path
            d="M 380 404 L 520 404"
            stroke={TECH_BLUE_ACCENT}
            strokeWidth={0.55}
            strokeDasharray="3 4"
            vectorEffect="nonScalingStroke"
            opacity={0.55}
          />
          <text x={448} y={418} textAnchor="middle" fill={TECH_BLUE} style={{ fontFamily: MONO, fontSize: 8 }} opacity={0.72}>
            1:1
          </text>
          {/* Repères d’alignement planche */}
          <g opacity={0.55}>
            <path d="M 450 210 L 454 214 M 450 210 L 454 206" stroke={S_SLATE} strokeWidth={0.5} vectorEffect="nonScalingStroke" />
            <path d="M 450 214 L 454 210" stroke={S_SLATE} strokeWidth={0.5} vectorEffect="nonScalingStroke" />
          </g>
          <line x1={448} y1={96} x2={448} y2={132} stroke={TECH_BLUE} strokeWidth={0.45} strokeDasharray="3 4" vectorEffect="nonScalingStroke" opacity={0.4} />
        </g>
      </svg>
    </DecorRoot>
  );
}

/** Fond technique léger — section « Ce qu’on gère » (hors cartes). */
export function BlueprintCotationWhatWeHandleAmbient({ className }: { className?: string }) {
  return (
    <DecorRoot className={cx("absolute inset-0 z-0 overflow-hidden", className)}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 640" preserveAspectRatio="none" fill="none">
        <g className="max-md:opacity-[0.28] md:opacity-[0.48]">
          <g transform="translate(1056 48)" className="hidden sm:block">
            <path d="M 0 0 L 0 72 M 0 0 L 72 0" stroke={S_SLATE} strokeWidth={0.78} vectorEffect="nonScalingStroke" />
            <text x={8} y={92} fill={TECH_BLUE} style={{ fontFamily: MONO, fontSize: 8.5 }} opacity={0.76}>
              240
            </text>
          </g>
          <g transform="translate(40 520)">
            <path
              d="M 0 0 L 0 12 M 140 0 L 140 12 M 0 6 L 140 6"
              stroke={M_SLATE}
              strokeWidth={0.82}
              vectorEffect="nonScalingStroke"
            />
            <text x={52} y={-2} fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 8.5 }} opacity={0.74}>
              152.00
            </text>
          </g>
        </g>
        <g className="hidden md:block" opacity={0.4}>
          <line x1={1180} y1={140} x2={1180} y2={420} stroke={TECH_BLUE} strokeWidth={0.55} vectorEffect="nonScalingStroke" />
          <line x1={1148} y1={400} x2={1188} y2={400} stroke={S_SLATE} strokeWidth={0.55} vectorEffect="nonScalingStroke" />
          <text x={1100} y={396} fill={TECH_BLUE} style={{ fontFamily: MONO, fontSize: 8 }} opacity={0.68}>
            90°
          </text>
        </g>
        {/* Repère de calage type planche */}
        <g transform="translate(580 96)" className="hidden lg:block" opacity={0.32}>
          <path d="M 0 0 L 14 0 M 0 0 L 0 14" stroke={S_SLATE} strokeWidth={0.55} vectorEffect="nonScalingStroke" />
          <path d="M 4 4 L 10 10 M 10 4 L 4 10" stroke={TECH_BLUE} strokeWidth={0.4} vectorEffect="nonScalingStroke" opacity={0.55} />
        </g>
      </svg>
    </DecorRoot>
  );
}

/** Quadrillage + repères de section — Process BeWork (mobile minimal). */
export function BlueprintCotationProcessAmbient({ className }: { className?: string }) {
  return (
    <DecorRoot className={cx("absolute inset-0 z-0 overflow-hidden", className)}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1400 900" preserveAspectRatio="none" fill="none">
        <defs>
          <pattern id="bpw-process-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path
              d="M 56 0 L 0 0 0 56"
              fill="none"
              stroke="rgba(148, 163, 184, 0.16)"
              strokeWidth={0.65}
              vectorEffect="nonScalingStroke"
            />
          </pattern>
        </defs>
        <g className="hidden md:block" opacity={0.42}>
          <rect width="1400" height="900" fill="url(#bpw-process-grid)" />
        </g>
        {/* Bandeau type cartouche / phases */}
        <g className="hidden md:block" transform="translate(96 20)" opacity={0.4}>
          <rect x="0" y="4" width="5" height="5" fill={TECH_BLUE} opacity={0.5} />
          <rect x="10" y="4" width="5" height="5" fill={S_SLATE} opacity={0.45} />
          <rect x="20" y="4" width="5" height="5" fill={S_SLATE} opacity={0.45} />
          <line x1="32" y1="6.5" x2="200" y2="6.5" stroke={M_SLATE} strokeWidth={0.55} vectorEffect="nonScalingStroke" />
          <text x="208" y="10" fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 7 }} opacity={0.68}>
            LOT 01 — PROCESSUS
          </text>
        </g>
        <g className="max-md:opacity-[0.32] md:opacity-[0.52]">
          <g transform="translate(24 32)" className="md:hidden">
            <path d="M 0 0 L 88 0 M 0 0 L 0 56" stroke={S_SLATE} strokeWidth={0.72} vectorEffect="nonScalingStroke" />
          </g>
          <g transform="translate(1260 40)" className="hidden md:block">
            <path d="M 0 0 L 0 100 M 0 0 L -80 0" stroke={M_SLATE} strokeWidth={0.78} vectorEffect="nonScalingStroke" />
            <text x={-72} y={118} fill={TECH_BLUE} style={{ fontFamily: MONO, fontSize: 8.5 }} opacity={0.72}>
              240
            </text>
          </g>
          <g transform="translate(48 820)" className="hidden sm:block">
            <path
              d="M 0 0 L 12 0 M 0 48 L 12 48 M 6 0 L 6 48"
              stroke={S_SLATE}
              strokeWidth={0.78}
              vectorEffect="nonScalingStroke"
            />
            <text x={18} y={30} fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 8.5 }} opacity={0.72}>
              180
            </text>
          </g>
        </g>
      </svg>
    </DecorRoot>
  );
}

/** Ligne de cotation horizontale — rail au-dessus de la grille process. */
export function BlueprintCotationProcessRail({ className }: { className?: string }) {
  return (
    <DecorRoot className={cx("absolute z-0 max-md:opacity-[0.48] md:opacity-100", className)}>
      <svg className="h-full w-full overflow-visible" viewBox="0 0 800 48" fill="none" preserveAspectRatio="none">
        <g className="opacity-[0.68] md:opacity-[0.82]">
          <path
            d="M 16 28 L 16 38 M 784 28 L 784 38 M 16 33 L 784 33"
            stroke={M_SLATE}
            strokeWidth={1.05}
            vectorEffect="nonScalingStroke"
          />
          <path
            d="M 16 38 L 16 33 M 784 38 L 784 33"
            stroke={S_SLATE}
            strokeWidth={0.72}
            vectorEffect="nonScalingStroke"
          />
          <text x={392} y={22} textAnchor="middle" fill={TECH_BLUE_ACCENT} style={{ fontFamily: MONO, fontSize: 9.5 }} opacity={0.82}>
            180
          </text>
          <g className="hidden sm:block">
            <text x={718} y={20} textAnchor="end" fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 7.5 }} opacity={0.68}>
              ±0.2 mm
            </text>
          </g>
          <g className="hidden md:block">
            <text x={82} y={20} fill={TECH_BLUE} style={{ fontFamily: MONO, fontSize: 8 }} opacity={0.72}>
              1:1
            </text>
          </g>
        </g>
      </svg>
    </DecorRoot>
  );
}

/** Filet + repères en tête de footer. */
export function BlueprintCotationFooterHairline({ className }: { className?: string }) {
  return (
    <DecorRoot className={cx("absolute inset-x-0 top-0 z-0 h-7", className)}>
      <svg className="h-full w-full" viewBox="0 0 1200 28" preserveAspectRatio="none" fill="none">
        <line
          x1={0}
          y1={14}
          x2={1200}
          y2={14}
          stroke={M_SLATE}
          strokeWidth={0.65}
          vectorEffect="nonScalingStroke"
          opacity={0.58}
        />
        <line x1={80} y1={9} x2={80} y2={19} stroke={TECH_BLUE_ACCENT} strokeWidth={0.55} vectorEffect="nonScalingStroke" opacity={0.48} />
        <line x1={1120} y1={9} x2={1120} y2={19} stroke={TECH_BLUE_ACCENT} strokeWidth={0.55} vectorEffect="nonScalingStroke" opacity={0.48} />
        <g className="hidden md:block" opacity={0.42}>
          <line x1={560} y1={10} x2={560} y2={18} stroke={S_SLATE} strokeWidth={0.5} vectorEffect="nonScalingStroke" />
          <text x={568} y={17} fill={TECH_BLUE} style={{ fontFamily: MONO, fontSize: 7 }} opacity={0.65}>
            240
          </text>
        </g>
      </svg>
    </DecorRoot>
  );
}

/** Hub ressources — grille + repères (lisibilité mobile réduite). */
export function BlueprintRessourcesBackdrop({ className }: { className?: string }) {
  return (
    <DecorRoot className={cx("absolute inset-0 z-0 overflow-hidden", className)}>
      <svg className="absolute inset-0 h-full w-full min-h-[480px]" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMin slice" fill="none">
        <defs>
          <pattern id="bpw-res-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="rgba(15, 23, 42, 0.07)"
              strokeWidth={0.55}
              vectorEffect="nonScalingStroke"
            />
          </pattern>
        </defs>
        <rect
          x="10"
          y="10"
          width="1180"
          height="880"
          fill="none"
          stroke="rgba(15, 23, 42, 0.09)"
          strokeWidth={0.55}
          vectorEffect="nonScalingStroke"
          className="max-md:opacity-[0.35] md:opacity-[0.55]"
        />
        <rect
          x="18"
          y="18"
          width="1164"
          height="864"
          fill="none"
          stroke="rgba(37, 99, 235, 0.08)"
          strokeWidth={0.45}
          strokeDasharray="7 5"
          vectorEffect="nonScalingStroke"
          className="hidden opacity-[0.45] md:block"
        />
        <g className="max-md:opacity-[0.35] md:opacity-[0.55]">
          <rect x="0" y="0" width="1200" height="900" fill="url(#bpw-res-grid)" className="hidden md:block" />
        </g>
        <g className="max-md:opacity-[0.38] md:opacity-[0.62]">
          <g transform="translate(1024 36)">
            <path d="M 0 0 L 120 0 M 0 0 L 0 72" stroke={M_SLATE} strokeWidth={0.85} vectorEffect="nonScalingStroke" />
            <text x={8} y={92} fill={TECH_BLUE} style={{ fontFamily: MONO, fontSize: 9 }} opacity={0.78}>
              240
            </text>
          </g>
          <g transform="translate(56 48)" className="hidden sm:block" opacity={0.38}>
            <line x1="20" y1="0" x2="20" y2="16" stroke={TECH_BLUE_ACCENT} strokeWidth={0.75} vectorEffect="nonScalingStroke" />
            <polygon points="20,0 23,7 17,7" fill={TECH_BLUE_ACCENT} opacity={0.35} />
            <text x="20" y="32" textAnchor="middle" fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 8 }} opacity={0.72}>
              N
            </text>
          </g>
          <g transform="translate(40 720)" className="hidden sm:block">
            <path
              d="M 0 0 L 0 12 M 180 0 L 180 12 M 0 6 L 180 6"
              stroke={S_SLATE}
              strokeWidth={0.78}
              vectorEffect="nonScalingStroke"
            />
            <text x={72} y={-2} fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 8.5 }} opacity={0.76}>
              152.00
            </text>
          </g>
          <g transform="translate(1080 560)" className="hidden md:block">
            <path d="M 0 0 L 0 140 M 0 0 L 56 0" stroke={TECH_BLUE} strokeWidth={0.55} vectorEffect="nonScalingStroke" opacity={0.55} />
            <text x={8} y={158} fill={TECH_BLUE_ACCENT} style={{ fontFamily: MONO, fontSize: 8 }} opacity={0.7}>
              90°
            </text>
          </g>
        </g>
      </svg>
    </DecorRoot>
  );
}
