"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./FormationAiChange.module.css";

const ACTIONS: { label: string; tone: string; icon: ReactNode }[] = [
  {
    label: "Expliquer",
    tone: "blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 10h8M8 14h5" />
        <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H11l-4 3V6.5Z" />
      </svg>
    ),
  },
  {
    label: "Proposer",
    tone: "green",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18h6M10 21h4" />
        <path d="M12 3a5 5 0 0 1 3.5 8.5V14H8.5v-2.5A5 5 0 0 1 12 3Z" />
      </svg>
    ),
  },
  {
    label: "Montrer",
    tone: "violet",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
  },
  {
    label: "Analyser",
    tone: "orange",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19V5M4 19h16" />
        <path d="M8 15v-4M12 15V8M16 15v-6" />
      </svg>
    ),
  },
  {
    label: "Corriger",
    tone: "pink",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.5 5.5 18.5 9.5 8 20H4v-4L14.5 5.5Z" />
        <path d="m12.5 7.5 4 4" />
      </svg>
    ),
  },
  {
    label: "Suggérer une autre approche",
    tone: "indigo",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v3M12 18v3M4.9 5.5l2.1 2.1M17 16.4l2.1 2.1M3 12h3M18 12h3M4.9 18.5 7 16.4M17 7.6l2.1-2.1" />
        <circle cx="12" cy="12" r="3.5" />
      </svg>
    ),
  },
];

const KEEP = [
  {
    title: "Votre idée",
    text: "Vous connaissez votre besoin, votre contexte.",
    tone: "violet",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18h6M10 21h4" />
        <path d="M12 3a5 5 0 0 1 3.5 8.5V14H8.5v-2.5A5 5 0 0 1 12 3Z" />
      </svg>
    ),
  },
  {
    title: "Vos décisions",
    text: "Vous gardez le contrôle à chaque étape.",
    tone: "blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
      </svg>
    ),
  },
  {
    title: "Votre jugement",
    text: "Vous validez, ajustez, choisissez.",
    tone: "green",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    ),
  },
  {
    title: "Votre validation",
    text: "C’est vous qui décidez de la finalité.",
    tone: "orange",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 21V4l8 3.5L6 11" />
      </svg>
    ),
  },
] as const;

const PROMPTS = [
  "Transformer mon idée en plan d’action",
  "Organiser mon agenda",
  "Structurer mon CRM",
  "Créer une première version",
] as const;

const BENEFITS = [
  {
    label: "Accessible aux non-développeurs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19V9l8-4 8 4v10" />
        <path d="M9 19v-5h6v5" />
      </svg>
    ),
  },
  {
    label: "Des projets concrets dès les premiers jours",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 11a3 3 0 1 0-2.8-4M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4.5 19a4.5 4.5 0 0 1 7 0M12.5 19a4.5 4.5 0 0 1 7 0" />
      </svg>
    ),
  },
  {
    label: "Un accompagnement pas à pas avec l’IA",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
    ),
  },
] as const;

