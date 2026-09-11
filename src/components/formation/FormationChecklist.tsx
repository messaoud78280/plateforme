import {
  FORMATION_CHECKLIST_ONSITE,
  FORMATION_CHECKLIST_VISIO,
} from "@/lib/bework-formation";
import styles from "./formation.module.css";

/** Checklist Jour J. */
export function FormationChecklist() {
  return (
    <section id="jour-j" className={styles.section} aria-labelledby="jourj-title">
      <div className={styles.shell}>
        <div className={styles.checklistHead}>
          <p className={styles.eyebrow}>Jour J</p>
          <h2 id="jourj-title" className={`${styles.display} ${styles.checklistTitle}`}>
            Avant de venir.
          </h2>
        </div>

        <div className={styles.checklistGrid}>
          <article className={`${styles.panel} ${styles.checklistCard}`}>
            <h3 className={styles.checklistCardTitle}>Présentiel</h3>
            <ul className={styles.checklistList}>
              {FORMATION_CHECKLIST_ONSITE.map((item) => (
                <li key={item}>
                  <span className={styles.checkMark} aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className={`${styles.panel} ${styles.checklistCard}`}>
            <h3 className={styles.checklistCardTitle}>Pour la visio</h3>
            <ul className={styles.checklistList}>
              {FORMATION_CHECKLIST_VISIO.map((item) => (
                <li key={item}>
                  <span className={styles.checkMark} aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>

        <p className={styles.checklistStatement}>
          Vous apportez votre ordinateur.
          <span>Nous construisons la journée ensemble.</span>
        </p>
      </div>
    </section>
  );
}
