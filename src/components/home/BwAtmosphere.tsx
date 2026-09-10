import {
  normalizeAtmosphere,
  type BwAtmosphereVariant,
} from "@/lib/design-system/bework-v3";

type Halo = "blue" | "violet" | "peach" | "mint";

const HALOS: Record<
  ReturnType<typeof normalizeAtmosphere>,
  { kind: Halo; className: string }[]
> = {
  hero: [
    { kind: "blue", className: "bw-halo bw-halo--blue bw-halo--hero-1" },
    { kind: "violet", className: "bw-halo bw-halo--violet bw-halo--hero-2" },
    { kind: "peach", className: "bw-halo bw-halo--peach bw-halo--hero-3" },
  ],
  creation: [
    { kind: "blue", className: "bw-halo bw-halo--blue bw-halo--creation-1" },
    { kind: "violet", className: "bw-halo bw-halo--violet bw-halo--creation-2" },
    { kind: "peach", className: "bw-halo bw-halo--peach bw-halo--creation-3" },
  ],
  formation: [
    { kind: "peach", className: "bw-halo bw-halo--peach bw-halo--formation-1" },
    { kind: "blue", className: "bw-halo bw-halo--blue bw-halo--formation-2" },
    { kind: "violet", className: "bw-halo bw-halo--violet bw-halo--formation-3" },
  ],
  timeline: [
    { kind: "blue", className: "bw-halo bw-halo--blue bw-halo--timeline-1" },
    { kind: "violet", className: "bw-halo bw-halo--violet bw-halo--timeline-2" },
  ],
  reassurance: [
    { kind: "blue", className: "bw-halo bw-halo--blue bw-halo--reassure-1" },
    { kind: "mint", className: "bw-halo bw-halo--mint bw-halo--reassure-2" },
  ],
  cta: [
    { kind: "blue", className: "bw-halo bw-halo--blue bw-halo--cta-1" },
    { kind: "violet", className: "bw-halo bw-halo--violet bw-halo--cta-2" },
    { kind: "peach", className: "bw-halo bw-halo--peach bw-halo--cta-3" },
  ],
};

/**
 * Atmosphère de section — fond dégradé + halos indépendants.
 * Aucun quadrillage. Animations discrètes (prefers-reduced-motion).
 */
export function BwAtmosphere({
  variant = "hero",
  animated = true,
}: {
  variant?: BwAtmosphereVariant;
  animated?: boolean;
}) {
  const tone = normalizeAtmosphere(variant);
  const halos = HALOS[tone];

  return (
    <div
      className={`bw-atmosphere bw-atmosphere--${tone}${animated ? " bw-atmosphere--animated" : ""}`}
      aria-hidden
    >
      {halos.map((h) => (
        <span key={h.className} className={h.className} />
      ))}
    </div>
  );
}
