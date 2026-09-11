"use client";

import { useEffect, useRef, useState } from "react";
import { FORMATION_SCHEDULE } from "@/lib/bework-formation";
import styles from "./formation.module.css";

/** Timeline programme — horaires indicatifs, interaction douce. */
export function FormationProgramme() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);
  const [entered, setEntered] = useState(false);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setEntered(true);
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!entered || reduceMotion.current) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % FORMATION_SCHEDULE.length);
    }, 3800);
    return () => window.clearInterval(id);
  }, [entered]);

  const current = FORMATION_SCHEDULE[active]!;

  return (
    <section
      ref={rootRef}
      id="programme"
      className={`${styles.section} ${styles.progSection}${entered ? ` ${styles.entered}` : ""}`}
      aria-labelledby="programme-title"
    >
      <div className={styles.shell}>
        <div className={styles.progHead}>
          <p className={styles.eyebrow}>Programme</p>
          <h2 id="programme-title" className={`${styles.display} ${styles.progTitle}`}>
            Une journée.
            <br />
            Plusieurs déclics.
          </h2>
          <p className={styles.progHint}>
            <strong>Horaires indicatifs.</strong> Le rythme peut évoluer selon le groupe.
          </p>
        </div>

        <div className={styles.progLayout}>
          <ol className={styles.progRail} aria-label="Déroulé de la journée">
            {FORMATION_SCHEDULE.map((step, i) => {
              const selected = active === i;
              return (
                <li key={`${step.time}-${step.title}`}>
                  <button
                    type="button"
                    className={`${styles.progStep}${selected ? ` ${styles.progStepActive}` : ""}${
                      "pause" in step && step.pause ? ` ${styles.progStepPause}` : ""
                    }`}
                    aria-pressed={selected}
                    onClick={() => setActive(i)}
                  >
                    <span className={styles.progTime}>{step.time}</span>
                    <span className={styles.progDot} aria-hidden />
                    <span className={styles.progStepTitle}>{step.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          <article className={`${styles.panel} ${styles.progDetail}`} aria-live="polite">
            <p className={styles.progDetailTime}>{current.time}</p>
            <h3 className={styles.progDetailTitle}>{current.title}</h3>
            <ul className={styles.progDetailList}>
              {current.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
