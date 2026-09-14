"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HomeDayProgression.module.css";

const DAY1 = ["Comprendre", "Préparer", "Créer", "Modifier", "Tester"] as const;
const DAY2 = [
  "Structurer",
  "Ajouter des fonctions",
  "Approfondir",
  "Tester",
  "Corriger",
  "Améliorer",
] as const;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Transition Jour 1 → Jour 2 — homepage. */
export function HomeDayProgression() {
  const rootRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const reveal = inView ? styles.isIn : "";

  return (
    <section
      ref={rootRef}
      id="progression"
      className={styles.section}
      aria-labelledby="progression-heading"
    >
      <div className={styles.shell}>
        <header className={cx(styles.head, reveal)}>
          <h2 id="progression-heading" className={styles.title}>
            Et si vous voulez aller plus loin&nbsp;?
          </h2>
          <p className={styles.lead}>
            La première journée vous apprend à commencer.
            <br />
            La deuxième vous donne le temps de construire davantage.
          </p>
        </header>

        <div className={styles.tracks}>
          <div className={cx(styles.track, reveal)}>
            <p className={styles.trackLabel}>
              Jour 1 <span aria-hidden>·</span> Commencer
            </p>
            <ol className={styles.flow}>
              {DAY1.map((item, i) => (
                <li key={item} className={styles.flowItem}>
                  <span className={styles.flowText}>{item}</span>
                  {i < DAY1.length - 1 ? (
                    <span className={styles.arrow} aria-hidden>
                      →
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>

          <div className={cx(styles.track, styles.trackAccent, reveal)}>
            <p className={styles.trackLabel}>
              Jour 2 <span aria-hidden>·</span> Construire plus loin
            </p>
            <ol className={styles.flow}>
              {DAY2.map((item, i) => (
                <li key={item} className={styles.flowItem}>
                  <span className={styles.flowText}>{item}</span>
                  {i < DAY2.length - 1 ? (
                    <span className={styles.arrow} aria-hidden>
                      →
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
