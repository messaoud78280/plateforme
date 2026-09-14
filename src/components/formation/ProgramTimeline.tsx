"use client";

import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { ProgramStep } from "./programme/data";
import styles from "./FormationProgramme.module.css";

type Props = {
  steps: readonly ProgramStep[];
  dayLabel: string;
};

function ProgramPanel({
  step,
  panelId,
}: {
  step: ProgramStep;
  panelId: string;
}) {
  return (
    <article
      key={step.id}
      id={panelId}
      className={[
        styles.panel,
        step.variant === "pause" ? styles.panelPause : "",
        step.variant === "project" ? styles.panelProject : "",
        step.variant === "close" ? styles.panelClose : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-live="polite"
    >
      <header className={styles.panelHead}>
        <p className={styles.panelKicker}>
          Module {step.module}
          <span aria-hidden> · </span>
          <time dateTime={`T${step.time}`}>{step.time}</time>
        </p>
        <h3 className={styles.panelTitle}>{step.title}</h3>
        <p className={styles.panelLead}>{step.subtitle}</p>
      </header>

      {step.actions.length > 0 ? (
        <section className={styles.panelBlock}>
          <h4 className={styles.blockLabel}>Pendant cette étape</h4>
          <ul className={styles.actions}>
            {step.actions.map((action) => (
              <li key={action}>
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
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {step.tools.length > 0 ? (
        <section className={styles.panelBlock}>
          <h4 className={styles.blockLabel}>Vous allez manipuler</h4>
          <ul className={styles.tools}>
            {step.tools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className={styles.outcome}>
        <p className={styles.outcomeLabel}>À la fin de cette étape</p>
        <p className={styles.outcomeText}>{step.result}</p>
      </footer>
    </article>
  );
}

/** Timeline interactive : panneau naturel desktop, accordéon vertical mobile. */
export function ProgramTimeline({ steps, dayLabel }: Props) {
  const [active, setActive] = useState(0);
  const optionId = useId();
  const panelId = useId();
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const activeStep = steps[active] ?? steps[0];

  if (!activeStep) return null;

  const selectAndFocus = (index: number) => {
    const next = Math.max(0, Math.min(steps.length - 1, index));
    setActive(next);
    window.requestAnimationFrame(() => buttonsRef.current[next]?.focus());
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        selectAndFocus((index + 1) % steps.length);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        selectAndFocus((index - 1 + steps.length) % steps.length);
        break;
      case "Home":
        event.preventDefault();
        selectAndFocus(0);
        break;
      case "End":
        event.preventDefault();
        selectAndFocus(steps.length - 1);
        break;
    }
  };

  return (
    <div className={styles.timelineLayout}>
      <div
        className={styles.timeline}
        role="listbox"
        aria-label={`Programme ${dayLabel}`}
      >
        {steps.map((step, index) => {
          const selected = index === active;

          return (
            <div key={step.id} className={styles.timelineItem}>
              <button
                ref={(node) => {
                  buttonsRef.current[index] = node;
                }}
                id={`${optionId}-${index}`}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                className={`${styles.step}${selected ? ` ${styles.stepActive}` : ""}`}
                onClick={() => setActive(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <span className={styles.stepRail} aria-hidden>
                  <span className={styles.stepDot} />
                </span>
                <time className={styles.stepTime} dateTime={`T${step.time}`}>
                  {step.time}
                </time>
                <span className={styles.stepTitle}>{step.title}</span>
                <span className={styles.stepChevron} aria-hidden>
                  {selected ? "−" : "+"}
                </span>
              </button>

              {selected ? (
                <div className={styles.mobilePanel}>
                  <ProgramPanel step={activeStep} panelId={`${panelId}-mobile`} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className={styles.desktopPanel}>
        <ProgramPanel step={activeStep} panelId={panelId} />
      </div>
    </div>
  );
}
