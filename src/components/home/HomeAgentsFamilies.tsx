"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./HomeAgentsFamilies.module.css";

type FamilyId = "gpt" | "claude" | "gemini" | "grok" | "kimi" | "glm";

type Family = {
  id: FamilyId;
  name: string;
  models: string[];
  role: string;
  keywords: string[];
  logoSrc: string;
  logoAlt: string;
};

const FAMILIES: Family[] = [
  {
    id: "gpt",
    name: "Famille GPT",
    models: ["GPT-5.6", "Codex 5.3"],
    role: "Code, architecture, automatisation",
    keywords: ["CODE", "ARCHITECTURE", "AUTOMATISATION"],
    logoSrc: "/marketing/agents-logos/openai.svg",
    logoAlt: "Logo OpenAI / GPT",
  },
  {
    id: "claude",
    name: "Famille Claude",
    models: ["Opus 5", "Sonnet 5", "Haiku 4.5"],
    role: "Structure, stratégie, rédaction technique",
    keywords: ["STRUCTURE", "STRATÉGIE", "RÉDACTION"],
    logoSrc: "/marketing/agents-logos/claude.svg",
    logoAlt: "Logo Claude / Anthropic",
  },
  {
    id: "gemini",
    name: "Famille Gemini",
    models: ["Gemini 3.8 Flash", "Gemini 3.1 Pro"],
    role: "Vision, analyse, variantes rapides",
    keywords: ["VISION", "ANALYSE", "VARIANTES"],
    logoSrc: "/marketing/agents-logos/gemini.svg",
    logoAlt: "Logo Gemini",
  },
  {
    id: "grok",
    name: "Famille Grok",
    models: ["Grok 4.6"],
    role: "Approches alternatives, performance",
    keywords: ["ALTERNATIVES", "PERFORMANCE"],
    logoSrc: "/marketing/agents-logos/grok.svg",
    logoAlt: "Logo Grok / xAI",
  },
  {
    id: "kimi",
    name: "Famille Kimi",
    models: ["Kimi K3", "Kimi K2.7 Code"],
    role: "Code alternatif, vitesse, exploration",
    keywords: ["CODE", "VITESSE", "EXPLORATION"],
    logoSrc: "/marketing/agents-logos/kimi.svg",
    logoAlt: "Logo Kimi",
  },
  {
    id: "glm",
    name: "Famille GLM",
    models: ["GLM 5.2"],
    role: "Soutien technique, options complémentaires",
    keywords: ["SOUTIEN", "OPTIONS"],
    logoSrc: "/marketing/agents-logos/glm.svg",
    logoAlt: "Logo GLM / Zhipu",
  },
];

type Step = {
  id: string;
  label: string;
  desc: string;
  families: FamilyId[];
};

const STEPS: Step[] = [
  { id: "idee", label: "Idée", desc: "Clarifier l’ambition et les besoins.", families: ["claude"] },
  {
    id: "cadrage",
    label: "Cadrage",
    desc: "Structurer, prioriser et définir la solution.",
    families: ["claude", "gpt"],
  },
  {
    id: "ui",
    label: "UI / UX",
    desc: "Explorer, concevoir et affiner l’interface.",
    families: ["gemini"],
  },
  {
    id: "code",
    label: "Code",
    desc: "Développer, intégrer et automatiser.",
    families: ["gpt", "kimi"],
  },
  {
    id: "tests",
    label: "Tests",
    desc: "Vérifier, corriger et sécuriser.",
    families: ["gpt", "grok", "glm"],
  },
  {
    id: "amelioration",
    label: "Amélioration",
    desc: "Optimiser, itérer et faire évoluer.",
    families: ["claude", "gemini", "gpt"],
  },
];

const POINTS = [
  "La bonne famille au bon moment",
  "Des agents complémentaires",
  "Moins d’itérations, plus de précision",
] as const;

function familyById(id: FamilyId) {
  return FAMILIES.find((f) => f.id === id)!;
}

