"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { DayTwoStep } from "@/components/formation/programme/dayTwo";
import styles from "./ProgramTimeline.module.css";

type Props = {
  steps: readonly DayTwoStep[];
  ariaLabel?: string;
};

/** Timeline interactive réutilisable (Jour 2 — et futurs programmes). */
export function ProgramTimeline({ steps, ariaLabel = "Étapes du programme" }: Props) {
  const [active, setActive] = useState(0);
  const listId = useId();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const step = steps[active] ?? steps[0]!;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      setActive((index + 1) % steps.length);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((index - 1 + steps.length) % steps.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(steps.length - 1);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`${styles.root}${inView ? ` ${styles.inView}` : ""}`}
    >
      <div className={styles.layout}>
        <div
          className={styles.list}
          role="listbox"
          id={listId}
          aria-label={ariaLabel}
          aria-activedescendant={`${listId}-opt-${active}`}
        >
          {steps.map((item, i) => {
            const selected = active === i;
            return (
              <button
                key={item.id}
                id={`${listId}-opt-${i}`}
                type="button"
                role="option"
                aria-selected={selected}
                aria-controls={panelId}
                className={[
                  styles.step,
                  selected ? styles.stepActive : "",
                  item.variant === "pause" ? styles.stepPause : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                <time className={styles.time} dateTime={`T${item.time}`}>
                  {item.time}
                </time>
                <span className={styles.stepTitle}>{item.title}</span>
              </button>
            );
          })}
        </div>

        <article
          id={panelId}
          className={[
            styles.panel,
            step.variant === "pause" ? styles.panelPause : "",
            step.variant === "close" ? styles.panelClose : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-live="polite"
        >
          <p className={styles.panelMeta}>
            <time dateTime={`T${step.time}`}>{step.time}</time>
          </p>
          <h3 className={styles.panelTitle}>{step.title}</h3>
          <p className={styles.panelLead}>{step.subtitle}</p>
        </article>
      </div>
    </div>
  );
}
