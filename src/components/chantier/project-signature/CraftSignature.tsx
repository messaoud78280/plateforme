import type { CraftSignatureTone } from "@/lib/chantier/craft-signature";
import { cn } from "@/lib/cn";

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

/** Pastilles domaines du chantier. */
export function CraftDomainChips({
  crafts,
  className,
  max = 8,
}: {
  crafts: CraftSignatureTone[];
  className?: string;
  max?: number;
}) {
  if (crafts.length === 0) return null;
  const visible = crafts.slice(0, max);
  const rest = crafts.length - visible.length;

  return (
    <ul className={cn("bw-craft-chips", className)}>
      {visible.map((craft) => (
        <li key={craft.key}>
          <span
            className="bw-craft-chip"
            style={{
              ["--craft-accent" as string]: craft.accent,
              ["--craft-soft" as string]: craft.soft,
              ["--craft-border" as string]: craft.border,
            }}
          >
            <span className="bw-craft-chip__dot" aria-hidden />
            {craft.label}
          </span>
        </li>
      ))}
      {rest > 0 ? (
        <li>
          <span className="bw-craft-chip bw-craft-chip--more">+{rest}</span>
        </li>
      ) : null}
    </ul>
  );
}
