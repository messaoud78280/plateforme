"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./FormationWhy.module.css";

const BEFORE = [
  "J’ai une idée",
  "Je ne sais pas coder",
  "Je dois trouver quelqu’un",
  "Je dois financer la réalisation",
  "Je dépends de compétences extérieures",
] as const;

const TODAY = [
  "J’ai une idée",
  "Je l’explique",
  "L’IA m’aide à la structurer",
  "Je commence à construire",
  "Je teste",
  "Je corrige",
  "J’améliore",
] as const;

/** Pourquoi cette journée — scène visuelle + entrée animée (comme Formats). */
export function FormationWhy() {
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
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!ready || reduced) return;
    const t = window.setTimeout(() => setAmbient(true), 900);
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
      id="presentation"
      className={rootClass}
      aria-labelledby="why-title"
    >
      <div className={styles.shell}>
        <div
          className={`${styles.stage} ${styles.reveal}`}
          style={{ ["--d" as string]: "80ms" }}
        >
          <div className={styles.frame}>
            <Image
              src="/marketing/formation-why-scene.webp"
              alt=""
              width={4096}
              height={2728}
              sizes="(max-width: 768px) 96vw, min(1180px, 92vw)"
              className={styles.scene}
              unoptimized
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div className="sr-only">
        <p>Pourquoi cette journée</p>
        <h2 id="why-title">
          Un monde qui était technique devient accessible à beaucoup plus de monde.
        </h2>
        <p>
          L’IA ne remplace pas votre idée. Elle réduit la distance entre votre idée et sa
          première réalisation.
        </p>
        <div>
          <p>Avant — C’était complexe et réservé à quelques-uns.</p>
          <ul>
            {BEFORE.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <p>Un parcours souvent long et compliqué</p>
        </div>
        <div>
          <p>Aujourd’hui — L’IA vous accompagne à chaque étape.</p>
          <ul>
            {TODAY.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
        <ul>
          <li>Plus simple</li>
          <li>Plus accessible</li>
          <li>Plus de possibilités</li>
        </ul>
      </div>
    </section>
  );
}
