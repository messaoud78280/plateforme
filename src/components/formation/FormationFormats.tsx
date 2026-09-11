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
    <div className={styles.scene} aria-hidden>
      <svg className={styles.sceneVisual} viewBox="0 0 520 220" fill="none">
        <defs>
          <linearGradient id="wsWall" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#eef4ff" />
            <stop offset="100%" stopColor="#f5f3ff" />
          </linearGradient>
          <linearGradient id="wsScreen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#275be8" />
          </linearGradient>
        </defs>
        <rect width="520" height="220" fill="url(#wsWall)" />
        <rect x="28" y="28" width="150" height="78" rx="10" fill="#fff" stroke="#dbe3f0" />
        <text x="48" y="58" fill="#275be8" fontSize="13" fontWeight="800" fontFamily="system-ui,sans-serif">
          BeWork
        </text>
        <text
          x="48"
          y="80"
          fill="#7c3aed"
          fontSize="11"
          fontFamily="var(--font-blueprint-note), cursive"
        >
          Des idées aux créations !
        </text>

        {/* Table */}
        <ellipse cx="270" cy="178" rx="210" ry="18" fill="#dbe4f5" opacity="0.7" />
        <rect x="70" y="148" width="380" height="18" rx="6" fill="#e2e8f0" />

        {/* Laptops */}
        <g transform="translate(110 108)">
          <rect x="0" y="18" width="78" height="8" rx="2" fill="#94a3b8" />
          <rect x="8" y="0" width="62" height="40" rx="4" fill="#0f172a" />
          <rect x="12" y="4" width="54" height="30" rx="2" fill="url(#wsScreen)" />
          <rect
            className={styles.progressFill}
            x="18"
            y="24"
            width="40"
            height="4"
            rx="2"
            fill="#93c5fd"
          />
          <text x="18" y="16" fill="#fff" fontSize="6" fontFamily="system-ui,sans-serif">
            Idée → Création
          </text>
        </g>
        <g transform="translate(220 102)">
          <rect x="0" y="22" width="90" height="9" rx="2" fill="#94a3b8" />
          <rect x="10" y="0" width="70" height="46" rx="4" fill="#0f172a" />
          <rect x="14" y="4" width="62" height="34" rx="2" fill="#312e81" />
          <circle cx="28" cy="18" r="6" fill="#c4b5fd" />
          <rect x="40" y="14" width="28" height="4" rx="1" fill="#a5b4fc" />
          <rect x="40" y="22" width="22" height="3" rx="1" fill="#818cf8" opacity="0.8" />
          <path
            className={styles.liveCursor}
            d="M52 28l8 16 2-7 7-1-17-8z"
            fill="#fff"
            stroke="#275be8"
            strokeWidth="1"
          />
        </g>
        <g transform="translate(340 110)">
          <rect x="0" y="18" width="72" height="8" rx="2" fill="#94a3b8" />
          <rect x="6" y="0" width="60" height="38" rx="4" fill="#0f172a" />
          <rect x="10" y="4" width="52" height="28" rx="2" fill="#1d4ed8" />
        </g>

        {/* People simplified */}
        <g transform="translate(248 78)">
          <circle cx="18" cy="10" r="9" fill="#fdba74" />
          <rect x="6" y="20" width="24" height="28" rx="8" fill="#1e3a5f" />
          <text x="8" y="36" fill="#93c5fd" fontSize="5" fontFamily="system-ui,sans-serif">
            BeWork
          </text>
        </g>
        <g transform="translate(140 118)">
          <circle cx="10" cy="8" r="7" fill="#f9a8d4" />
          <rect x="2" y="16" width="16" height="18" rx="6" fill="#64748b" />
        </g>
        <g transform="translate(368 120)">
          <circle cx="10" cy="8" r="7" fill="#93c5fd" />
          <rect x="2" y="16" width="16" height="18" rx="6" fill="#475569" />
        </g>
      </svg>
    </div>
  );
}

