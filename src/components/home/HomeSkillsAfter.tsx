"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HomeSkillsAfter.module.css";

const JOURNEY = ["Idée", "Structurer", "Créer", "Tester", "Améliorer", "Continuer"] as const;

const STEPS = [
  {
    id: "01",
    title: "Structurer une idée",
    desc: "Transformer un besoin en projet clair.",
    tone: "blue",
    variant: "featured",
    ui: "structurer",
  },
  {
    id: "02",
    title: "Formuler une demande",
    desc: "Expliquer précisément ce que vous voulez obtenir.",
    tone: "violet",
    variant: "ghost",
    ui: null,
  },
  {
    id: "03",
    title: "Lancer une première création",
    desc: "Passer de l’idée à une première version concrète.",
    tone: "electric",
    variant: "featured",
    ui: "creer",
  },
  {
    id: "04",
    title: "Tester et corriger",
    desc: "Identifier ce qui fonctionne et ce qui doit évoluer.",
    tone: "peach",
    variant: "soft",
    ui: "tester",
  },
  {
    id: "05",
    title: "Améliorer",
    desc: "Ajouter, modifier et affiner progressivement.",
    tone: "mint",
    variant: "ghost",
    ui: "ameliorer",
  },
  {
    id: "06",
    title: "Continuer",
    desc: "Être capable de poursuivre son projet après la journée.",
    tone: "indigo",
    variant: "featured",
    ui: "continuer",
  },
] as const;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function MicroUi({ kind }: { kind: (typeof STEPS)[number]["ui"] }) {
  if (!kind) return null;

  if (kind === "structurer") {
    return (
      <div className={styles.uiStruct} aria-hidden>
        <span>Idée</span>
        <span className={styles.uiArrow}>→</span>
        <span>Objectif</span>
        <span className={styles.uiArrow}>→</span>
        <span className={styles.uiAccent}>Fonction</span>
      </div>
    );
  }

  if (kind === "creer") {
    return (
      <div className={styles.uiWindow} aria-hidden>
        <div className={styles.uiWindowBar}>
          <i /><i /><i />
        </div>
        <div className={styles.uiWindowBody}>
          <span className={styles.uiSkeleton} />
          <span className={cx(styles.uiSkeleton, styles.uiSkeletonShort)} />
          <span className={styles.uiChip}>v1</span>
        </div>
      </div>
    );
  }

  if (kind === "tester") {
    return (
      <div className={styles.uiTest} aria-hidden>
        <span className={styles.uiErr}>Erreur</span>
        <span className={styles.uiArrow}>→</span>
        <span className={styles.uiOk}>Validé</span>
      </div>
    );
  }

  if (kind === "ameliorer") {
    return (
      <div className={styles.uiDiff} aria-hidden>
        <span className={styles.uiBefore}>Avant</span>
        <span className={styles.uiArrow}>→</span>
        <span className={styles.uiAfter}>Après</span>
      </div>
    );
  }

  return (
    <div className={styles.uiRoad} aria-hidden>
      <span />
      <span />
      <span className={styles.uiRoadActive} />
      <span />
    </div>
  );
}

