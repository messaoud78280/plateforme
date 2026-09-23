import Link from "next/link";
import {
  QUALIOPI_COPY,
  QUALIOPI_ENGAGEMENTS,
} from "@/lib/formation-organism";
import { TrainingOrganizationCard } from "./TrainingOrganizationCard";
import styles from "./QualiopiTrustSection.module.css";

/** Section réassurance qualité — homepage (après journée, avant tarifs). */
export function QualiopiTrustSection() {
  return (
    <section
      id="qualite"
      className={styles.section}
      aria-labelledby="qualiopi-trust-title"
    >
      <div className={styles.shell}>
        <div className={styles.grid}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Un cadre professionnel reconnu</p>
            <h2 id="qualiopi-trust-title" className={styles.title}>
              Une formation concrète.
              <span className={styles.accent}> Un engagement qualité.</span>
            </h2>
            <p className={styles.lead}>{QUALIOPI_COPY.primary}</p>
            <p className={styles.leadSecondary}>
              Un cadre pédagogique structuré pour apprendre, pratiquer et progresser dans la
              réalisation de vos propres projets numériques.
            </p>

            <ul className={styles.engagements}>
              {QUALIOPI_ENGAGEMENTS.map((item) => (
                <li key={item.number}>
                  <span className={styles.engNum}>{item.number}</span>
                  <div>
                    <p className={styles.engTitle}>{item.title}</p>
                    <p className={styles.engText}>{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link href={QUALIOPI_COPY.learnMoreHref} className={styles.cta}>
              Découvrir notre organisme de formation
              <span aria-hidden>→</span>
            </Link>
          </div>

          <TrainingOrganizationCard />
        </div>
      </div>
    </section>
  );
}
