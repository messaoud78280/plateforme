import Link from "next/link";
import styles from "./formation.module.css";

/** Message final — conclusion avec autorité. */
export function FormationFinalCta() {
  return (
    <section id="cta-final" className={styles.finalSection} aria-labelledby="final-title">
      <div className={styles.shell}>
        <div className={`${styles.panel} ${styles.finalPanel}`}>
          <p className={styles.eyebrow}>Conclusion</p>
          <h2 id="final-title" className={`${styles.display} ${styles.finalTitle}`}>
            Pendant longtemps,
            <br />
            ne pas savoir coder
            <br />
            pouvait vous empêcher
            <br />
            de commencer.
            <br />
            <span className={styles.gradientText}>Ce n’est plus aussi vrai qu’avant.</span>
          </h2>

          <p className={styles.finalLead}>
            L’IA ne supprime pas l’apprentissage. Elle vous donne un moyen complètement nouveau
            d’apprendre pendant que vous créez.
          </p>
          <p className={styles.finalAccent}>
            Votre prochaine idée mérite peut-être simplement une première tentative.
          </p>

          <div className={styles.finalCtas}>
            <Link href="/contact#participer" className={styles.ctaPrimary}>
              Demander une place →
            </Link>
            <Link href="/contact#participer" className={styles.ctaSecondary}>
              Voir les prochaines sessions →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
