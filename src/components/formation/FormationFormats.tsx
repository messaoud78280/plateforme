import styles from "./formation.module.css";

const PRESENTIEL = [
  "Accompagnement très direct",
  "Installation guidée",
  "Échanges avec le groupe",
  "Aide immédiate",
  "Démonstrations collectives",
  "Pratique sur votre propre ordinateur",
] as const;

const VISIO = [
  "Session en visioconférence",
  "Même philosophie pédagogique",
  "Démonstrations en direct",
  "Partage d’écran",
  "Accompagnement pendant les manipulations",
  "Ordinateur et connexion Internet indispensables",
] as const;

/** Formats — présentiel prioritaire, sessions visio dédiées. */
export function FormationFormats() {
  return (
    <section id="formats" className={styles.section} aria-labelledby="formats-title">
      <div className={styles.shell}>
        <div className={styles.formatsHead}>
          <p className={styles.eyebrow}>Comment participer ?</p>
          <h2 id="formats-title" className={`${styles.display} ${styles.formatsTitle}`}>
            Deux formats.
            <br />
            Une même ambition.
          </h2>
        </div>

        <div className={styles.formatsGrid}>
          <article className={`${styles.panel} ${styles.formatCard}`}>
            <span className={styles.formatBadge}>Recommandé</span>
            <p className={styles.eyebrow}>Option 1 — Présentiel</p>
            <h3 className={styles.formatCardTitle}>
              Une journée ensemble,
              <br />
              ordinateur ouvert.
            </h3>
            <p className={styles.formatCardLead}>
              C’est le format que nous privilégions. Nous pouvons vous accompagner directement
              pendant l’installation, observer ce qui se passe sur votre écran, répondre aux
              questions et intervenir immédiatement lorsque vous bloquez.
            </p>
            <ul className={styles.formatList}>
              {PRESENTIEL.map((item) => (
                <li key={item}>
                  <span className={styles.formatListMark} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className={`${styles.panel} ${styles.formatCard}`}>
            <p className={styles.eyebrow}>Option 2 — Visio</p>
            <h3 className={styles.formatCardTitle}>
              Vous ne pouvez pas
              <br />
              vous déplacer ?
            </h3>
            <p className={styles.formatCardLead}>
              Nous organisons également des sessions entièrement à distance, à des dates
              dédiées.
            </p>
            <ul className={styles.formatList}>
              {VISIO.map((item) => (
                <li key={item}>
                  <span className={styles.formatListMark} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className={styles.formatFoot}>
              Les sessions distancielles sont dédiées : elles ne mélangent pas participants
              présents et participants à distance.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