function VisioScene() {
  return (
    <div className={styles.scene} aria-hidden>
      <svg className={styles.sceneVisual} viewBox="0 0 520 220" fill="none">
        <defs>
          <linearGradient id="vsBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#eef2ff" />
            <stop offset="100%" stopColor="#faf5ff" />
          </linearGradient>
          <linearGradient id="vsAccent" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#275be8" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <rect width="520" height="220" fill="url(#vsBg)" />

        {/* Laptop body */}
        <g transform="translate(78 28)">
          <rect x="18" y="0" width="300" height="158" rx="14" fill="#0f172a" />
          <rect x="28" y="10" width="280" height="138" rx="8" fill="#111827" />

          {/* Header bar */}
          <rect x="28" y="10" width="280" height="22" rx="8" fill="#1f2937" />
          <text x="40" y="25" fill="#e2e8f0" fontSize="8" fontWeight="700" fontFamily="system-ui,sans-serif">
            BeWork Live
          </text>
          <g className={styles.livePill}>
            <rect x="248" y="15" width="48" height="12" rx="6" fill="#065f46" />
            <circle cx="256" cy="21" r="2.5" fill="#34d399" />
            <text x="262" y="24" fill="#d1fae5" fontSize="6" fontFamily="system-ui,sans-serif">
              En direct
            </text>
          </g>

          {/* Main speaker */}
          <rect x="40" y="40" width="150" height="88" rx="8" fill="#1e293b" />
          <circle cx="115" cy="74" r="18" fill="#fdba74" />
          <rect x="92" y="94" width="46" height="22" rx="10" fill="#334155" />
          <text x="52" y="118" fill="#94a3b8" fontSize="7" fontFamily="system-ui,sans-serif">
            Formateur BeWork
          </text>

          {/* Participant thumbs */}
          <rect x="200" y="40" width="46" height="34" rx="6" fill="#312e81" />
          <circle cx="223" cy="52" r="7" fill="#c4b5fd" />
          <rect x="252" y="40" width="46" height="34" rx="6" fill="#1e3a5f" />
          <circle cx="275" cy="52" r="7" fill="#93c5fd" />
          <rect x="200" y="80" width="46" height="34" rx="6" fill="#4c1d95" />
          <circle cx="223" cy="92" r="7" fill="#f9a8d4" />

          {/* Shared project window */}
          <g className={styles.shareWin}>
            <rect x="252" y="80" width="46" height="48" rx="6" fill="#fff" />
            <rect x="256" y="84" width="38" height="8" rx="2" fill="url(#vsAccent)" />
            <rect x="256" y="96" width="28" height="3" rx="1" fill="#cbd5e1" />
            <rect x="256" y="102" width="34" height="3" rx="1" fill="#e2e8f0" />
            <rect x="256" y="108" width="20" height="3" rx="1" fill="#e2e8f0" />
            <text x="256" y="122" fill="#275be8" fontSize="5" fontFamily="system-ui,sans-serif">
              Mes idées…
            </text>
          </g>

          {/* Share toast */}
          <g className={styles.shareToast}>
            <rect x="96" y="48" width="78" height="16" rx="8" fill="#ecfdf5" stroke="#6ee7b7" />
            <text x="106" y="59" fill="#047857" fontSize="6.5" fontWeight="700" fontFamily="system-ui,sans-serif">
              Écran partagé
            </text>
          </g>

          <path
            className={styles.visioCursor}
            d="M170 92l7 14 1.8-6.2 6.2-.8-15-7z"
            fill="#fff"
            stroke="#7c3aed"
            strokeWidth="1"
          />
        </g>

        <ellipse cx="246" cy="196" rx="150" ry="10" fill="#c7d2fe" opacity="0.55" />
        <rect x="108" y="182" width="276" height="12" rx="4" fill="#94a3b8" />
      </svg>

      <span className={`${styles.floatDecor} ${styles.floatCam}`}>
        <svg viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="12" fill="#fff" />
          <rect x="8" y="12" width="18" height="14" rx="3" fill="#275be8" />
          <path d="M26 16l6-3v14l-6-3V16z" fill="#7c3aed" />
        </svg>
      </span>
      <span className={`${styles.floatDecor} ${styles.floatChart}`}>
        <svg viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="11" fill="#fff" />
          <rect x="8" y="18" width="4" height="10" rx="1" fill="#93c5fd" />
          <rect x="15" y="12" width="4" height="16" rx="1" fill="#275be8" />
          <rect x="22" y="8" width="4" height="20" rx="1" fill="#7c3aed" />
        </svg>
      </span>
      <span className={`${styles.floatDecor} ${styles.floatCursor}`}>
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M3 2l14 8-6 1.5L8.5 18 3 2z" fill="#275be8" />
        </svg>
      </span>
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
