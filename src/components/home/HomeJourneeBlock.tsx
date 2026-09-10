"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./HomeJourneeBlock.module.css";

const IDEA_STEPS = [
  "Comprendre les possibilités",
  "Expérimenter en direct",
  "Commencer à construire",
] as const;

const BENEFITS = [
  {
    title: "Démonstrations concrètes",
    desc: "Voir réellement ce qu’il est possible de construire.",
    tone: styles.iconBlue,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    ),
  },
  {
    title: "Petit groupe",
    desc: "Un accompagnement plus proche.",
    tone: styles.iconViolet,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    ),
  },
  {
    title: "Pratique sur vos idées",
    desc: "Passez immédiatement à l’expérimentation.",
    tone: styles.iconPeach,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    ),
  },
  {
    title: "Méthode réutilisable",
    desc: "Continuez après la journée.",
    tone: styles.iconMint,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    ),
  },
] as const;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Section « La journée BeWork » — bloc premium équilibré. */
export function HomeJourneeBlock() {
  const rootRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const reveal = inView ? styles.isIn : "";

  return (
    <section
      ref={rootRef}
      id="journee"
      className={styles.scene}
      aria-labelledby="journee-home-heading"
    >
      <div className={cx(styles.halo, styles.haloBlue)} aria-hidden />
      <div className={cx(styles.halo, styles.haloViolet)} aria-hidden />
      <div className={cx(styles.halo, styles.haloPeach)} aria-hidden />
      <svg className={styles.curve} viewBox="0 0 1200 420" fill="none" aria-hidden>
        <path
          d="M40 280C220 120 420 60 620 90C860 130 980 240 1160 170"
          stroke="currentColor"
          strokeWidth="56"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>

      <div className={styles.shell}>
        <div className={styles.panel}>
          <div className={cx(styles.note)} aria-hidden>
            <p className={styles.noteText}>Des idées aux projets.</p>
            <svg className={styles.noteSvg} viewBox="0 0 44 22" fill="none">
              <path
                d="M4 6c10 2 20 8 32 12"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M30 14l6 4-2 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className={styles.visual}>
            <div className={cx(styles.photoFrame, reveal)}>
              <Image
                src="/marketing/journee-bework.jpg"
                alt="Atelier BeWork : journée pratique en petit groupe autour d’un écran"
                fill
                className={styles.photo}
                sizes="(max-width:1024px) 100vw, 48vw"
                priority={false}
              />
              <span className={styles.capsule}>Journée pratique</span>
            </div>

            <div className={cx(styles.ideaCard, reveal)}>
              <p className={styles.ideaTitle}>De l’idée au projet</p>
              <ul className={styles.ideaList}>
                {IDEA_STEPS.map((step) => (
                  <li key={step}>
                    <span className={styles.check} aria-hidden>
                      ✓
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={cx(styles.content, reveal)}>
            <p className={styles.eyebrow}>La journée BeWork</p>
            <h2 id="journee-home-heading" className={styles.title}>
              <span className={styles.titleLine}>Pas une journée à écouter.</span>
              <span className={cx(styles.titleLine, styles.titleAccent)}>
                Une journée à créer.
              </span>
            </h2>
            <p className={styles.lead}>
              Une expérience pratique pour découvrir comment transformer vos idées en projets
              numériques grâce à l’intelligence artificielle.
            </p>

            <ul className={styles.benefits}>
              {BENEFITS.map((b) => (
                <li key={b.title} className={cx(styles.benefit, reveal)}>
                  <span className={cx(styles.benefitIcon, b.tone)} aria-hidden>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {b.icon}
                    </svg>
                  </span>
                  <div className={styles.benefitText}>
                    <p className={styles.benefitTitle}>{b.title}</p>
                    <p className={styles.benefitDesc}>{b.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.ctas}>
              <Link href="/formation" className={styles.btnPrimary}>
                Découvrir le déroulement
                <span aria-hidden>→</span>
              </Link>
              <Link href="/demonstrations" className={styles.btnSecondary}>
                Voir les démonstrations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
