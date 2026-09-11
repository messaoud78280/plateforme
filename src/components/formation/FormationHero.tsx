import Link from "next/link";
import styles from "./formation.module.css";

/** Hero — promesse centrale de la journée BeWork. */
export function FormationHero() {
  return (
    <section className={styles.hero} aria-labelledby="formation-hero-title">
      <div className={styles.heroBg} aria-hidden />
      <div className={styles.shell}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>La journée BeWork</p>

          <h1 id="formation-hero-title" className={`${styles.display} ${styles.heroTitle}`}>
            <span className={styles.heroTitleLine}>Vous n’avez pas</span>
            <span className={styles.heroTitleLine}>appris à coder.</span>
            <span className={styles.heroTitleLine}>
              <span className={styles.gradientText}>Ce n’est plus une barrière</span>
            </span>
            <span className={styles.heroTitleLine}>pour commencer.</span>
          </h1>

          <p className={`${styles.lead} ${styles.heroLead}`}>
            Une journée pratique pour découvrir comment transformer vos idées en sites,
            applications et outils numériques avec l’intelligence artificielle — même si vous
            partez de zéro.
          </p>

          <p className={styles.reassure}>
            <span className={styles.reassureDot} aria-hidden />
            Aucune connaissance en programmation n’est nécessaire.
          </p>

          <div className={styles.formatStrip} aria-label="Formats de participation">
            <span className={`${styles.formatChip} ${styles.formatChipPrimary}`}>
              Principalement en présentiel
            </span>
            <span className={styles.formatChip}>Sessions visio à dates dédiées</span>
          </div>

          <p className={styles.formatNote}>
            Nous privilégions le présentiel pour vous accompagner au plus près pendant les
            installations, les essais et les premières créations. Des sessions en
            visioconférence sont également organisées pour les personnes qui ne peuvent pas se
            déplacer.
          </p>

          <div className={styles.ctaRow}>
            <a href="#programme" className={styles.ctaPrimary}>
              Découvrir le programme ↓
            </a>
            <Link href="/demonstrations" className={styles.ctaSecondary}>
              Voir ce qu’il est possible de créer →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
