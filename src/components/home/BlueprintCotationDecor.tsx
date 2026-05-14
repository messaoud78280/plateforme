/**
 * Décorations type plan / cotations BTP — uniquement visuelles (absolute, pointer-events-none).
 * Ne pas utiliser pour du contenu : pas d’impact sur le flux, pas d’interaction.
 */

import type { ReactNode } from "react";

const MONO = "ui-monospace, monospace, Menlo, monospace";

const S_SLATE = "rgba(15, 23, 42, 0.10)";
const M_SLATE = "rgba(15, 23, 42, 0.15)";
const TECH_BLUE = "rgba(0, 91, 255, 0.14)";

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

type DecorRootProps = {
  className?: string;
  children: ReactNode;
};

function DecorRoot({ className, children }: DecorRootProps) {
  return (
    <div className={cx("pointer-events-none select-none", className)} aria-hidden>
      {children}
    </div>
  );
}

/** Cotations discrètes zone titre hero (gauche), au-dessus du calque plan large, sous le contenu. */
export function BlueprintCotationHero({ className }: { className?: string }) {
  return (
    <DecorRoot
      className={cx(
        "absolute left-0 top-[1%] z-[1] h-[min(48vh,380px)] w-[min(100%,38rem)] max-sm:h-[min(42vh,300px)] max-sm:w-[min(100%,20rem)] max-sm:opacity-[0.28] sm:opacity-[0.4] md:top-[2%] md:h-[min(52vh,440px)] md:w-[min(100%,44rem)] md:opacity-[0.5]",
        className,
      )}
    >
      <svg
        className="h-full w-full overflow-visible"
        viewBox="0 0 440 320"
        fill="none"
        preserveAspectRatio="xMinYMin meet"
      >
        <g opacity={0.95}>
          {/* Cotation horizontale 245 */}
          <path
            d="M 32 118 L 32 108 M 268 118 L 268 108 M 32 104 L 268 104"
            stroke={M_SLATE}
            strokeWidth={0.75}
            strokeLinecap="square"
            vectorEffect="nonScalingStroke"
          />
          <path d="M 32 108 L 32 104 M 268 108 L 268 104" stroke={S_SLATE} strokeWidth={0.55} vectorEffect="nonScalingStroke" />
          <text
            x={150}
            y={98}
            fill={TECH_BLUE}
            style={{ fontFamily: MONO, fontSize: 10 }}
            opacity={0.9}
          >
            245
          </text>
          {/* Verticale 180 */}
          <path
            d="M 372 40 L 382 40 M 372 208 L 382 208 M 378 40 L 378 208"
            stroke={M_SLATE}
            strokeWidth={0.75}
            strokeLinecap="square"
            vectorEffect="nonScalingStroke"
          />
          <path d="M 372 40 L 378 40 M 372 208 L 378 208" stroke={S_SLATE} strokeWidth={0.55} vectorEffect="nonScalingStroke" />
          <text
            x={386}
            y={128}
            fill={M_SLATE}
            style={{ fontFamily: MONO, fontSize: 9 }}
            opacity={0.85}
          >
            180
          </text>
          {/* Repère 72 */}
          <path
            d="M 48 248 L 48 238 M 120 248 L 120 238 M 48 234 L 120 234"
            stroke={S_SLATE}
            strokeWidth={0.65}
            vectorEffect="nonScalingStroke"
          />
          <text x={74} y={228} fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 9 }} opacity={0.8}>
            72
          </text>
          {/* R18 — arc de cotation */}
          <path
            d="M 302 72 A 18 18 0 0 1 320 54"
            stroke={TECH_BLUE}
            strokeWidth={0.7}
            strokeDasharray="2 3"
            vectorEffect="nonScalingStroke"
            opacity={0.75}
          />
          <text x={324} y={56} fill={TECH_BLUE} style={{ fontFamily: MONO, fontSize: 9 }} opacity={0.75}>
            R18
          </text>
          {/* Tolérance */}
          <text x={24} y={286} fill={S_SLATE} style={{ fontFamily: MONO, fontSize: 8 }} opacity={0.72}>
            ±0.2 mm
          </text>
          {/* L-frame léger autour zone titre */}
          <path
            d="M 18 28 L 18 200 M 18 28 L 320 28"
            stroke={S_SLATE}
            strokeWidth={0.45}
            strokeDasharray="3 4"
            vectorEffect="nonScalingStroke"
            opacity={0.55}
          />
        </g>
      </svg>
    </DecorRoot>
  );
}