/** Section signature — orchestration des familles d’agents IA. */
export function HomeAgentsFamilies() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [entered, setEntered] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredFamily, setHoveredFamily] = useState<FamilyId | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setEntered(true);
      },
      { threshold: 0.16 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!entered || !autoPlay || reduceMotion.current) return;
    const id = window.setInterval(() => {
      setActiveStep((s) => (s + 1) % STEPS.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [entered, autoPlay]);

  const litFamilies = new Set<FamilyId>(
    hoveredFamily ? [hoveredFamily] : (STEPS[activeStep]?.families ?? []),
  );

  const litSteps = new Set(
    hoveredFamily
      ? STEPS.filter((s) => s.families.includes(hoveredFamily)).map((s) => s.id)
      : [STEPS[activeStep]?.id],
  );

  const currentStep = STEPS[activeStep]!;

  return (
    <section
      ref={rootRef}
      id="agents"
      className={`${styles.scene}${entered ? ` ${styles.entered}` : ""}`}
      aria-labelledby="agents-heading"
    >
      <div className={styles.bg} aria-hidden>
        <Image
          src="/marketing/agents-families-bg-2560.jpg"
          alt=""
          fill
          sizes="100vw"
          quality={88}
          className={styles.bgImg}
        />
        <div className={styles.bgVeil} />
      </div>

      <div className={styles.shell}>
        {/* A — Intro */}
        <div className={styles.actIntro}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Intelligence collective</p>
            <h2 id="agents-heading" className={styles.title}>
              <span className={styles.titleLine}>Les familles d’agents IA</span>
              <span className={styles.titleLine}>que nous activons</span>
              <span className={`${styles.titleLine} ${styles.titleGradient}`}>
                selon votre projet.
              </span>
            </h2>

            <p className={styles.lead}>
              Nous ne mobilisons pas les mêmes intelligences pour tout faire.
              Selon ce que vous voulez créer, nous activons les familles les plus
              adaptées au cadrage, à l’interface, au développement, aux corrections
              et à l’optimisation.
            </p>

            <ul className={styles.points}>
              {POINTS.map((title) => (
                <li key={title}>
                  <span className={styles.pointMark} aria-hidden />
                  <strong>{title}</strong>
                </li>
              ))}
            </ul>
          </div>

          {/* B — Familles */}
          <div className={styles.grid} role="list">
            {FAMILIES.map((family, i) => {
              const lit = litFamilies.has(family.id);
              return (
                <article
                  key={family.id}
                  role="listitem"
                  className={`${styles.card} ${styles[`card_${family.id}`]}${
                    lit ? ` ${styles.cardLit}` : ""
                  }`}
                  style={{ ["--stagger" as string]: `${80 + i * 60}ms` }}
                  onMouseEnter={() => {
                    setHoveredFamily(family.id);
                    setAutoPlay(false);
                  }}
                  onMouseLeave={() => setHoveredFamily(null)}
                  onFocus={() => {
                    setHoveredFamily(family.id);
                    setAutoPlay(false);
                  }}
                  onBlur={() => setHoveredFamily(null)}
                  tabIndex={0}
                >
                  <header className={styles.cardHead}>
                    <span className={styles.cardLogo}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={family.logoSrc} alt={family.logoAlt} width={28} height={28} />
                    </span>
                    <h3 className={styles.cardName}>{family.name}</h3>
                  </header>
                  <div className={styles.pills}>
                    {family.models.map((m) => (
                      <span key={m} className={styles.pill}>
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className={styles.cardRole}>{family.role}</p>
                  <p className={styles.cardKeys}>{family.keywords.join(" · ")}</p>
                </article>
              );
            })}
          </div>
        </div>

        {/* C — Orchestration */}
        <div className={styles.actOrch}>
          <div className={styles.orchHeader}>
            <p className={styles.orchEyebrow}>Orchestration</p>
            <h3 className={styles.orchTitle}>
              Un projet, plusieurs étapes,
              <br />
              les bonnes familles.
            </h3>
            <p className={styles.orchHint} aria-live="polite">
              <strong>{currentStep.label}</strong>
              <span>{currentStep.desc}</span>
            </p>
          </div>

          <div className={styles.timelineWrap}>
            <div className={styles.timelineTrack} aria-hidden>
              <span
                className={styles.timelineProgress}
                style={{ ["--progress" as string]: `${(activeStep / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
            <ol className={styles.timeline} aria-label="Parcours pédagogique">
              {STEPS.map((step, i) => {
                const linked = litSteps.has(step.id);
                const selected = activeStep === i;
                return (
                  <li key={step.id} className={styles.step}>
                    <button
                      type="button"
                      className={`${styles.stepBtn}${linked ? ` ${styles.stepLinked}` : ""}${
                        selected ? ` ${styles.stepSelected}` : ""
                      }`}
                      aria-pressed={selected}
                      onClick={() => {
                        setActiveStep(i);
                        setAutoPlay(false);
                      }}
                    >
                      <span className={styles.stepNum}>{String(i + 1).padStart(2, "0")}</span>
                      <span className={styles.stepDot} aria-hidden />
                      <span className={styles.stepLabel}>{step.label}</span>
                      <span className={styles.stepFamilies}>
                        {step.families.map((fid) => {
                          const fam = familyById(fid);
                          return (
                            <span
                              key={fid}
                              className={`${styles.miniLogo}${
                                litFamilies.has(fid) ? ` ${styles.miniLit}` : ""
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={fam.logoSrc} alt="" width={14} height={14} />
                            </span>
                          );
                        })}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <div className={styles.statement}>
          <div className={styles.statementBody}>
            <p className={styles.statementLead}>
              Nous n’utilisons pas un seul agent pour tout faire.
            </p>
            <p className={styles.statementAccent}>
              Nous activons la bonne famille selon la nature de ce que vous voulez créer.
            </p>
          </div>
          <ul className={styles.statementAside}>
            <li>Bons agents</li>
            <li>Bonnes étapes</li>
            <li>Meilleurs résultats</li>
          </ul>
        </div>

        <p className={styles.secondaryLink}>
          <Link href="/demonstrations">Découvrir ce qu’il est possible de créer →</Link>
        </p>
      </div>
    </section>
  );
}
