import styles from "./formation.module.css";

const AI_CAN = [
  "Expliquer",
  "Proposer",
  "Montrer",
  "Analyser",
  "Corriger",
  "Suggérer une autre approche",
] as const;

const KEEP = ["Votre idée", "Vos décisions", "Votre jugement", "Votre validation"] as const;

/** Ce que l’IA change réellement — sans promesse irréaliste. */
export function FormationAiChange() {
  return (
    <section id="ia" className={`${styles.section} ${styles.aiSection}`} aria-labelledby="ai-title">
      <div className={styles.shell}>
        <div className={styles.aiGrid}>
          <div>
            <p className={styles.eyebrow}>Ce que l’IA change</p>
            <h2 id="ai-title" className={`${styles.display} ${styles.aiTitle}`}>
              Vous n’avez plus besoin
              <br />
              de tout savoir
              <br />
              avant de commencer.
            </h2>
            <p className={`${styles.lead} ${styles.aiLead}`}>
              Lorsqu’un problème apparaît, l’IA peut vous accompagner pendant que vous
              construisez. Vous progressez en faisant — pas seulement en écoutant.
            </p>
            <ul className={styles.aiCan}>
              {AI_CAN.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <aside className={`${styles.panel} ${styles.keepPanel}`}>
            <p className={styles.keepLabel}>Ce qui reste à vous</p>
            <ul className={styles.keepList}>
              {KEEP.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className={styles.aiClosing}>
              <strong>L’objectif n’est pas de laisser l’IA décider à votre place.</strong>
              <br />
              C’est d’apprendre à travailler avec elle.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
