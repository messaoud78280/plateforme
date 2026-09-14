"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "./HomeAgentsFamilies.module.css";

type AgentId = "conception" | "structure" | "creation" | "verification" | "improvement";

type AgentProfile = {
  id: AgentId;
  name: string;
  role: string;
  strengths: readonly string[];
};

const AGENTS: readonly AgentProfile[] = [
  {
    id: "conception",
    name: "IA de conception",
    role: "Clarifier l’ambition, les usages et les priorités.",
    strengths: ["BESOIN", "IDÉES", "PRIORITÉS"],
  },
  {
    id: "structure",
    name: "IA de structuration",
    role: "Organiser le projet pour avancer étape par étape.",
    strengths: ["PARCOURS", "ÉCRANS", "FONCTIONS"],
  },
  {
    id: "creation",
    name: "IA de création",
    role: "Transformer le plan en résultat visible et manipulable.",
    strengths: ["INTERFACE", "CONTENU", "ACTIONS"],
  },
  {
    id: "verification",
    name: "IA de vérification",
    role: "Tester, repérer les incohérences et sécuriser les évolutions.",
    strengths: ["TESTS", "COHÉRENCE", "CORRECTIONS"],
  },
  {
    id: "improvement",
    name: "IA d’amélioration",
    role: "Affiner l’expérience et préparer les prochaines versions.",
    strengths: ["CLARTÉ", "FLUIDITÉ", "PROGRESSION"],
  },
] as const;

const STEPS = [
  {
    label: "Idée",
    desc: "Clarifier le besoin et le résultat attendu.",
    agents: ["conception"] satisfies AgentId[],
  },
  {
    label: "Cadrage",
    desc: "Choisir les priorités et organiser le projet.",
    agents: ["conception", "structure"] satisfies AgentId[],
  },
  {
    label: "Interface",
    desc: "Donner une forme claire et cohérente à l’idée.",
    agents: ["structure", "creation"] satisfies AgentId[],
  },
  {
    label: "Construction",
    desc: "Créer les écrans et les fonctions utiles.",
    agents: ["creation"] satisfies AgentId[],
  },
  {
    label: "Tests",
    desc: "Vérifier le parcours et corriger les blocages.",
    agents: ["verification"] satisfies AgentId[],
  },
  {
    label: "Amélioration",
    desc: "Affiner le résultat et organiser la suite.",
    agents: ["verification", "improvement"] satisfies AgentId[],
  },
] as const;

/** Section publique : valeur de l’orchestration, sans exposer la recette technique. */
export function HomeAgentsFamilies() {
  const [activeStep, setActiveStep] = useState(0);
  const currentStep = STEPS[activeStep] ?? STEPS[0];
  const activeAgents = new Set<AgentId>(currentStep.agents);

  return (
    <section id="agents" className={styles.scene} aria-labelledby="agents-heading">
      <div className={styles.bg} aria-hidden>
        <Image
          src="/marketing/agents-families-bg-2560.jpg"
          alt=""
          fill
          sizes="100vw"
          quality={75}
          className={styles.bgImg}
        />
        <div className={styles.bgVeil} />
      </div>

      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Intelligence collective</p>
            <h2 id="agents-heading" className={styles.title}>
              Plusieurs intelligences spécialisées.
              <span>Une seule direction&nbsp;: votre projet.</span>
            </h2>
          </div>
          <p className={styles.lead}>
            Chaque étape ne demande pas la même expertise. BeWork vous apprend à mobiliser
            la bonne intelligence pour concevoir, structurer, créer, vérifier et améliorer —
            sans transformer la formation en cours technique.
          </p>
        </header>

        <div className={styles.agentGrid} role="list">
          {AGENTS.map((agent, index) => {
            const active = activeAgents.has(agent.id);
            return (
              <article
                key={agent.id}
                role="listitem"
                className={`${styles.agentCard}${active ? ` ${styles.agentCardActive}` : ""}`}
              >
                <span className={styles.agentIndex} aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{agent.name}</h3>
                <p>{agent.role}</p>
                <ul aria-label={`Points forts — ${agent.name}`}>
                  {agent.strengths.map((strength) => (
                    <li key={strength}>{strength}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <div className={styles.orchestration}>
          <div className={styles.orchestrationHead}>
            <div>
              <p className={styles.orchestrationEyebrow}>Une progression lisible</p>
              <h3>Les bonnes intelligences, au bon moment.</h3>
            </div>
            <p className={styles.currentStep} aria-live="polite">
              <strong>{currentStep.label}</strong>
              <span>{currentStep.desc}</span>
            </p>
          </div>

          <ol className={styles.timeline} aria-label="Étapes d’un projet">
            {STEPS.map((step, index) => {
              const selected = activeStep === index;
              return (
                <li key={step.label}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    className={`${styles.stepButton}${selected ? ` ${styles.stepButtonActive}` : ""}`}
                    onClick={() => setActiveStep(index)}
                  >
                    <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
                    <span className={styles.stepDot} aria-hidden />
                    <span>{step.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <footer className={styles.footer}>
          <p>
            Vous gardez la vision et les décisions.
            <strong> Les intelligences spécialisées vous aident à avancer avec méthode.</strong>
          </p>
          <Link href="/demonstrations">Voir des résultats concrets →</Link>
        </footer>
      </div>
    </section>
  );
}
