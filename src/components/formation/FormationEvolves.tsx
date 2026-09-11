import styles from "./formation.module.css";

/** Le monde évolue — transmettre une façon de travailler. */
export function FormationEvolves() {
  return (
    <section id="evolue" className={styles.section} aria-labelledby="evolue-title">
      <div className={styles.shell}>
        <div className={`${styles.panel} ${styles.evolvesPanel}`}>
          <p className={styles.eyebrow}>Le monde évolue vite</p>
          <h2 id="evolue-title" className={`${styles.display} ${styles.evolvesTitle}`}>
            Ce que vous découvrez aujourd’hui
            <br />
            va continuer d’évoluer.
          </h2>
          <div className={styles.evolvesCopy}>
            <p>Les modèles d’intelligence artificielle évoluent rapidement.</p>
            <p>De nouvelles capacités apparaissent régulièrement.</p>
            <p>Des tâches complexes hier deviennent progressivement plus accessibles.</p>
          </div>
          <p className={styles.evolvesStatement}>
            C’est pourquoi BeWork ne veut pas seulement vous apprendre où cliquer.
            <strong>BeWork veut vous transmettre une façon de travailler.</strong>
          </p>
        </div>
      </div>
    </section>
  );
}
