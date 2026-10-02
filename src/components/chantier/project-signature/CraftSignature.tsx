import type { CraftSignatureTone } from "@/lib/chantier/craft-signature";
import { cn } from "@/lib/cn";
import { ProjectTradeBadgeList } from "./ProjectTradeBadge";

/** Barre segmentée — signature visuelle des domaines présents. */
export function CraftSignatureBar({
  crafts,
  className,
}: {
  crafts: CraftSignatureTone[];
  className?: string;
}) {
  if (crafts.length === 0) {
    return (
      <div
        className={cn("bw-craft-bar bw-craft-bar--empty", className)}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn("bw-craft-bar", className)}
      role="img"
      aria-label={`Domaines : ${crafts.map((c) => c.label).join(", ")}`}
    >
      {crafts.map((craft) => (
        <span
          key={craft.key}
          className="bw-craft-bar__segment"
          style={{ background: craft.accent }}
          title={craft.label}
        />
      ))}
    </div>
  );
}

/** @deprecated Préférer ProjectTradeBadgeList — alias de compatibilité. */
export function CraftDomainChips({
  crafts,
  className,
  max = 8,
}: {
  crafts: CraftSignatureTone[];
  className?: string;
  max?: number;
}) {
  return (
    <ProjectTradeBadgeList crafts={crafts} max={max} size="md" className={className} />
  );
}

export { ProjectTradeBadge, ProjectTradeBadgeList } from "./ProjectTradeBadge";
