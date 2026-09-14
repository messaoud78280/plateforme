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

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
          <div className={styles.copy}>
            <p className={`${styles.eyebrow} ${styles.reveal}`}>
              La formation BeWork
            </p>

            <h1 id="formation-hero-title" className={styles.title}>
              <span
                className={`${styles.titleLine} ${styles.reveal}`}
              >
                Vous n’avez pas{" "}
              </span>
              <span
                className={`${styles.titleLine} ${styles.reveal}`}
              >
                appris à coder.{" "}
              </span>
              <span
                className={`${styles.titleLine} ${styles.reveal}`}
              >
                <span className={styles.gradient}>Ce n’est plus une barrière</span>{" "}
              </span>
              <span
                className={`${styles.titleLine} ${styles.reveal}`}
              >
                pour commencer.
              </span>
            </h1>

            <p className={`${styles.lead} ${styles.reveal}`}>
              Apprenez à créer des sites, applications et outils avec l’IA. Puis choisissez
              jusqu’où vous voulez aller — une journée pour commencer, deux pour construire
              plus loin.
            </p>

            <p
              className={`${styles.reassure} ${styles.reveal}`}
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
            >
              Nous privilégions le présentiel pour vous accompagner au plus près pendant les
              installations, les essais et vos premières créations. Des sessions entièrement en
              visio sont également proposées à des dates dédiées.
            </p>

            <div
              className={`${styles.ctaRow} ${styles.reveal}`}
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
            />
          </div>
        </div>

        <a href="#modalites" className={styles.scrollHint}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <rect x="9" y="3" width="6" height="10" rx="3" />
            <path d="M12 6v2M8 16l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Découvrir la formation
        </a>
      </div>
    </section>
  );
}