/** Ce que l’IA change — composition premium + animations. */
export function FormationAiChange() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [ambient, setAmbient] = useState(false);
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
      { threshold: 0.16 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!ready || reduced) return;
    const t = window.setTimeout(() => setAmbient(true), 800);
    return () => window.clearTimeout(t);
  }, [ready, reduced]);

  const rootClass = [
    styles.section,
    ready ? styles.ready : "",
    ambient ? styles.ambient : "",
    reduced ? styles.reduced : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      ref={rootRef}
      id="ia"
      className={rootClass}
      aria-labelledby="ai-title"
    >
      <div className={styles.shell}>
        <div className={styles.grid}>
          <div className={styles.copy}>
            <p className={`${styles.eyebrow} ${styles.reveal}`} style={{ ["--d" as string]: "0ms" }}>
              <span className={styles.eyebrowIcon} aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v3M12 18v3M4.9 5.5l2.1 2.1M17 16.4l2.1 2.1M3 12h3M18 12h3M4.9 18.5 7 16.4M17 7.6l2.1-2.1" />
                  <circle cx="12" cy="12" r="3.5" />
                </svg>
              </span>
              Ce que l’IA change
            </p>

            <h2
              id="ai-title"
              className={`${styles.title} ${styles.reveal}`}
              style={{ ["--d" as string]: "80ms" }}
            >
              Vous n’avez plus besoin de tout savoir{" "}
              <span className={styles.gradient}>avant de commencer.</span>
            </h2>

            <p className={`${styles.lead} ${styles.reveal}`} style={{ ["--d" as string]: "160ms" }}>
              Lorsqu’un problème apparaît, l’IA peut vous accompagner pendant que vous
              construisez. Vous progressez en faisant — pas seulement en écoutant.
            </p>

            <ul className={styles.actions}>
              {ACTIONS.map((item, i) => (
                <li
                  key={item.label}
                  className={`${styles.action} ${styles[`tone_${item.tone}`]} ${styles.reveal}`}
                  style={{ ["--d" as string]: `${220 + i * 45}ms` }}
                >
                  <span className={styles.actionIcon}>{item.icon}</span>
                  <span className={styles.actionLabel}>{item.label}</span>
                  <span className={styles.actionChevron} aria-hidden>
                    ›
                  </span>
                </li>
              ))}
            </ul>

            <div
              className={`${styles.ctaRow} ${styles.reveal}`}
              style={{ ["--d" as string]: "520ms" }}
            >
              <a href="#programme" className={styles.ctaPrimary}>
                Découvrir la formation →
              </a>
              <Link href="/demonstrations" className={styles.ctaSecondary}>
                <span className={styles.play} aria-hidden>
                  ▶
                </span>
                Voir la démo
              </Link>
            </div>
          </div>

          <div className={styles.visual}>
            <aside
              className={`${styles.keepCard} ${styles.fromRight}`}
              style={{ ["--d" as string]: "180ms" }}
            >
              <p className={styles.keepEyebrow}>Ce qui reste à vous</p>
              <ul className={styles.keepList}>
                {KEEP.map((item) => (
                  <li key={item.title} className={styles[`tone_${item.tone}`]}>
                    <span className={styles.keepIcon}>{item.icon}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className={styles.keepFoot}>
                <strong>L’objectif n’est pas de laisser l’IA décider à votre place.</strong>{" "}
                C’est d’apprendre à travailler avec elle.
              </p>
            </aside>

            <div
              className={`${styles.mock} ${styles.fromRight}`}
              style={{ ["--d" as string]: "320ms" }}
              aria-hidden
            >
              <div className={styles.mockSide}>
                <span className={styles.mockBrand}>BeWork</span>
                <span>Messagerie</span>
                <span>Agenda</span>
                <span className={styles.mockSideOn}>Assistant IA</span>
                <span>CRM</span>
              </div>
              <div className={styles.mockMain}>
                <p className={styles.mockTitle}>Assistant IA</p>
                <ul className={styles.prompts}>
                  {PROMPTS.map((p) => (
                    <li key={p}>
                      {p} <em>›</em>
                    </li>
                  ))}
                </ul>
                <div className={styles.mockInput}>
                  <span>Posez votre question…</span>
                  <span className={styles.mockSend}>↑</span>
                </div>
              </div>
            </div>

            <div
              className={`${styles.floatMini} ${styles.reveal}`}
              style={{ ["--d" as string]: "420ms" }}
              aria-hidden
            >
              <span className={styles.floatArrow}>↗</span>
              Une idée. Un projet. Des résultats.
            </div>

            <p
              className={`${styles.handNote} ${styles.reveal}`}
              style={{ ["--d" as string]: "480ms" }}
              aria-hidden
            >
              Des idées à la réalité
            </p>
          </div>
        </div>

        <div
          className={`${styles.band} ${styles.reveal}`}
          style={{ ["--d" as string]: "580ms" }}
        >
          <ul className={styles.benefits}>
            {BENEFITS.map((b) => (
              <li key={b.label}>
                <span className={styles.benefitIcon}>{b.icon}</span>
                {b.label}
              </li>
            ))}
          </ul>
          <p className={styles.steps}>APPRENDRE · EXPÉRIMENTER · CONSTRUIRE · RÉALISER</p>
        </div>
      </div>
    </section>
  );
}
