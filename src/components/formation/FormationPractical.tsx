import {
  FORMATION_ORGANISM,
  FORMATION_PRACTICAL_POINTS,
} from "@/lib/bework-formation";
import styles from "./FormationPractical.module.css";

/** Informations pratiques communes + mentions organisme. */
export function FormationPractical() {
  return (
    <section id="infos-pratiques" className={styles.section} aria-labelledby="practical-title">
      <div className={styles.shell}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>Organisation</p>
          <h2 id="practical-title" className={styles.title}>
            Une formation structurée.
            <span className={styles.accent}> Un accompagnement concret.</span>
          </h2>
        </header>

        <ul className={styles.grid}>
          {FORMATION_PRACTICAL_POINTS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <aside className={styles.organism} aria-label="Organisme de formation">
          <p className={styles.organismTitle}>Organisme de formation</p>
          <p>
            <strong>{FORMATION_ORGANISM.relation}</strong> ({FORMATION_ORGANISM.legalName}).
          </p>
          <p>
            SIRET {FORMATION_ORGANISM.siret} · NDA {FORMATION_ORGANISM.nda} ({FORMATION_ORGANISM.region}) ·{" "}
            {FORMATION_ORGANISM.qualiopi}.
          </p>
          <p>{FORMATION_ORGANISM.vatNote}</p>
          <p className={styles.disclaimer}>{FORMATION_ORGANISM.ndaDisclaimer}</p>
          <p className={styles.contact}>
            Responsable pédagogique : {FORMATION_ORGANISM.pedagogicalLead} ·{" "}
            <a href={`mailto:${FORMATION_ORGANISM.contactEmail}`}>
              {FORMATION_ORGANISM.contactEmail}
            </a>{" "}
            · {FORMATION_ORGANISM.contactPhone}
          </p>
        </aside>
      </div>
    </section>
  );
}
