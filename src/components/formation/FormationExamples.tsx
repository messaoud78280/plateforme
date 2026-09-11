import Link from "next/link";
import { FORMATION_CREATION_EXAMPLES } from "@/lib/bework-formation";
import styles from "./formation.module.css";

/** Showroom exemples + teaser familles d’agents (sans dupliquer la homepage). */
export function FormationExamples() {
  return (
    <>
      <section id="exemples" className={styles.section} aria-labelledby="exemples-title">
        <div className={styles.shell}>
          <div className={styles.examplesHead}>
            <p className={styles.eyebrow}>Exemples de création</p>
            <h2 id="exemples-title" className={`${styles.display} ${styles.examplesTitle}`}>
              Voir ce qu’il est
              <br />
              possible de commencer
              <br />
              à construire.
            </h2>
            <p className={`${styles.lead} ${styles.examplesLead}`}>
              Des exemples concrets — sans données réelles — pour vous projeter. La plateforme
              propose des démonstrations interactives pour aller plus loin.
            </p>
          </div>

          <ul className={styles.examplesGrid}>
            {FORMATION_CREATION_EXAMPLES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className={styles.examplesCta}>
            <Link href="/demonstrations" className={styles.ctaPrimary}>
              Explorer les démonstrations →
            </Link>
          </div>
        </div>
      </section>

      <section id="agents-apercu" className={styles.section} aria-labelledby="agents-apercu-title">
        <div className={styles.shell}>
          <div className={`${styles.panel} ${styles.agentsTeaser}`}>
            <div>
              <p className={styles.eyebrow}>Familles d’agents</p>
              <h2 id="agents-apercu-title" className={`${styles.display} ${styles.agentsTitle}`}>
                Plusieurs intelligences.
                <br />
                Différentes forces.
              </h2>
              <p className={styles.agentsLead}>
                Selon la tâche, différents agents peuvent être plus adaptés au raisonnement, au
                code, à la vision, à l’analyse ou à l’optimisation.
              </p>
            </div>
            <Link href="/#agents" className={styles.ctaSecondary}>
              Découvrir les familles d’agents →
            </Link>
          </div>
        </div>
      </section>

      <section id="pas-didee" className={styles.section} aria-labelledby="noidea-title">
        <div className={styles.shell}>
          <div className={`${styles.panel} ${styles.noIdea}`}>
            <p className={styles.eyebrow}>Sans idée</p>
            <h2 id="noidea-title" className={`${styles.display} ${styles.noIdeaTitle}`}>
              Vous n’avez pas encore d’idée ?
              <span className={styles.gradientText}> Ce n’est pas un prérequis.</span>
            </h2>
            <p className={styles.noIdeaText}>
              Nous utiliserons des exemples concrets pendant la journée. Vous pourrez apprendre en
              observant, en reproduisant et en modifiant les exemples proposés.
            </p>
            <p className={styles.noIdeaAccent}>Et peut-être qu’une idée apparaîtra pendant la journée.</p>
          </div>
        </div>
      </section>
    </>
  );
}
