"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./FormationFormats.module.css";

const PRESENTIEL_BENEFITS = [
  {
    label: "Installation guidée",
    tone: "blue" as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    label: "Échanges en groupe",
    tone: "violet" as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 11a3 3 0 1 0-2.8-4M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4.5 19a4.5 4.5 0 0 1 7 0M12.5 19a4.5 4.5 0 0 1 7 0" />
      </svg>
    ),
  },
  {
    label: "Aide immédiate",
    tone: "violet" as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Pratique sur votre PC",
    tone: "blue" as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    ),
  },
] as const;

const VISIO_BENEFITS = [
  {
    label: "Démonstrations en direct",
    tone: "blue" as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 6.5v11l9-5.5-9-5.5z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Partage d’écran",
    tone: "violet" as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8" />
      </svg>
    ),
  },
  {
    label: "Accompagnement",
    tone: "violet" as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    ),
  },
  {
    label: "Manipulations en temps réel",
    tone: "blue" as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 4l7 16 2.2-7.2L21 11 5 4z" strokeLinejoin="round" />
      </svg>
    ),
  },
] as const;

function WorkshopScene() {
  return (
    <div className={`${styles.scene} ${styles.scenePhotoWrap}`}>
      <Image
        src="/marketing/formation-formats-atelier.jpg"
        alt="Atelier BeWork en présentiel — équipe autour de la table, écrans ouverts."
        width={4096}
        height={2304}
        sizes="(max-width: 900px) 100vw, 40vw"
        className={styles.scenePhoto}
        unoptimized
      />
    </div>
  );
}

function VisioScene() {
  return (
    <div className={`${styles.scene} ${styles.scenePhotoWrap}`}>
      <Image
        src="/marketing/formation-formats-visio.jpg"
        alt="Session BeWork en visio — démonstrations en direct, partage d’écran et échanges."
        width={4096}
        height={2304}
        sizes="(max-width: 900px) 100vw, 40vw"
        className={styles.scenePhoto}
        unoptimized
      />
    </div>
  );
}

/** Formats — présentiel recommandé + visio dédiée, même ambition. */
export function FormationFormats() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(prefersReduced);
    const el = rootRef.current;
    if (!el) return;

    if (prefersReduced) {
      setReady(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setReady(true);
          io.disconnect();
        }
      },
      { threshold: 0.22 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const rootClass = [
    styles.section,
    ready ? styles.ready : "",
    reduced ? styles.reduced : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      ref={rootRef}
      id="formats"
      className={rootClass}
      aria-labelledby="formats-title"
    >
      <div className={styles.bg} aria-hidden>
        <Image
          src="/marketing/formation-formats-bg-2048.jpg"
          alt=""
          fill
          sizes="100vw"
          quality={75}
          className={styles.bgImg}
        />
        <div className={styles.bgVeil} />
      </div>

      <div className={styles.shell}>
        <div className={`${styles.head} ${styles.reveal}`} style={{ ["--d" as string]: "0ms" }}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden />
            Comment participer ?
          </p>
          <h2 id="formats-title" className={styles.title}>
            Deux formats.
            <br />
            <span className={styles.gradient}>Une même ambition.</span>
          </h2>
          <p className={styles.lead}>
            Choisissez le format qui vous convient. Le programme, la pratique et
            l’accompagnement restent les mêmes, pour une expérience tout aussi complète.
          </p>
        </div>

        <div className={styles.grid}>
          <article
            className={`${styles.card} ${styles.cardPresentiel} ${styles.fromLeft}`}
            style={{ ["--d" as string]: "120ms" }}
          >
            <div className={styles.cardTop}>
              <p className={styles.optionLabel}>Option 1 — Présentiel</p>
              <span className={styles.badge}>★ Recommandé</span>
            </div>
            <h3 className={styles.cardTitle}>
              Une journée ensemble.
              <br />
              <span className={styles.accentBlue}>Ordinateur ouvert.</span>
            </h3>
            <p className={styles.cardLead}>
              Nous privilégions ce format pour pouvoir regarder avec vous ce qui se passe sur
              votre écran, intervenir immédiatement et avancer ensemble.
            </p>
            <WorkshopScene />
            <ul className={styles.benefits}>
              {PRESENTIEL_BENEFITS.map((item) => (
                <li key={item.label} className={styles.benefit}>
                  <span
                    className={`${styles.benefitIcon} ${
                      item.tone === "blue" ? styles.iconBlue : styles.iconViolet
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </article>

          <article
            className={`${styles.card} ${styles.cardVisio} ${styles.fromRight}`}
            style={{ ["--d" as string]: "200ms" }}
          >
            <div className={styles.cardTop}>
              <p className={styles.optionLabel}>Option 2 — Visio</p>
            </div>
            <h3 className={styles.cardTitle}>
              La même journée.
              <br />
              <span className={styles.accentViolet}>Depuis chez vous.</span>
            </h3>
            <p className={styles.cardLead}>
              Des sessions à distance dédiées permettent de suivre les démonstrations, partager
              votre écran et pratiquer avec le groupe sans vous déplacer.
            </p>
            <VisioScene />
            <ul className={styles.benefits}>
              {VISIO_BENEFITS.map((item) => (
                <li key={item.label} className={styles.benefit}>
                  <span
                    className={`${styles.benefitIcon} ${
                      item.tone === "blue" ? styles.iconBlue : styles.iconViolet
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
            <p className={styles.note}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M5 12a7 7 0 0 1 14 0M8.5 12a3.5 3.5 0 0 1 7 0M12 12.5v.5" />
                <circle cx="12" cy="16.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              Ordinateur + connexion Internet stable nécessaires.
            </p>
          </article>
        </div>

        <div className={`${styles.band} ${styles.reveal}`} style={{ ["--d" as string]: "320ms" }}>
          <div className={styles.bandLeft}>
            <span className={styles.bandMark} aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
              </svg>
            </span>
            <div>
              <p className={styles.bandTitle}>
                Même programme. Même méthode. Même objectif.
              </p>
              <p className={styles.bandSub}>
                Vous aider à comprendre comment commencer à créer et continuer à progresser
                après la journée.
              </p>
            </div>
          </div>
          <ul className={styles.bandPills}>
            <li className={styles.bandPill}>
              <span className={`${styles.bandPillIcon} ${styles.iconBlue}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="12" rx="2" />
                  <path d="M8 20h8" />
                </svg>
              </span>
              Pratique
            </li>
            <li className={styles.bandPill}>
              <span className={`${styles.bandPillIcon} ${styles.iconViolet}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 11a3 3 0 1 0-2.8-4M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4.5 19a4.5 4.5 0 0 1 7 0M12.5 19a4.5 4.5 0 0 1 7 0" />
                </svg>
              </span>
              Accompagnement
            </li>
            <li className={styles.bandPill}>
              <span className={styles.bandPillIcon} style={{ background: "linear-gradient(135deg,#ea580c,#fb923c)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 20V10M10 20V4M16 20v-7M22 20V8" />
                </svg>
              </span>
              Autonomie
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
