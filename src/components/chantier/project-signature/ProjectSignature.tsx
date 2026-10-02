import type { ReactNode } from "react";
import Link from "next/link";
import type { CraftSignatureTone } from "@/lib/chantier/craft-signature";
import { cn } from "@/lib/cn";
import { CraftDomainChips, CraftSignatureBar } from "./CraftSignature";

export type ProjectSignatureFact = {
  value: string;
  label: string;
};

export type ProjectSignatureProps = {
  title: string;
  projectRef?: string | null;
  /** Ex. surface "120 m²" — uniquement si donnée structurée connue. */
  highlightMetric?: string | null;
  clientLabel?: string | null;
  locationLabel?: string | null;
  responsibleLabel?: string | null;
  crafts: CraftSignatureTone[];
  /** Montant / date optionnels (ligne secondaire technique). */
  secondaryFacts?: ProjectSignatureFact[];
  statusSlot: ReactNode;
  teamHref?: string | null;
  agendaHref: string;
  overflowSlot: ReactNode;
  className?: string;
};

function IdentityCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="bw-psig__cell">
      <p className="bw-psig__cell-value">{value}</p>
      <p className="bw-psig__cell-label">{label}</p>
    </div>
  );
}

/**
 * PROJECT SIGNATURE — identité numérique chantier BeWork.
 * Composition éditoriale ; données structurées uniquement.
 */
export function ProjectSignature({
  title,
  projectRef,
  highlightMetric,
  clientLabel,
  locationLabel,
  responsibleLabel,
  crafts,
  secondaryFacts,
  statusSlot,
  teamHref,
  agendaHref,
  overflowSlot,
  className,
}: ProjectSignatureProps) {
  const location = locationLabel?.trim() || null;
  const client = clientLabel?.trim() || null;
  const responsible = responsibleLabel?.trim() || "À définir";

  return (
    <header className={cn("bw-psig", className)}>
      <div className="bw-psig__grid" aria-hidden />

      <div className="bw-psig__inner">
        <div className="bw-psig__top">
          <div className="bw-psig__eyebrow">
            <span className="bw-psig__eyebrow-kicker">Chantier</span>
            {projectRef ? (
              <>
                <span className="bw-psig__eyebrow-sep" aria-hidden>
                  /
                </span>
                <span className="bw-psig__eyebrow-ref">{projectRef}</span>
              </>
            ) : null}
          </div>
          <div className="bw-psig__status">{statusSlot}</div>
        </div>

        <div className="bw-psig__title-row">
          <h1 className="bw-psig__title">{title}</h1>
          {highlightMetric ? (
            <p className="bw-psig__metric">{highlightMetric}</p>
          ) : null}
        </div>

        <CraftSignatureBar crafts={crafts} className="bw-psig__bar" />

        <div className="bw-psig__identity">
          {client ? <IdentityCell value={client} label="Client" /> : null}
          {location ? <IdentityCell value={location} label="Localisation" /> : null}
          <IdentityCell value={responsible} label="Responsable" />
        </div>

        {crafts.length > 0 ? (
          <div className="bw-psig__domains">
            <p className="bw-psig__domains-label">Domaines du chantier</p>
            <CraftDomainChips crafts={crafts} />
          </div>
        ) : null}

        {secondaryFacts && secondaryFacts.length > 0 ? (
          <div className="bw-psig__secondary">
            {secondaryFacts.map((f) => (
              <span key={`${f.label}-${f.value}`} className="bw-psig__secondary-item">
                <span className="bw-psig__secondary-value">{f.value}</span>
                <span className="bw-psig__secondary-label">{f.label}</span>
              </span>
            ))}
          </div>
        ) : null}

        <div className="bw-psig__actions">
          {teamHref ? (
            <Link href={teamHref} className="bw-psig__btn bw-psig__btn--primary">
              Message équipe
            </Link>
          ) : null}
          <Link href={agendaHref} className="bw-psig__btn">
            Agenda
          </Link>
          <div className="bw-psig__overflow">{overflowSlot}</div>
        </div>
      </div>
    </header>
  );
}