/** Parcours d’acquis — expérience de progression, pas une grille. */
export function HomeSkillsAfter() {
  const rootRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.16 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const on = inView ? styles.isIn : "";

  return (
    <section
      ref={rootRef}
      id="acquis"
      className={styles.scene}
      aria-labelledby="acquis-heading"
    >
      <div className={cx(styles.halo, styles.haloBlue)} aria-hidden />
      <div className={cx(styles.halo, styles.haloViolet)} aria-hidden />
      <div className={cx(styles.halo, styles.haloPeach)} aria-hidden />
      <div className={cx(styles.halo, styles.haloCenter)} aria-hidden />

      <div className={styles.shell}>
        <div className={styles.layout}>
          <div className={cx(styles.copy, on)}>
            <p className={styles.eyebrow}>Ce que vous saurez faire</p>
            <h2 id="acquis-heading" className={styles.title}>
              <span className={styles.titleInk}>Vous ne repartirez pas</span>
              <span className={styles.titleMuted}>développeur.</span>
              <span className={styles.titleInk}>Vous repartirez</span>
              <span className={styles.titleBlue}>
                avec les bases
                <br />
                pour commencer.
              </span>
            </h2>
            <p className={styles.lead}>
              Une journée ne fait pas de vous un expert technique.
              <br />
              Elle vous donne les repères, la méthode et les bons réflexes
              <br />
              pour transformer une idée en premier projet et continuer à avancer.
            </p>
          </div>

          <div className={styles.pathWrap}>
            <p className={cx(styles.journeyRail, on)} aria-hidden>
              {JOURNEY.map((label, i) => (
                <span key={label} className={styles.journeyItem}>
                  {i > 0 ? <span className={styles.journeySep}>→</span> : null}
                  {label}
                </span>
              ))}
            </p>

            <svg
              className={cx(styles.pathSvg, on)}
              viewBox="0 0 640 700"
              fill="none"
              aria-hidden
            >
              <defs>
                <linearGradient id="acquisPathGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.85" />
                  <stop offset="45%" stopColor="#818cf8" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.75" />
                </linearGradient>
              </defs>
              <path
                className={styles.pathLine}
                stroke="url(#acquisPathGrad)"
                d="M84 56
                   C 170 78, 250 120, 220 188
                   C 180 280, 340 290, 400 230
                   C 470 160, 560 240, 530 330
                   C 490 440, 300 420, 250 500
                   C 200 580, 360 620, 490 640"
              />
              {[
                [84, 56],
                [220, 188],
                [400, 230],
                [530, 330],
                [250, 500],
                [490, 640],
              ].map(([x, y], i) => (
                <g key={i} className={styles.pathNodeGroup} style={{ animationDelay: `${0.28 + i * 0.11}s` }}>
                  <circle className={styles.pathNodeOuter} cx={x} cy={y} r="9" />
                  <circle className={styles.pathNode} cx={x} cy={y} r="4.5" />
                </g>
              ))}
            </svg>

            <ol className={styles.steps}>
              {STEPS.map((step, i) => (
                <li
                  key={step.id}
                  className={cx(
                    styles.step,
                    styles[`step${step.id}`],
                    styles[`tone_${step.tone}`],
                    styles[`variant_${step.variant}`],
                    on,
                  )}
                  style={{ ["--i" as string]: String(i) }}
                >
                  <div className={styles.stepHead}>
                    <span className={styles.stepNum}>{step.id}</span>
                    <span className={styles.stepIcon} aria-hidden>
                      <StepIcon id={step.id} />
                    </span>
                  </div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                  <MicroUi kind={step.ui} />
                </li>
              ))}
            </ol>

            <aside className={cx(styles.signature, on)} aria-label="Phrase signature">
              <p>
                <span className={styles.sigInk}>Vous n’apprenez pas</span>
                <span className={styles.sigMuted}>à tout savoir.</span>
              </p>
              <p>
                <span className={styles.sigInk}>Vous apprenez à</span>
                <span className={styles.sigBlue}>savoir commencer.</span>
              </p>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepIcon({ id }: { id: string }) {
  const stroke = {
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (id === "01") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path {...stroke} d="M4 6h16M4 12h10M4 18h7" />
      </svg>
    );
  }
  if (id === "02") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path {...stroke} d="M8 9h8M8 13h5M6 4h12a2 2 0 012 2v12l-4-2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
      </svg>
    );
  }
  if (id === "03") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <rect {...stroke} x="4" y="5" width="16" height="14" rx="2" />
        <path {...stroke} d="M8 9h8M8 13h5" />
      </svg>
    );
  }
  if (id === "04") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle {...stroke} cx="12" cy="12" r="8" />
        <path {...stroke} d="M9 12l2 2 4-4" />
      </svg>
    );
  }
  if (id === "05") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path {...stroke} d="M12 5v14M5 12h14" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...stroke} d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
