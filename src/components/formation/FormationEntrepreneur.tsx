import { FORMATION_BUSINESS_NEEDS } from "@/lib/bework-formation";
import styles from "./formation.module.css";

/** Entreprendre avec plus d’autonomie — honnête sur les limites. */
export function FormationEntrepreneur() {
  return (
    <section id="entreprendre" className={styles.section} aria-labelledby="entreprendre-title">
      <div className={styles.shell}>
        <div className={styles.entreHead}>
          <p className={styles.eyebrow}>Entreprendre</p>
          <h2 id="entreprendre-title" className={`${styles.display} ${styles.entreTitle}`}>
            Lancer une activité
            <br />
            ne devrait pas s’arrêter à :
            <br />
            <span className={styles.gradientText}>
              « Je n’ai pas les moyens de faire développer ça. »
            </span>
          </h2>
          <p className={`${styles.lead} ${styles.entreLead}`}>
            Lorsqu’on débute, chaque euro compte. Certains de ces outils peuvent désormais être
            commencés par vous-même.
          </p>
        </div>

        <ul className={styles.entreNeeds}>
          {FORMATION_BUSINESS_NEEDS.map((need) => (
            <li key={need}>{need}</li>
          ))}
        </ul>

        <div className={`${styles.panel} ${styles.entreNote}`}>
          <p>
            Cela ne signifie pas qu’une agence ou un développeur ne seront plus jamais
            nécessaires.
          </p>
          <p>
            <strong>
              Cela signifie que vous pourrez faire davantage vous-même, comprendre ce que vous
              construisez et choisir plus intelligemment ce que vous souhaitez déléguer.
            </strong>
          </p>
        </div>
      </div>
    </section>
  );
}
