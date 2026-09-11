import { FORMATION_PROJECT_STEPS } from "@/lib/bework-formation";
import styles from "./formation.module.css";

/** Venir avec son idée — structuration progressive. */
export function FormationOwnProject() {
  return (
    <section id="projet" className={styles.section} aria-labelledby="projet-title">
      <div className={styles.shell}>
        <div className={styles.projectLayout}>
          <div>
            <p className={styles.eyebrow}>Votre propre projet</p>
            <h2 id="projet-title" className={`${styles.display} ${styles.projectTitle}`}>
              Vous pouvez aussi
              <br />
              venir avec votre idée.
            </h2>
            <p className={`${styles.lead} ${styles.projectLead}`}>
              Une idée n’a pas besoin d’être parfaitement définie avant la journée. Nous vous
              montrerons comment commencer à la structurer.
            </p>
          </div>

          <div className={`${styles.panel} ${styles.projectPanel}`}>
            <p className={styles.projectSeed}>« J’aimerais créer quelque chose pour… »</p>
            <ol className={styles.projectFlow}>
              {FORMATION_PROJECT_STEPS.map((step) => (
                <li key={step.label}>
                  <span className={styles.projectLabel}>{step.label}</span>
                  <span className={styles.projectHint}>{step.hint}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
