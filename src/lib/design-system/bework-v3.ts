/**
 * BeWork — tokens backgrounds / surfaces (signature visuelle globale).
 * Pas de quadrillage. Halos + dégradés uniquement.
 */

export const BW_V3 = {
  color: {
    blue: "#275BE8",
    blueStrong: "#1753FF",
    blueSoft: "#DDE9FF",
    blueIce: "#F1F6FF",
    violet: "#7657F6",
    violetSoft: "#EEE9FF",
    peach: "#FFAA78",
    peachSoft: "#FFF0E6",
    mint: "#62D9B0",
    mintSoft: "#E6FAF3",
    ink: "#0B0D12",
    text: "#42526B",
    muted: "#8190A8",
    white: "#FFFFFF",
    surface: "rgba(255,255,255,.82)",
    border: "rgba(45,75,130,.10)",
    canvas: "#F9FBFF",
    // alias legacy
    blueDeep: "#1753FF",
    blueGlacier: "#F1F6FF",
    inkSoft: "#0B0D12",
    mutedSoft: "#8190A8",
  },
  radius: {
    sm: "0.75rem",
    md: "1.1rem",
    lg: "1.5rem",
    xl: "1.75rem",
    full: "9999px",
  },
  shadow: {
    soft: "0 12px 40px rgba(30,50,90,.06)",
    lift: "0 20px 55px rgba(30,60,120,.10)",
    cta: "0 12px 30px rgba(39,91,232,.22)",
    tarif: "0 30px 80px rgba(32,62,120,.10)",
  },
  space: {
    sectionY: "py-14 sm:py-16 md:py-20 lg:py-24",
    sectionTight: "py-12 sm:py-14 md:py-16",
  },
  motion: {
    reveal: "motion-safe:animate-[home-fade-up_0.7s_ease-out_both]",
    duration: "300ms",
    ease: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
} as const;

export type BwAtmosphereVariant =
  | "hero"
  | "creation"
  | "formation"
  | "reassurance"
  | "cta"
  | "timeline"
  | "blue"
  | "creative"
  | "human"
  | "success"
  | "default"
  | "soft"
  | "violet"
  | "peach";

export type BwAtmosphereTone =
  | "hero"
  | "creation"
  | "formation"
  | "reassurance"
  | "cta"
  | "timeline";

export function normalizeAtmosphere(
  variant: BwAtmosphereVariant = "default",
): BwAtmosphereTone {
  switch (variant) {
    case "hero":
      return "hero";
    case "creation":
    case "creative":
    case "violet":
      return "creation";
    case "formation":
    case "human":
    case "peach":
      return "formation";
    case "timeline":
      return "timeline";
    case "reassurance":
    case "soft":
    case "success":
      return "reassurance";
    case "cta":
      return "cta";
    case "blue":
    case "default":
    default:
      return "hero";
  }
}
