import styles from "./formation.module.css";

/** Apprendre à apprendre — compétence centrale BeWork. */
export function FormationLearnToLearn() {
  return (
    <section id="apprendre" className={styles.section} aria-labelledby="apprendre-title">
      <div className={styles.shell}>
        <div className={styles.learnLayout}>
          <div>
            <p className={styles.eyebrow}>Apprendre avec l’IA</p>
            <h2 id="apprendre-title" className={`${styles.display} ${styles.learnTitle}`}>
              La compétence
              <br />
              la plus importante
              <br />
              n’est peut-être plus
              <br />
              de tout savoir.
              <br />
              <span className={styles.gradientText}>C’est de savoir comment apprendre.</span>
            </h2>
          </div>

          <div className={styles.learnCopy}>
            <p className={styles.lead}>
              Lorsque vous rencontrerez quelque chose que vous ne connaissez pas, vous pourrez
              demander une explication, un exemple, une correction ou une autre solution.
            </p>
            <p className={styles.lead}>
              Vous découvrirez comment utiliser l’IA comme accompagnateur d’apprentissage pendant
              votre projet.
            </p>
            <div className={`${styles.panel} ${styles.learnStatement}`}>
              <p>
                Vous ne repartez pas avec toutes les réponses.
                <span>Vous repartez avec une nouvelle manière de les chercher.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
