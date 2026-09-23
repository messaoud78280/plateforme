import {
  QUALIOPI_CERTIFICATION,
} from "@/lib/formation-organism";
import styles from "./QualiopiCertificateActions.module.css";

/** Consulter / télécharger le certificat PDF officiel. */
export function QualiopiCertificateActions({
  className,
}: {
  className?: string;
}) {
  const href = QUALIOPI_CERTIFICATION.certificatePdfHref;
  return (
    <div className={[styles.row, className].filter(Boolean).join(" ")}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.secondary}
        aria-label="Consulter le certificat Qualiopi d’OFC Création d’entreprise"
      >
        Consulter le certificat
      </a>
      <a
        href={href}
        download
        className={styles.primary}
        aria-label={QUALIOPI_CERTIFICATION.certificatePdfLabel}
      >
        Télécharger le certificat PDF
      </a>
    </div>
  );
}
