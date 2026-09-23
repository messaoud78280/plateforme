"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ProgramTimeline } from "./ProgramTimeline";
import { PROGRAM_DAYS } from "./programme/data";
import styles from "./FormationProgramme.module.css";

type ProgramDayId = (typeof PROGRAM_DAYS)[number]["id"];

/** Programme BeWork — deux jours centrés sur le projet du participant. */
export function FormationProgramme() {
  const [activeDayId, setActiveDayId] = useState<ProgramDayId>("day1");
  const tabsId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeDay = PROGRAM_DAYS.find((day) => day.id === activeDayId) ?? PROGRAM_DAYS[0];

  const selectDay = (index: number, focus = false) => {
    const day = PROGRAM_DAYS[index];
    if (!day) return;
    setActiveDayId(day.id);
    if (focus) {
      window.requestAnimationFrame(() => tabRefs.current[index]?.focus());
    }
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      selectDay((index + 1) % PROGRAM_DAYS.length, true);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      selectDay((index - 1 + PROGRAM_DAYS.length) % PROGRAM_DAYS.length, true);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectDay(0, true);
    } else if (event.key === "End") {
      event.preventDefault();
      selectDay(PROGRAM_DAYS.length - 1, true);
    }
  };

  return (
    <section id="programme" className={styles.section} aria-labelledby="programme-title">
      <div className={styles.glowLeft} aria-hidden />
      <div className={styles.glowRight} aria-hidden />

      <div className={styles.shell}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Déroulé indicatif</p>
          <h2 id="programme-title" className={styles.title}>
            Votre projet.{" "}
            <span>Deux journées pour le construire.</span>
          </h2>
          <p className={styles.intro}>
            Chronologie indicative de la session. Le détail pédagogique officiel figure dans les
            programmes PDF et dans la section programmes ci-dessus.
          </p>
          <p className={styles.intro}>
            Jour 1 : de l’idée à une première version fonctionnelle. Jour 2 : finaliser, publier et
            contrôler le projet — avec les bases du référencement lorsque le projet s’y prête.
          </p>
          <p className={styles.highlight}>
            Vous apprenez en construisant quelque chose qui vous appartient.
          </p>
        </header>

        <div className={styles.tabs} role="tablist" aria-label="Choisir le jour du programme">
          {PROGRAM_DAYS.map((day, index) => {
            const selected = day.id === activeDay.id;
            const tabId = `${tabsId}-${day.id}-tab`;
            const tabPanelId = `${tabsId}-${day.id}-panel`;

            return (
              <button
                key={day.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={tabPanelId}
                tabIndex={selected ? 0 : -1}
                className={`${styles.dayTab}${selected ? ` ${styles.dayTabActive}` : ""}`}
                onClick={() => selectDay(index)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
              >
                <span className={styles.tabTop}>
                  <strong>{day.tabLabel}</strong>
                  <span className={styles.tabBadge}>{day.included}</span>
                </span>
                <span className={styles.tabTitle}>{day.eyebrow}</span>
                <span className={styles.tabNote}>{day.note}</span>
              </button>
            );
          })}
        </div>

        <div
          key={activeDay.id}
          id={`${tabsId}-${activeDay.id}-panel`}
          role="tabpanel"
          aria-labelledby={`${tabsId}-${activeDay.id}-tab`}
          className={styles.dayPanel}
        >
          <div className={styles.dayHead}>
            <p>{activeDay.tabLabel}</p>
            <h3>{activeDay.title}</h3>
            <p className={styles.dayDescription}>{activeDay.description}</p>
          </div>

          <ProgramTimeline
            key={activeDay.id}
            steps={activeDay.steps}
            dayLabel={activeDay.tabLabel}
          />

          <div className={styles.dayClose} aria-label={`Bilan ${activeDay.tabLabel}`}>
            <p className={styles.dayCloseEyebrow}>À la fin du {activeDay.id === "day1" ? "Jour 1" : "Jour 2"}</p>
            <p className={styles.dayCloseLead}>
              {activeDay.id === "day1"
                ? "Vous ne repartez pas seulement avec des notions. Vous avez :"
                : "Vous avez appris à :"}
            </p>
            <ul className={styles.dayOutcomes}>
              {activeDay.outcomes.map((item) => (
                <li key={item}>
                  <span className={styles.check} aria-hidden>
                    <svg viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6.2 4.8 8.5 9.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className={styles.dayCloseLine}>{activeDay.closingLine}</p>
          </div>
        </div>

        <aside className={styles.summary} aria-label="Résumé visuel des deux journées">
          {PROGRAM_DAYS.map((day) => (
            <div
              key={day.id}
              className={`${styles.summaryCard}${day.id === activeDay.id ? ` ${styles.summaryCardActive}` : ""}`}
            >
              <p className={styles.summaryLabel}>{day.summaryLabel}</p>
              <ol className={styles.summaryFlow}>
                {day.summaryFlow.map((node, index) => (
                  <li key={node}>
                    <span>{node}</span>
                    {index < day.summaryFlow.length - 1 ? (
                      <span className={styles.summaryArrow} aria-hidden>
                        ↓
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </aside>

        <aside className={styles.progression} aria-label="Progression de la formation">
          <div>
            <strong>Parcours 7 h — 300 €</strong>
            <span>Jour 1 inclus : environnement, méthode et première version de votre projet.</span>
          </div>
          <span className={styles.progressionArrow} aria-hidden>
            →
          </span>
          <div>
            <strong>Parcours 14 h — 600 €</strong>
            <span>
              Jour 1 + Jour 2 : renforcer, publier, référencer et auditer le même projet.
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}
