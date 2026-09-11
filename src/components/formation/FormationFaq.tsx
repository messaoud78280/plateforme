"use client";

import { useId, useState } from "react";
import { FORMATION_PAGE_FAQ } from "@/lib/bework-formation";
import styles from "./formation.module.css";

/** FAQ pratique — accordion accessible. */
export function FormationFaq() {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className={styles.section} aria-labelledby="faq-title">
      <div className={styles.shell}>
        <div className={styles.faqHead}>
          <p className={styles.eyebrow}>FAQ pratique</p>
          <h2 id="faq-title" className={`${styles.display} ${styles.faqTitle}`}>
            Les questions
            <br />
            que l’on se pose
            <br />
            avant de venir.
          </h2>
        </div>

        <div className={styles.faqList}>
          {FORMATION_PAGE_FAQ.map((item, i) => {
            const isOpen = open === i;
            const panelId = `${baseId}-panel-${i}`;
            const btnId = `${baseId}-btn-${i}`;
            return (
              <div key={item.q} className={`${styles.panel} ${styles.faqItem}`}>
                <h3 className={styles.faqQ}>
                  <button
                    id={btnId}
                    type="button"
                    className={styles.faqBtn}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span>{item.q}</span>
                    <span className={styles.faqIcon} aria-hidden>
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  hidden={!isOpen}
                  className={styles.faqA}
                >
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
