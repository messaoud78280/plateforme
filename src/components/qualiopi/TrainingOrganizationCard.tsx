import Link from "next/link";
import {
  FORMATION_LEGAL_ENTITY,
  QUALIOPI_CERTIFICATION,
  QUALIOPI_COPY,
} from "@/lib/formation-organism";
import { QualiopiMark } from "./QualiopiMark";
import { QualiopiCertificateActions } from "./QualiopiCertificateActions";
import styles from "./TrainingOrganizationCard.module.css";

type Props = {
  /** Afficher les actions PDF. */
  showCertificateActions?: boolean;
  className?: string;
};

/** Carte institutionnelle OFC + Qualiopi. */
export function TrainingOrganizationCard({
  showCertificateActions = true,
  className,
}: Props) {
  return (
    <article
      className={[styles.card, className].filter(Boolean).join(" ")}
      aria-labelledby="org-card-title"
    >
      <QualiopiMark variant="card" />
      <h3 id="org-card-title" className={styles.title}>
        {FORMATION_LEGAL_ENTITY.legalNameDisplay}
      </h3>
      <p className={styles.role}>Organisme de formation certifié</p>
      <dl className={styles.dl}>
        <div>
          <dt>Catégorie</dt>
          <dd>{QUALIOPI_CERTIFICATION.categoryLabel}</dd>
        </div>
        <div>
          <dt>Certificateur</dt>
          <dd>{QUALIOPI_CERTIFICATION.certificator}</dd>
        </div>
        <div>
          <dt>Certificat</dt>
          <dd>n° {QUALIOPI_CERTIFICATION.certificateNumber}</dd>
        </div>
        <div>
          <dt>Validité</dt>
          <dd>
            {QUALIOPI_CERTIFICATION.validFromLabel} → {QUALIOPI_CERTIFICATION.validToLabel}
          </dd>
        </div>
      </dl>
      <p className={styles.note}>{QUALIOPI_CERTIFICATION.surveillanceNote}</p>
      {showCertificateActions ? <QualiopiCertificateActions /> : null}
      <Link href={QUALIOPI_COPY.learnMoreHref} className={styles.more}>
        {QUALIOPI_COPY.learnMoreLabel} →
      </Link>
    </article>
  );
}
