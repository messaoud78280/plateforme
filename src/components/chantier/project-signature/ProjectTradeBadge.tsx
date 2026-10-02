import type { CraftSignatureTone } from "@/lib/chantier/craft-signature";
import { cn } from "@/lib/cn";

/** Badge métier générique — consomme tradeVisualConfig / CraftSignatureTone. */
export function ProjectTradeBadge({
  craft,
  size = "sm",
  className,
}: {
  craft: CraftSignatureTone;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bw-craft-chip",
        size === "md" && "bw-craft-chip--md",
        className,
      )}
      style={{
        ["--craft-accent" as string]: craft.accent,
        ["--craft-soft" as string]: craft.soft,
        ["--craft-border" as string]: craft.border,
      }}
    >
      <span className="bw-craft-chip__dot" aria-hidden />
      {craft.label}
    </span>
  );
}

/** Liste de badges métier avec overflow +N (tooltip des restants). */
export function ProjectTradeBadgeList({
  crafts,
  max = 3,
  size = "sm",
  className,
}: {
  crafts: CraftSignatureTone[];
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  if (crafts.length === 0) return null;
  const visible = crafts.slice(0, max);
  const rest = crafts.slice(max);
  const restTitle = rest.map((c) => c.label).join(", ");

  return (
    <ul className={cn("bw-craft-chips", className)}>
      {visible.map((craft) => (
        <li key={craft.key}>
          <ProjectTradeBadge craft={craft} size={size} />
        </li>
      ))}
      {rest.length > 0 ? (
        <li>
          <span
            className="bw-craft-chip bw-craft-chip--more"
            title={restTitle}
            aria-label={`Autres domaines : ${restTitle}`}
          >
            +{rest.length}
          </span>
        </li>
      ) : null}
    </ul>
  );
}
