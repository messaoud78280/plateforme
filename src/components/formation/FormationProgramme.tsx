"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ProgramTimeline } from "./ProgramTimeline";
import { PROGRAM_DAYS } from "./programme/data";
import styles from "./FormationProgramme.module.css";

type ProgramDayId = (typeof PROGRAM_DAYS)[number]["id"];

/** Programme BeWork — deux jours dans un même explorateur accessible. */
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
          <p className={styles.eyebrow}>Programme</p>
          <h2 id="programme-title" className={styles.title}>
            Un parcours progressif.
            <span>7 h ou 14 h.</span>
          </h2>
          <p className={styles.intro}>
            Tout le monde commence par la même première journée.
            Choisissez ensuite jusqu’où vous souhaitez aller.
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
                  <span>{day.included}</span>
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
          </div>
          <ProgramTimeline
            key={activeDay.id}
            steps={activeDay.steps}
            dayLabel={activeDay.tabLabel}
          />
        </div>

        <aside className={styles.progression} aria-label="Progression de la formation">
          <div>
            <strong>Après 7 h</strong>
            <span>Une méthode pour commencer et continuer seul.</span>
          </div>
          <span className={styles.progressionArrow} aria-hidden>→</span>
          <div>
            <strong>Après 14 h</strong>
            <span>Davantage de pratique et un projet plus abouti.</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
