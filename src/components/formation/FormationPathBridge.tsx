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
            Commencez par apprendre à créer.
            <br />
            <span className={styles.accent}>Puis choisissez jusqu’où vous voulez aller.</span>
          </h2>
          <p className={styles.lead}>
            Une même première journée pour tous. Ensuite, poursuivez si vous souhaitez
            pratiquer davantage et construire plus loin.
          </p>
        </header>

        <div className={styles.levels}>
          <article className={styles.level}>
            <p className={styles.levelMeta}>
              {TRAINING_OFFERS.essential.days} jour · {TRAINING_OFFERS.essential.hours} h
            </p>
            <h3 className={styles.levelTitle}>{TRAINING_OFFERS.essential.title}</h3>
          </article>
          <span className={styles.plus} aria-hidden>
            →
          </span>
          <article className={`${styles.level} ${styles.levelAccent}`}>
            <p className={styles.levelMeta}>
              {TRAINING_OFFERS.complete.days} jours · {TRAINING_OFFERS.complete.hours} h
            </p>
            <h3 className={styles.levelTitle}>{TRAINING_OFFERS.complete.title}</h3>
          </article>
        </div>

        <p className={styles.ctaRow}>
          <Link href="#tarif" className={styles.link}>
            Comparer les parcours →
          </Link>
        </p>
      </div>
    </section>
  );
}
