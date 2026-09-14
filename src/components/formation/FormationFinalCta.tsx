import Link from "next/link";
import styles from "./formation.module.css";

/** Message final — conclusion avec autorité. */
export function FormationFinalCta() {
  return (
    <section id="cta-final" className={styles.finalSection} aria-labelledby="final-title">
      <div className={styles.shell}>
        <div className={`${styles.panel} ${styles.finalPanel}`}>
          <p className={styles.eyebrow}>Prêt à commencer&nbsp;?</p>
          <h2 id="final-title" className={`${styles.display} ${styles.finalTitle}`}>
            Une journée pour apprendre à commencer.
            <br />
            <span className={styles.gradientText}>Deux pour construire plus loin.</span>
          </h2>

          <p className={styles.finalLead}>
            Choisissez le parcours qui vous correspond aujourd’hui. Vous pourrez toujours décider
            d’aller plus loin ensuite.
          </p>
          <p className={styles.finalAccent}>
            Votre prochaine idée mérite peut-être simplement une première tentative.
          </p>

          <div className={styles.finalCtas}>
            <Link href="/contact#participer" className={styles.ctaPrimary}>
              Découvrir les prochaines sessions →
            </Link>
            <Link href="#tarif" className={styles.ctaSecondary}>
              Comparer les parcours →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
