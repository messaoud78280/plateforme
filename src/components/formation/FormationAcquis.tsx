import { FORMATION_ACQUIS } from "@/lib/bework-formation";
import styles from "./formation.module.css";

/** Acquis — parcours de capacités, sans promesse de maîtrise. */
export function FormationAcquis() {
  return (
    <section id="acquis" className={styles.section} aria-labelledby="acquis-title">
      <div className={styles.shell}>
        <div className={styles.acquisHead}>
          <p className={styles.eyebrow}>Ce que vous aurez déjà acquis</p>
          <h2 id="acquis-title" className={`${styles.display} ${styles.acquisTitle}`}>
            À 9h, vous arrivez peut-être
            <br />
            avec une simple idée.
            <br />
            <span className={styles.gradientText}>À 17h, vous saurez comment commencer.</span>
          </h2>
          <p className={styles.acquisLead}>
            À la fin de la journée, vous aurez découvert comment :
          </p>
        </div>

        <ol className={styles.acquisTrack}>
          {FORMATION_ACQUIS.map((item, i) => (
            <li key={item.verb} className={styles.acquisItem}>
              <span className={styles.acquisIndex}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className={styles.acquisVerb}>{item.verb}</p>
                <p className={styles.acquisText}>{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
