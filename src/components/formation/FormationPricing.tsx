import Link from "next/link";
import {
  BEWORK_SESSION_PRICE_EUR,
  FORMATION_TARIF_INCLUDES,
} from "@/lib/bework-formation";
import styles from "./formation.module.css";

/** Tarif — un seul prix présentiel / visio (identique). */
export function FormationPricing() {
  return (
    <section id="tarif" className={styles.section} aria-labelledby="tarif-title">
      <div className={styles.shell}>
        <div className={`${styles.panel} ${styles.tarifPanel}`}>
          <div className={styles.tarifMain}>
            <p className={styles.eyebrow}>Tarif</p>
            <h2 id="tarif-title" className={`${styles.display} ${styles.tarifTitle}`}>
              La journée BeWork
            </h2>
            <p className={styles.tarifPrice}>
              {BEWORK_SESSION_PRICE_EUR}&nbsp;€
              <span>par participant</span>
            </p>
            <div className={styles.tarifFormats}>
              <span>Format principal : présentiel</span>
              <span>Sessions visio : à dates dédiées</span>
            </div>
            <div className={styles.tarifCtas}>
              <Link href="/contact#participer" className={styles.ctaPrimary}>
                Demander une place →
              </Link>
              <Link href="/contact#participer" className={styles.ctaSecondary}>
                Voir les prochaines sessions →
              </Link>
            </div>
          </div>

          <div className={styles.tarifIncludes}>
            <p className={styles.tarifIncludesLabel}>Inclus</p>
            <ul>
              {FORMATION_TARIF_INCLUDES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
