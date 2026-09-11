import { FORMATION_AUDIENCE } from "@/lib/bework-formation";
import styles from "./formation.module.css";

/** À qui s’adresse la journée — profils ouverts, sans exclusion. */
export function FormationAudience() {
  return (
    <section id="pour-qui" className={styles.section} aria-labelledby="audience-title">
      <div className={styles.shell}>
        <div className={styles.audienceHead}>
          <p className={styles.eyebrow}>Pour qui</p>
          <h2 id="audience-title" className={`${styles.display} ${styles.audienceTitle}`}>
            Vous avez une idée,
            <br />
            un métier
            <br />
            ou simplement de la curiosité ?
          </h2>
        </div>

        <ul className={styles.audienceGrid}>
          {FORMATION_AUDIENCE.map((profile) => (
            <li key={profile.title} className={`${styles.panel} ${styles.audienceCard}`}>
              <h3 className={styles.audienceName}>{profile.title}</h3>
              <p className={styles.audienceText}>{profile.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
