"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./FormationHero.module.css";
import { FormationHeroScene } from "./FormationHeroScene";

/** Hero /formation — promesse éditoriale + démonstration idée → création. */
export function FormationHero() {
  const [ready, setReady] = useState(false);
  const [ambient, setAmbient] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduceMotion(reduced);
    const start = window.requestAnimationFrame(() => setReady(true));
    let ambientTimer: number | undefined;
    if (!reduced) {
      ambientTimer = window.setTimeout(() => setAmbient(true), 2600);
    }
    return () => {
      window.cancelAnimationFrame(start);
      if (ambientTimer) window.clearTimeout(ambientTimer);
    };
  }, []);

  const copyReady = ready || reduceMotion;

  return (
    <section className={styles.hero} aria-labelledby="formation-hero-title">
      <div className={styles.bg} aria-hidden>
        <Image
          src="/marketing/formation-hero-bg-2048.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={75}
          className={styles.bgImg}
        />
        <div className={styles.bgVeil} />
        <div className={styles.bgFade} />
      </div>

      <div className={styles.shell}>
        <div className={styles.grid}>
          <div className={`${styles.copy}${copyReady ? ` ${styles.ready}` : ""}`}>
            <p className={`${styles.eyebrow} ${styles.reveal}`} style={{ ["--d" as string]: "0ms" }}>
              La journée BeWork
            </p>

            <h1 id="formation-hero-title" className={styles.title}>
              <span
                className={`${styles.titleLine} ${styles.reveal}`}
                style={{ ["--d" as string]: "80ms" }}
              >
                Vous n’avez pas
              </span>
              <span
                className={`${styles.titleLine} ${styles.reveal}`}
                style={{ ["--d" as string]: "120ms" }}
              >
                appris à coder.
              </span>
              <span
                className={`${styles.titleLine} ${styles.reveal}`}
                style={{ ["--d" as string]: "180ms" }}
              >
                <span className={styles.gradient}>Ce n’est plus une barrière</span>
              </span>
              <span
                className={`${styles.titleLine} ${styles.reveal}`}
                style={{ ["--d" as string]: "220ms" }}
              >
                pour commencer.
              </span>
            </h1>

            <p className={`${styles.lead} ${styles.reveal}`} style={{ ["--d" as string]: "300ms" }}>
              Une journée pratique pour découvrir comment transformer vos idées en sites,
              applications et outils numériques avec l’intelligence artificielle — même si vous
              partez de zéro.
            </p>

            <p
              className={`${styles.reassure} ${styles.reveal}`}
              style={{ ["--d" as string]: "380ms" }}
            >
              <span className={styles.reassureIcon} aria-hidden>
                <svg viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6.2 4.8 8.5 9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Aucune connaissance en programmation n’est nécessaire.
            </p>

            <div
              className={`${styles.formatStrip} ${styles.reveal}`}
              style={{ ["--d" as string]: "460ms" }}
              aria-label="Formats de participation"
            >
              <span className={`${styles.formatChip} ${styles.formatChipPresentiel}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M16 11a3 3 0 1 0-2.8-4M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4.5 19a4.5 4.5 0 0 1 7 0M12.5 19a4.5 4.5 0 0 1 7 0" />
                </svg>
                Principalement en présentiel
              </span>
              <span className={`${styles.formatChip} ${styles.formatChipVisio}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <rect x="3" y="5" width="13" height="12" rx="2" />
                  <path d="M16 10l5-3v10l-5-3" />
                </svg>
                Sessions visio à dates dédiées
              </span>
            </div>

            <p
              className={`${styles.formatNote} ${styles.reveal}`}
              style={{ ["--d" as string]: "520ms" }}
            >
              Nous privilégions le présentiel pour vous accompagner au plus près pendant les
              installations, les essais et vos premières créations. Des sessions entièrement en
              visio sont également proposées à des dates dédiées.
            </p>

            <div
              className={`${styles.ctaRow} ${styles.reveal}`}
              style={{ ["--d" as string]: "600ms" }}
            >
              <a href="#programme" className={styles.ctaPrimary}>
                Découvrir le programme ↓
              </a>
              <Link href="/demonstrations" className={styles.ctaSecondary}>
                Voir ce qu’il est possible de créer →
              </Link>
            </div>
          </div>

          <div className={styles.sceneWrap}>
            <FormationHeroScene
              ready={ready}
              ambient={ambient}
              reduceMotion={reduceMotion}
            />
          </div>
        </div>

        <a href="#formats" className={styles.scrollHint}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <rect x="9" y="3" width="6" height="10" rx="3" />
            <path d="M12 6v2M8 16l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Découvrir la journée
        </a>
      </div>
    </section>
  );
}
