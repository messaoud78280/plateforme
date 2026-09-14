import { ProgramTimeline } from "@/components/formation/ProgramTimeline";
import { DAY_TWO_STEPS } from "@/components/formation/programme/dayTwo";
import styles from "./FormationDayTwo.module.css";

/** Programme Jour 2 — timeline interactive réutilisant ProgramTimeline. */
export function FormationDayTwo() {
  return (
    <section
      id="programme-jour-2"
      className={styles.section}
      aria-labelledby="day2-title"
    >
      <div className={styles.shell}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>Jour 2 · 7 h supplémentaires</p>
          <h2 id="day2-title" className={styles.title}>
            Construire plus loin.
          </h2>
          <p className={styles.lead}>
            Le deuxième jour est consacré à la pratique, à l’approfondissement et à votre propre
            projet.
          </p>
        </header>

        <ProgramTimeline
          steps={DAY_TWO_STEPS}
          ariaLabel="Programme du Jour 2"
        />
      </div>
    </section>
  );
}
