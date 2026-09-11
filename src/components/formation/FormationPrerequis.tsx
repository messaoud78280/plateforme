import styles from "./formation.module.css";

const BRING = [
  "Ordinateur portable",
  "Chargeur",
  "Accès à votre email",
  "Navigateur récent",
  "Droits d’installation sur la machine",
  "Éventuellement une idée de projet",
  "Connexion Internet (session visio)",
] as const;

const COMPUTER = [
  "Windows ou Mac relativement récent",
  "8 Go de RAM minimum recommandés",
  "16 Go = plus confortable",
  "Quelques Go d’espace disponible",
] as const;

const NOT_NEEDED = [
  "Carte graphique dédiée",
  "Ordinateur gaming",
  "Machine haut de gamme",
  "Connaissances en programmation",
  "Expérience en création de sites",
  "Connaissance préalable de l’IA",
] as const;

/** Prérequis — rassurer sans jargon technique. */
export function FormationPrerequis() {
  return (
    <section id="prerequis" className={styles.section} aria-labelledby="prerequis-title">
      <div className={styles.shell}>
        <div className={styles.prereqHead}>
          <p className={styles.eyebrow}>Ce qu’il vous faut</p>
          <h2 id="prerequis-title" className={`${styles.display} ${styles.prereqTitle}`}>
            Pas besoin
            <br />
            d’un ordinateur
            <br />
            de développeur.
          </h2>
        </div>

        <div className={styles.prereqGrid}>
          <article className={`${styles.panel} ${styles.prereqCard}`}>
            <h3 className={styles.prereqCardTitle}>À apporter</h3>
            <ul className={styles.prereqList}>
              {BRING.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className={`${styles.panel} ${styles.prereqCard}`}>
            <h3 className={styles.prereqCardTitle}>Ordinateur recommandé</h3>
            <ul className={styles.prereqList}>
              {COMPUTER.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className={`${styles.panel} ${styles.prereqCard} ${styles.prereqCardMuted}`}>
            <h3 className={styles.prereqCardTitle}>Pas nécessaire</h3>
            <ul className={styles.prereqList}>
              {NOT_NEEDED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className={`${styles.panel} ${styles.prereqSignature}`}>
          <p>
            Un ordinateur. Une connexion. Une idée.
            <span>Et l’envie d’essayer.</span>
          </p>
        </div>

        <p className={styles.prereqNote}>
          Si votre ordinateur appartient à votre entreprise, vérifiez que vous avez le droit
          d’installer les applications nécessaires.
        </p>

        <div className={`${styles.panel} ${styles.formatCard} ${styles.prereqVisio}`}>
          <p className={styles.eyebrow}>Session visio</p>
          <h3 className={styles.formatCardTitle}>Pour participer à distance</h3>
          <ul className={styles.formatList}>
            {[
              "Connexion Internet stable",
              "Webcam recommandée",
              "Microphone",
              "Possibilité de partager son écran",
              "Environnement calme",
              "Ordinateur avec droits d’installation",
            ].map((item) => (
              <li key={item}>
                <span className={styles.formatListMark} aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <p className={styles.formatFoot}>
            Une courte vérification technique pourra être proposée avant la session, afin
            d’éviter de perdre du temps le jour J.
          </p>
        </div>
      </div>
    </section>
  );
}
