import { FORMATION_REORIENT_PATH } from "@/lib/bework-formation";
import styles from "./formation.module.css";

/** Réorientation — ouvrir une possibilité, pas promettre une reconversion. */
export function FormationReorientation() {
  return (
    <section id="possibilite" className={styles.section} aria-labelledby="reorient-title">
      <div className={styles.shell}>
        <div className={styles.reorientLayout}>
          <div>
            <p className={styles.eyebrow}>Nouvelle possibilité</p>
            <h2 id="reorient-title" className={`${styles.display} ${styles.reorientTitle}`}>
              Et si vous découvriez
              <br />
              que vous pouvez faire
              <br />
              des choses que vous
              <br />
              ne pensiez pas accessibles ?
            </h2>
            <div className={styles.reorientCopy}>
              <p>
                Une journée ne suffit évidemment pas à apprendre un nouveau métier.
              </p>
              <p>
                Mais elle peut suffire pour comprendre une nouvelle manière de créer, provoquer un
                déclic et vous donner une méthode pour commencer.
              </p>
              <p>
                Et si vous souhaitez transformer ce premier déclic en davantage de pratique, vous
                pouvez poursuivre avec une deuxième journée.
              </p>
              <p>
                <strong>Commencez. Testez. Puis décidez si vous voulez aller plus loin.</strong>
              </p>
            </div>
          </div>

          <div className={`${styles.panel} ${styles.reorientPanel}`}>
            <ol className={styles.reorientPath}>
              {FORMATION_REORIENT_PATH.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className={styles.reorientStatement}>
              On ne vous promet pas une reconversion.
              <strong>On vous montre une possibilité.</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
