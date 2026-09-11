"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./FormationPrerequis.module.css";

const BRING = [
  "Ordinateur portable",
  "Chargeur",
  "Accès à votre email",
  "Navigateur récent (Chrome, Edge, Safari…)",
  "Droits d’installation sur la machine",
  "Éventuellement une idée de projet",
  "Connexion Internet (session visio)",
] as const;

const COMPUTER = [
  "Windows ou Mac relativement récent",
  "8 Go de RAM minimum recommandés",
  "16 Go = plus confortable",
  "Quelques Go d’espace disponible",
] as const;

const NOT_NEEDED = [
  "Carte graphique dédiée",
  "Ordinateur gaming",
  "Machine haut de gamme",
  "Connaissances en programmation",
  "Expérience en création de sites",
  "Connaissance préalable de l’IA",
] as const;

const VISIO = [
  "Connexion Internet stable",
  "Webcam recommandée",
  "Microphone",
  "Possibilité de partager son écran",
  "Environnement calme",
  "Ordinateur avec droits d’installation",
  "Espace de travail confortable",
] as const;

function IconCheck({ tone }: { tone: "blue" | "violet" }) {
  return (
    <span className={`${styles.mark} ${styles[`mark_${tone}`]}`} aria-hidden>
      <svg viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6.2 4.8 8.5 9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function IconX() {
  return (
    <span className={`${styles.mark} ${styles.mark_muted}`} aria-hidden>
      <svg viewBox="0 0 12 12" fill="none">
        <path d="M3.5 3.5 8.5 8.5M8.5 3.5 3.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function CardIcon({ children, tone }: { children: ReactNode; tone: string }) {
  return <span className={`${styles.cardIcon} ${styles[`icon_${tone}`]}`}>{children}</span>;
}

/** Prérequis — composition premium + animations. */
export function FormationPrerequis() {
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
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!ready || reduced) return;
    const t = window.setTimeout(() => setAmbient(true), 850);
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
      id="prerequis"
      className={rootClass}
      aria-labelledby="prerequis-title"
    >
      <div className={styles.shell}>
        <div className={styles.hero}>
          <div className={`${styles.heroCopy} ${styles.reveal}`} style={{ ["--d" as string]: "0ms" }}>
            <p className={styles.eyebrow}>Ce qu’il vous faut</p>
            <h2 id="prerequis-title" className={styles.title}>
              Pas besoin d’un ordinateur de développeur.
            </h2>
            <p className={styles.lead}>
              Un simple ordinateur suffit pour suivre la formation et mettre en pratique, pas à
              pas, avec l’accompagnement de l’IA.
            </p>
          </div>

          <div
            className={`${styles.heroVisual} ${styles.fromRight}`}
            style={{ ["--d" as string]: "140ms" }}
          >
            <Image
              src="/marketing/formation-prerequis-laptop.jpg"
              alt="Ordinateur portable BeWork — une idée, un projet, des compétences réelles."
              width={4096}
              height={1752}
              sizes="(max-width: 900px) 100vw, 42vw"
              className={styles.heroPhoto}
              unoptimized
              priority={false}
            />
          </div>
        </div>

        <div className={styles.cards}>
          <article
            className={`${styles.card} ${styles.cardBlue} ${styles.reveal}`}
            style={{ ["--d" as string]: "180ms" }}
          >
            <p className={styles.cardKicker}>À apporter</p>
            <div className={styles.cardHead}>
              <CardIcon tone="blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="12" rx="2" />
                  <path d="M8 20h8M12 17v3" />
                </svg>
              </CardIcon>
              <h3>L’essentiel</h3>
            </div>
            <ul className={styles.list}>
              {BRING.map((item) => (
                <li key={item}>
                  <IconCheck tone="blue" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article
            className={`${styles.card} ${styles.cardViolet} ${styles.reveal}`}
            style={{ ["--d" as string]: "260ms" }}
          >
            <p className={styles.cardKicker}>Ordinateur recommandé</p>
            <div className={styles.cardHead}>
              <CardIcon tone="violet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
                  <path d="M12 12l4-2.5" />
                </svg>
              </CardIcon>
              <h3>Plus de confort</h3>
            </div>
            <ul className={styles.list}>
              {COMPUTER.map((item) => (
                <li key={item}>
                  <IconCheck tone="violet" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article
            className={`${styles.card} ${styles.cardMuted} ${styles.reveal}`}
            style={{ ["--d" as string]: "340ms" }}
          >
            <p className={styles.cardKicker}>Pas nécessaire</p>
            <div className={styles.cardHead}>
              <CardIcon tone="muted">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="8" width="14" height="9" rx="1.5" />
                  <path d="M17 11h3v3h-3M7 20h6" />
                  <path d="m4 5 16 14" />
                </svg>
              </CardIcon>
              <h3>Inutile d’investir</h3>
            </div>
            <ul className={`${styles.list} ${styles.listMuted}`}>
              {NOT_NEEDED.map((item) => (
                <li key={item}>
                  <IconX />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className={`${styles.banner} ${styles.reveal}`} style={{ ["--d" as string]: "420ms" }}>
          <div className={styles.bannerLeft}>
            <span className={styles.bannerIcon} aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18h6M10 21h4" />
                <path d="M12 3a5 5 0 0 1 3.5 8.5V14H8.5v-2.5A5 5 0 0 1 12 3Z" />
              </svg>
            </span>
            <p>
              Un ordinateur. Une connexion. Une idée.
              <strong> Et l’envie d’essayer.</strong>
            </p>
          </div>
          <a href="#programme" className={styles.bannerCta}>
            Découvrir la formation →
          </a>
        </div>

        <p className={`${styles.note} ${styles.reveal}`} style={{ ["--d" as string]: "480ms" }}>
          Si votre ordinateur appartient à votre entreprise, vérifiez que vous avez le droit
          d’installer les applications nécessaires.
        </p>

        <div className={`${styles.visio} ${styles.reveal}`} style={{ ["--d" as string]: "540ms" }}>
          <div className={styles.visioCopy}>
            <p className={styles.eyebrow}>Session visio</p>
            <h3 className={styles.visioTitle}>Pour participer à distance</h3>
            <ul className={styles.visioList}>
              {VISIO.map((item) => (
                <li key={item}>
                  <IconCheck tone="blue" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.visioScene}>
            <Image
              src="/marketing/formation-prerequis-visio.webp"
              alt="Session visio BeWork depuis un bureau à domicile — même endroit, plus d’opportunités."
              width={4096}
              height={1752}
              sizes="(max-width: 900px) 100vw, 42vw"
              className={styles.visioPhoto}
              unoptimized
            />
          </div>

          <p className={styles.visioFoot}>
            <span className={styles.infoMark} aria-hidden>
              i
            </span>
            Une courte vérification technique pourra être proposée avant la session, afin
            d’éviter de perdre du temps le jour J.
          </p>
        </div>
      </div>
    </section>
  );
}
