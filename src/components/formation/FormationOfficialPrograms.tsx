"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  FORMATION_ORGANISM,
  FORMATION_TAKEAWAYS_14H,
  FORMATION_TAKEAWAYS_7H,
  OFFICIAL_PROGRAM_MODULES_DAY1,
  OFFICIAL_PROGRAM_MODULES_DAY2,
  TRAINING_OFFERS,
  TRAINING_PROGRAM_PDF,
} from "@/lib/bework-formation";
import styles from "./FormationOfficialPrograms.module.css";

type Track = "7h" | "14h";

/** Présentation officielle des parcours 7 h / 14 h — modules + PDF. */
export function FormationOfficialPrograms() {
  const [track, setTrack] = useState<Track>("7h");
  const tabsId = useId();
  const is7h = track === "7h";
  const offer = is7h ? TRAINING_OFFERS.essential : TRAINING_OFFERS.complete;
  const modules = is7h ? OFFICIAL_PROGRAM_MODULES_DAY1 : OFFICIAL_PROGRAM_MODULES_DAY2;
  const takeaways = is7h ? FORMATION_TAKEAWAYS_7H : FORMATION_TAKEAWAYS_14H;
  const pdfHref = is7h ? TRAINING_PROGRAM_PDF.essential : TRAINING_PROGRAM_PDF.complete;
  const pdfLabel = offer.pdfLabel;

  return (
    <section
      id="programmes-officiels"
      className={styles.section}
      aria-labelledby="official-programs-title"
    >
      <div className={styles.shell}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>Les programmes BeWork</p>
          <h2 id="official-programs-title" className={styles.title}>
            Une idée.
            <span className={styles.accent}> Deux parcours pour la concrétiser.</span>
          </h2>
          <p className={styles.lead}>
            Apprenez à créer vos propres sites, applications et outils numériques avec
            l’intelligence artificielle. Une première journée pour construire votre projet. Une
            deuxième pour le finaliser et le mettre en ligne.
          </p>
        </header>

        <div className={styles.trackTabs} role="tablist" aria-label="Choisir un parcours">
          {(
            [
              {
                id: "7h" as const,
                num: "01",
                label: "Formation 7 h",
                hint: "1 journée · première version",
              },
              {
                id: "14h" as const,
                num: "02",
                label: "Formation 14 h",
                hint: "2 journées · projet en ligne",
              },
            ] as const
          ).map((t) => {
            const selected = track === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`${tabsId}-${t.id}`}
                aria-selected={selected}
                aria-controls={`${tabsId}-panel`}
                className={`${styles.trackTab}${selected ? ` ${styles.trackTabActive}` : ""}`}
                onClick={() => setTrack(t.id)}
              >
                <span className={styles.trackNum}>{t.num}</span>
                <span className={styles.trackLabel}>{t.label}</span>
                <span className={styles.trackHint}>{t.hint}</span>
              </button>
            );
          })}
        </div>

        <div
          key={track}
          id={`${tabsId}-panel`}
          role="tabpanel"
          aria-labelledby={`${tabsId}-${track}`}
          className={styles.panel}
        >
          <div className={styles.metaGrid}>
            <Meta label="Durée" value={`${offer.hours} heures`} />
            <Meta label="Horaires" value={FORMATION_ORGANISM.schedule} />
            <Meta label="Effectif" value={offer.groupSize} />
            <Meta label="Pratique" value={offer.practiceShare} />
            <Meta label="Tarif" value={`${offer.price} € / participant`} />
            <Meta
              label="Modalités"
              value="Présentiel · classe virtuelle · intra-entreprise"
            />
          </div>

          <p className={styles.objective}>
            <strong>Objectif principal — </strong>
            {is7h
              ? "Passer d’une idée ou d’un besoin à une première version fonctionnelle."
              : "Construire la première version, puis finaliser, publier et contrôler le projet en ligne."}
          </p>

          {!is7h ? (
            <div className={styles.dayBridge} aria-label="Progression sur deux journées">
              <div>
                <p className={styles.dayTag}>Jour 1</p>
                <p className={styles.dayTitle}>7 h — De l’idée à une première version fonctionnelle.</p>
                <button
                  type="button"
                  className={styles.dayLink}
                  onClick={() => setTrack("7h")}
                >
                  Voir le détail du Jour 1
                </button>
              </div>
              <span className={styles.dayArrow} aria-hidden>
                →
              </span>
              <div>
                <p className={styles.dayTag}>Jour 2</p>
                <p className={styles.dayTitle}>
                  7 h — Finaliser, publier et faire évoluer son projet.
                </p>
              </div>
            </div>
          ) : null}

          <h3 className={styles.modulesTitle}>
            {is7h ? "Les 4 modules de la journée" : "Les 5 modules du Jour 2"}
          </h3>
          <ul className={styles.modules}>
            {modules.map((m) => (
              <li key={m.number} className={styles.module}>
                <details>
                  <summary>
                    <span className={styles.moduleNum}>{m.number}</span>
                    <span className={styles.moduleTitle}>{m.title}</span>
                  </summary>
                  <div className={styles.moduleBody}>
                    <p>
                      <strong>Objectif — </strong>
                      {m.objective}
                    </p>
                    <p className={styles.skillsLabel}>Compétences travaillées</p>
                    <ul>
                      {m.skills.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                    <p className={styles.result}>
                      <strong>Résultat attendu — </strong>
                      {m.result}
                    </p>
                  </div>
                </details>
              </li>
            ))}
          </ul>

          {!is7h ? (
            <p className={styles.seoNote}>
              Le référencement et l’indexation concernent uniquement les projets destinés à être
              trouvés sur le web. Aucune position dans les résultats des moteurs de recherche n’est
              garantie.
            </p>
          ) : null}

          <aside className={styles.takeaways}>
            <h3>
              {is7h
                ? "Ce que vous emportez après 7 heures"
                : "À la fin des deux journées"}
            </h3>
            {!is7h ? (
              <p className={styles.takeawaysLead}>
                Votre idée est devenue un projet concret, que vous avez appris à construire,
                améliorer et publier.
              </p>
            ) : null}
            <ul>
              {takeaways.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>

          <div className={styles.ctaRow}>
            <Link
              href={`/contact?parcours=${offer.id}#participer`}
              className={styles.ctaPrimary}
            >
              {offer.ctaLabel}
            </Link>
            <a
              href={pdfHref}
              className={styles.ctaSecondary}
              download
              target="_blank"
              rel="noopener noreferrer"
              aria-label={pdfLabel}
            >
              Télécharger le programme officiel — PDF
            </a>
            {is7h ? (
              <button type="button" className={styles.ctaLink} onClick={() => setTrack("14h")}>
                Découvrir le parcours de 14 heures →
              </button>
            ) : (
              <Link href="#programme" className={styles.ctaLink}>
                Voir le déroulé interactif →
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metaItem}>
      <p className={styles.metaLabel}>{label}</p>
      <p className={styles.metaValue}>{value}</p>
    </div>
  );
}