/** Section problème : repères discrets coin haut-droit & bas-gauche. */
export function BlueprintCotationProblemMarks({ className }: { className?: string }) {
  return (
    <DecorRoot className={cx("absolute inset-0 z-0 overflow-hidden", className)}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 700" preserveAspectRatio="none" fill="none">
        <g className="max-md:opacity-[0.35] md:opacity-[0.55]">
          {/* Haut droite — cotation courte */}
          <g transform="translate(880 36)">
            <path
              d="M 0 0 L 0 12 M 200 0 L 200 12 M 0 6 L 200 6"
              stroke={M_SLATE}
              strokeWidth={0.7}
              vectorEffect="nonScalingStroke"
            />
            <text x={92} y={-2} fill={TECH_BLUE} style={{ fontFamily: MONO, fontSize: 9 }} opacity={0.8}>
              245
            </text>
          </g>
          {/* Bas gauche */}
          <g transform="translate(48 620)" className="hidden sm:block">
            <path
              d="M 0 0 L 12 0 M 0 48 L 12 48 M 6 0 L 6 48"
              stroke={S_SLATE}
              strokeWidth={0.65}
              vectorEffect="nonScalingStroke"
            />
            <text x={18} y={30} fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 9 }} opacity={0.78}>
              180
            </text>
          </g>
        </g>
      </svg>
    </DecorRoot>
  );
}

/** Repères autour du bloc grille cartes (missions) — calque inset du wrapper relatif. */
export function BlueprintCotationMissionsFrame({ className }: { className?: string }) {
  return (
    <DecorRoot
      className={cx(
        "absolute inset-0 z-0 hidden overflow-hidden md:block",
        className,
      )}
    >
      <svg className="h-full w-full" viewBox="0 0 900 420" fill="none" preserveAspectRatio="none">
        <g opacity={0.55}>
          <path
            d="M 24 20 L 24 48 M 24 20 L 52 20"
            stroke={S_SLATE}
            strokeWidth={0.55}
            vectorEffect="nonScalingStroke"
          />
          <path
            d="M 876 20 L 876 48 M 876 20 L 848 20"
            stroke={S_SLATE}
            strokeWidth={0.55}
            vectorEffect="nonScalingStroke"
          />
          <path
            d="M 24 400 L 24 372 M 24 400 L 52 400"
            stroke={S_SLATE}
            strokeWidth={0.55}
            vectorEffect="nonScalingStroke"
          />
          <path
            d="M 876 400 L 876 372 M 876 400 L 848 400"
            stroke={S_SLATE}
            strokeWidth={0.55}
            vectorEffect="nonScalingStroke"
          />
          <path
            d="M 120 12 L 780 12"
            stroke={TECH_BLUE}
            strokeWidth={0.45}
            strokeDasharray="4 5"
            vectorEffect="nonScalingStroke"
            opacity={0.5}
          />
          <text x={420} y={10} textAnchor="middle" fill={M_SLATE} style={{ fontFamily: MONO, fontSize: 8 }} opacity={0.65}>
            720
          </text>
        </g>
      </svg>
    </DecorRoot>
  );
}

/** Ligne de cotation horizontale discrète — derrière la grille process. */
export function BlueprintCotationProcessRail({ className }: { className?: string }) {
  return (
    <DecorRoot className={cx("absolute z-0 max-md:opacity-[0.38] md:opacity-100", className)}>
      <svg className="h-full w-full overflow-visible" viewBox="0 0 800 48" fill="none" preserveAspectRatio="none">
        <g opacity={0.55}>
          <path
            d="M 16 28 L 16 36 M 784 28 L 784 36 M 16 32 L 784 32"
            stroke={M_SLATE}
            strokeWidth={0.7}
            vectorEffect="nonScalingStroke"
          />
          <path d="M 16 36 L 16 32 M 784 36 L 784 32" stroke={S_SLATE} strokeWidth={0.55} vectorEffect="nonScalingStroke" />
          <text x={392} y={22} textAnchor="middle" fill={TECH_BLUE} style={{ fontFamily: MONO, fontSize: 9 }} opacity={0.72}>
            180
          </text>
        </g>
      </svg>
    </DecorRoot>
  );
}

/** Filet technique très léger en tête de footer. */
export function BlueprintCotationFooterHairline({ className }: { className?: string }) {
  return (
    <DecorRoot className={cx("absolute inset-x-0 top-0 z-0 h-6", className)}>
      <svg className="h-full w-full" viewBox="0 0 1200 24" preserveAspectRatio="none" fill="none">
        <line x1={0} y1={12} x2={1200} y2={12} stroke={S_SLATE} strokeWidth={0.5} vectorEffect="nonScalingStroke" opacity={0.45} />
        <line x1={80} y1={8} x2={80} y2={16} stroke={TECH_BLUE} strokeWidth={0.45} vectorEffect="nonScalingStroke" opacity={0.35} />
        <line x1={1120} y1={8} x2={1120} y2={16} stroke={TECH_BLUE} strokeWidth={0.45} vectorEffect="nonScalingStroke" opacity={0.35} />
      </svg>
    </DecorRoot>
  );
}
