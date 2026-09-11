import Image from "next/image";
import { FORMATION_INTERACTIVE_BEATS } from "@/lib/bework-formation";
import styles from "./formation.module.css";

/** À quoi s’attendre — journée à essayer, pas à regarder. */
export function FormationInteractive() {
  return (
    <section id="interactive" className={styles.section} aria-labelledby="interactive-title">
      <div className={styles.shell}>
        <div className={styles.interactLayout}>
          <div className={styles.interactCopy}>
            <p className={styles.eyebrow}>À quoi vous attendre</p>
            <h2 id="interactive-title" className={`${styles.display} ${styles.interactTitle}`}>
              Pas une journée
              <br />
              à regarder.
              <br />
              <span className={styles.gradientText}>Une journée à essayer.</span>
            </h2>
            <p className={`${styles.lead} ${styles.interactLead}`}>
              Peu de théorie longue. Beaucoup de démonstrations, d’essais, de questions, de
              manipulations, d’exemples et d’échanges.
            </p>
            <p className={styles.interactStatement}>C’est une journée interactive.</p>
          </div>

          <div className={styles.interactMedia}>
            <div className={styles.interactPhoto}>
              <Image
                src="/marketing/journee-bework.jpg"
                alt="Participants à une journée BeWork, ordinateurs ouverts, en train d’essayer."
                fill
                sizes="(max-width: 900px) 100vw, 48vw"
                className={styles.interactImg}
              />
            </div>
          </div>
        </div>

        <ol className={styles.interactBeats}>
          {FORMATION_INTERACTIVE_BEATS.map((beat, i) => (
            <li key={beat}>
              <span className={styles.interactBeatNum}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.interactBeatText}>{beat}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
