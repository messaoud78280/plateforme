import type { ChantierStatus } from "@prisma/client";
import type { CraftSignatureTone } from "@/lib/chantier/craft-signature";
import { cn } from "@/lib/cn";
import { CraftSignatureBar } from "./CraftSignature";
import { ProjectMetaItem } from "./ProjectMetaItem";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { ProjectTradeBadgeList } from "./ProjectTradeBadge";

export type ProjectSignatureCompactProps = {
  title: string;
  status: ChantierStatus;
  statusLabel?: string | null;
  clientLabel?: string | null;
  /** Ville prioritaire (identité). */
  cityLabel?: string | null;
  /** Adresse complète — sr-only / contexte. */
  addressTitle?: string | null;
  crafts: CraftSignatureTone[];
  /** Densité liste vs grille. */
  density?: "list" | "grid";
  /** Afficher le responsable (souvent superflu si rappel à droite). */
  showResponsible?: boolean;
  responsibleLabel?: string | null;
  className?: string;
  /** Heading level — h2 en liste. */
  titleAs?: "h2" | "h3" | "p";
};

/**
 * PROJECT SIGNATURE compacte — même langage que la fiche détail.
 * Pilotage / modules restent hors de ce composant.
 */
export function ProjectSignatureCompact({
  title,
  status,
  statusLabel,
  clientLabel,
  cityLabel,
  addressTitle,
  crafts,
  density = "list",
  showResponsible = false,
  responsibleLabel,
  className,
  titleAs = "h2",
}: ProjectSignatureCompactProps) {
  const client = clientLabel?.trim() || "À définir";
  const city = cityLabel?.trim() || null;
  const maxCrafts = density === "grid" ? 3 : 2;
  const TitleTag = titleAs;

  return (
    <div
      className={cn(
        "bw-psig bw-psig--compact bw-psig--embedded",
        density === "grid" && "bw-psig--grid",
        className,
      )}
    >
      <div className="bw-psig__inner bw-psig__inner--compact">
        <div className="bw-psig__top">
          <ProjectStatusBadge status={status} label={statusLabel} size="sm" />
        </div>

        <TitleTag className="bw-psig__title bw-psig__title--compact line-clamp-2">
          {title}
        </TitleTag>

        <CraftSignatureBar crafts={crafts} className="bw-psig__bar bw-psig__bar--compact" />

        <div className="bw-psig__identity bw-psig__identity--compact">
          <ProjectMetaItem
            value={client}
            label="Client"
            empty={!clientLabel?.trim()}
          />
          <ProjectMetaItem
            value={city || "À définir"}
            label="Localisation"
            empty={!city}
          />
          {showResponsible ? (
            <ProjectMetaItem
              value={responsibleLabel?.trim() || "À définir"}
              label="Responsable"
              empty={!responsibleLabel?.trim()}
            />
          ) : null}
        </div>

        {addressTitle ? (
          <span className="sr-only">Adresse : {addressTitle}</span>
        ) : null}

        {crafts.length > 0 ? (
          <ProjectTradeBadgeList crafts={crafts} max={maxCrafts} size="sm" />
        ) : null}
      </div>
    </div>
  );
}
