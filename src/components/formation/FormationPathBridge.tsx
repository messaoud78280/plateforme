import Link from "next/link";
import { TRAINING_OFFERS } from "@/lib/bework-formation";
import styles from "./FormationPathBridge.module.css";

/** Intro parcours + pont pédagogique entre Jour 1 et Jour 2. */
export function FormationPathIntro() {
  return (
    <section id="parcours" className={styles.section} aria-labelledby="path-intro-title">
      <div className={styles.shell}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>Le parcours BeWork</p>
          <h2 id="path-intro-title" className={styles.title}>
            Commencez par construire votre première version.
            <br />
            <span className={styles.accent}>Puis allez jusqu’à la mise en ligne.</span>
          </h2>
          <p className={styles.lead}>
            Une même première journée pour tous. Ensuite, poursuivez pour finaliser, publier et
            contrôler votre projet.
          </p>
        </header>

        <div className={styles.levels}>
          <article className={styles.level}>
            <p className={styles.levelMeta}>
              JOUR 1 · {TRAINING_OFFERS.essential.hours} h · {TRAINING_OFFERS.essential.price} €
            </p>
            <h3 className={styles.levelTitle}>Je construis ma première version.</h3>
          </article>
          <span className={styles.plus} aria-hidden>
            →
          </span>
          <article className={`${styles.level} ${styles.levelAccent}`}>
            <p className={styles.levelMeta}>
              JOUR 2 · +{TRAINING_OFFERS.essential.hours} h · parcours{" "}
              {TRAINING_OFFERS.complete.hours} h
            </p>
            <h3 className={styles.levelTitle}>Je finalise et je mets mon projet en ligne.</h3>
          </article>
        </div>

        <p className={styles.ctaRow}>
          <Link href="#programmes-officiels" className={styles.link}>
            Comparer les programmes officiels →
          </Link>
        </p>
      </div>
    </section>
  );
}
