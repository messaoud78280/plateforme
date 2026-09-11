import styles from "./formation.module.css";

const BEFORE = [
  "J’ai une idée",
  "Je ne sais pas coder",
  "Je dois trouver quelqu’un",
  "Je dois financer la réalisation",
  "Je dépends de compétences extérieures",
] as const;

const TODAY = [
  "J’ai une idée",
  "Je l’explique",
  "L’IA m’aide à la structurer",
  "Je commence à construire",
  "Je teste",
  "Je corrige",
  "J’améliore",
] as const;

/** Pourquoi cette journée existe — comparaison Avant / Aujourd’hui. */
export function FormationWhy() {
  return (
    <section id="presentation" className={styles.section} aria-labelledby="why-title">
      <div className={styles.shell}>
        <div className={styles.whyHead}>
          <p className={styles.eyebrow}>Pourquoi cette journée</p>
          <h2 id="why-title" className={`${styles.display} ${styles.whyTitle}`}>
            Un monde qui était technique
            <br />
            devient accessible
            <br />
            à beaucoup plus de monde.
          </h2>
        </div>

        <div className={styles.compare}>
          <div className={`${styles.panel} ${styles.compareCol}`}>
            <p className={styles.compareLabel}>Avant</p>
            <ol className={styles.compareFlow}>
              {BEFORE.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className={`${styles.panel} ${styles.compareCol} ${styles.compareToday}`}>
            <p className={styles.compareLabel}>Aujourd’hui</p>
            <ol className={styles.compareFlow}>
              {TODAY.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>

        <p className={styles.whyStatement}>
          L’IA ne remplace pas votre idée. Elle réduit la distance entre votre idée et sa
          première réalisation.
        </p>
      </div>
    </section>
  );
}
