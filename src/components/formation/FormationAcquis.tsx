"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FORMATION_ACQUIS } from "@/lib/bework-formation";
import styles from "./FormationAcquis.module.css";

const ICONS: ReactNode[] = [
  // Transformer — bulb
  <svg key="bulb" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a5 5 0 0 1 3.5 8.5V14H8.5v-2.5A5 5 0 0 1 12 3Z" />
  </svg>,
  // Structurer — list
  <svg key="list" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" strokeLinecap="round" />
  </svg>,
  // Demander — chat
  <svg key="chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H11l-4 3V6.5Z" />
  </svg>,
  // Créer — code
  <svg key="code" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m8 8-4 4 4 4M16 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  // Modifier — sliders
  <svg key="sliders" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
    <path d="M2 14h4M10 8h4M18 16h4" />
  </svg>,
  // Tester — play
  <svg key="play" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 6.5v11l9-5.5-9-5.5z" strokeLinejoin="round" />
  </svg>,
  // Corriger — bug/wrench
  <svg key="fix" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-1.9-1.9 2-2.1Z" />
  </svg>,
  // Améliorer — chart
  <svg key="chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19V5M4 19h16" />
    <path d="M8 15l3-3 3 2 5-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  // Comprendre — book
  <svg key="book" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z" />
    <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5a2.5 2.5 0 0 1 2.5 2.5V5.5Z" />
  </svg>,
  // Continuer — rocket
  <svg key="rocket" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 15c1.5-1 3.5-1.5 6-1.5S15.5 14 17 15l2-2c-1.2-2.8-3.5-5.4-6.5-7.2C9.8 4.2 7.2 3.5 5 3.5c0 2.2.7 4.8 2.3 7.5C8.9 13.5 11 15.5 13 17l-2 2c-1-1.5-1.5-3.5-1.5-6S6 8.5 5 7.5" />
    <path d="M9 15l-4 4" />
  </svg>,
];

/** Acquis — hero scène + grille de capacités (pas de promesse de maîtrise). */
export function FormationAcquis() {
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
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
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
      id="acquis"
      className={rootClass}
      aria-labelledby="acquis-title"
    >
      <div className={styles.shell}>
        <div className={styles.hero}>
          <div className={`${styles.copy} ${styles.reveal}`} style={{ ["--d" as string]: "0ms" }}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden />
              Ce que vous aurez déjà acquis
            </p>
            <h2 id="acquis-title" className={styles.title}>
              À 9h, vous arrivez peut-être
              <br />
              avec une simple idée.
              <br />
              <span className={styles.gradientLine}>
                À 17h, vous saurez comment{" "}
                <span className={styles.gradientAccent}>commencer.</span>
              </span>
            </h2>
            <p className={styles.lead}>À la fin de la journée, vous aurez découvert comment :</p>
          </div>

          <div
            className={`${styles.visual} ${styles.fromRight}`}
            style={{ ["--d" as string]: "120ms" }}
          >
            <Image
              src="/marketing/formation-acquis-desk.jpg"
              alt="Bureau BeWork — de l’idée au projet, sur ordinateur, avec carnet et café."
              width={1659}
              height={677}
              sizes="(max-width: 900px) 100vw, 42vw"
              className={styles.visualPhoto}
              unoptimized
            />
          </div>
        </div>

        <ol className={styles.grid} aria-label="Capacités acquises pendant la journée">
          {FORMATION_ACQUIS.map((item, i) => (
            <li
              key={item.verb}
              className={`${styles.card} ${styles.reveal}`}
              style={{ ["--d" as string]: `${180 + i * 45}ms` }}
            >
              <div className={styles.cardTop}>
                <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.icon} aria-hidden>
                  {ICONS[i]}
                </span>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.verb}>{item.verb}</p>
                <p className={styles.text}>{item.text}</p>
              </div>
              <span className={styles.arrow} aria-hidden>
                <svg viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6 3.5 10.5 8 6 12.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
