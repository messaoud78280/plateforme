"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import styles from "./MarketingSitePreFooter.module.css";

const EXAMPLES = [
  {
    href: "/demonstrations/messagerie",
    title: "Messagerie interne",
    desc: "Échangez, collaborez, centralisez vos messages.",
    iconClass: styles.cardIconBlue,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-4 3.2V6.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/demonstrations/agenda",
    title: "Agenda partagé",
    desc: "Organisez vos événements et vos équipes.",
    iconClass: styles.cardIconViolet,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/demonstrations/reservation",
    title: "Réservation en ligne",
    desc: "Acceptez des réservations en quelques clics.",
    iconClass: styles.cardIconPeach,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 7h10v3.2a2.8 2.8 0 0 1-2.8 2.8H9.8A2.8 2.8 0 0 1 7 10.2V7Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M8.5 7V5.5M15.5 7V5.5M7 12.5h10v5.2A1.8 1.8 0 0 1 15.2 19.5H8.8A1.8 1.8 0 0 1 7 17.7V12.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/demonstrations/dashboard",
    title: "Tableau de bord",
    desc: "Suivez vos données en temps réel.",
    iconClass: styles.cardIconMint,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 19V5M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8 15v-4M12 15V8M16 15v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

const NAV = ["Accueil", "Messages", "Réservations", "Équipe", "Statistiques"] as const;

const BARS = [42, 58, 48, 72, 64, 86];

/** Bandeau conclusion marketing — showcase premium 2 colonnes. */
export function MarketingSitePreFooter() {
  const chartsRef = useRef<HTMLDivElement | null>(null);
  const [chartsVisible, setChartsVisible] = useState(false);
  const [visits, setVisits] = useState(356);

  useEffect(() => {
    const el = chartsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setChartsVisible(true);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!chartsVisible) return;
    const id = window.setInterval(() => {
      setVisits((v) => (v >= 361 ? 356 : v + 1));
    }, 2800);
    return () => window.clearInterval(id);
  }, [chartsVisible]);

  return (
    <section
      className={`bw-prefooter-blend ${styles.scene}`}
      aria-labelledby="prefooter-formation"
    >
      <div className={styles.bg} aria-hidden>
        <Image
          src="/marketing/prefooter-showcase-bg-2048.jpg"
          alt=""
          fill
          priority={false}
          sizes="100vw"
          quality={90}
          className={styles.bgImg}
        />
      </div>

      <div className={styles.shell}>
        <div className={styles.grid}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Commencer concrètement</p>
            <h2 id="prefooter-formation" className={styles.title}>
              Vous avez une idée&nbsp;?
              <br />
              Commencez à lui donner
              <br />
              <span className={styles.titleAccent}>une vraie forme.</span>
            </h2>
            <p className={styles.lead}>
              En une journée, découvrez comment transformer une idée en premier projet
              concret&nbsp;: site, application, outil interne ou système de réservation.
              Sans savoir coder, vous repartez avec une méthode claire, des bases solides
              et une direction pour continuer.
            </p>

            <div className={styles.ctaRow}>
              <Link
                href="/contact#participer"
                className={styles.ctaPrimary}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "prefooter-participer")}
              >
                Découvrir la journée <span aria-hidden>→</span>
              </Link>
              <Link href="/demonstrations" className={styles.ctaSecondary}>
                Voir les démonstrations <span aria-hidden>→</span>
              </Link>
            </div>

            <div className={styles.reassurance}>
              <div className={styles.reassureItem}>
                <span className={styles.reassureIcon} aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M13 3 5 14h6l-1 7 9-12h-6l0-6Z" fill="currentColor" />
                  </svg>
                </span>
                <span className={styles.reassureText}>
                  <strong>Une journée</strong>
                  <span>100&nbsp;% pratique</span>
                </span>
              </div>
              <div className={styles.reassureItem}>
                <span className={styles.reassureIcon} aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M16 11a3 3 0 1 0-0.01-6A3 3 0 0 0 16 11ZM8 11a3 3 0 1 0-0.01-6A3 3 0 0 0 8 11Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M3.5 19c.6-2.4 2.6-4 5.1-4h.4c1.1 0 2.1.3 3 1M13.5 16c.9-.6 1.9-1 3-1h.2c2.5 0 4.5 1.6 5.1 4"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className={styles.reassureText}>
                  <strong>En petit groupe</strong>
                  <span>Accompagnement attentif</span>
                </span>
              </div>
              <div className={styles.reassureItem}>
                <span className={styles.reassureIcon} aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M4 19V5M4 19h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    <path d="M8 15v-3M12 15V9M16 15v-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </span>
                <span className={styles.reassureText}>
                  <strong>Une méthode claire</strong>
                  <span>et directement applicable</span>
                </span>
              </div>
            </div>

            <p className={styles.signature}>Apprendre aujourd&apos;hui. Construire demain.</p>

            <div className={styles.note} aria-hidden>
              <p className={styles.noteText}>Des outils réels, pour des projets réels.</p>
              <svg className={styles.noteArrow} viewBox="0 0 48 28" fill="none">
                <path
                  d="M2 8c10 2 22 10 34 14M36 22l8-2-4-7"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className={styles.showcaseWrap}>
            <div className={styles.showcase}>
              <div className={styles.showcaseHead}>
                <div>
                  <h3 className={styles.showcaseTitle}>Ce que vous pouvez créer</h3>
                  <p className={styles.showcaseSub}>
                    Des exemples concrets pour comprendre les possibilités.
                  </p>
                </div>
                <div className={styles.navDots} aria-hidden>
                  <span className={styles.navDot}>‹</span>
                  <span className={styles.navDot}>›</span>
                </div>
              </div>

              <div className={styles.cards}>
                {EXAMPLES.map((ex) => (
                  <Link key={ex.href} href={ex.href} className={styles.card}>
                    <span className={`${styles.cardIcon} ${ex.iconClass}`}>{ex.icon}</span>
                    <span className={styles.cardBody}>
                      <strong>{ex.title}</strong>
                      <span>{ex.desc}</span>
                    </span>
                    <span className={styles.cardArrow} aria-hidden>
                      ›
                    </span>
                  </Link>
                ))}
              </div>

              <div className={styles.dash} aria-hidden>
                <aside className={styles.dashSide}>
                  <div className={styles.dashBrand}>
                    <span className={styles.dashBrandMark} />
                    <span className={styles.dashBrandName}>BeWork</span>
                  </div>
                  <ul className={styles.dashNav}>
                    {NAV.map((item, i) => (
                      <li
                        key={item}
                        className={`${styles.dashNavItem}${i === 0 ? ` ${styles.dashNavItemActive}` : ""}`}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </aside>

                <div className={styles.dashMain}>
                  <div className={styles.dashTop}>
                    <div>
                      <p className={styles.dashHello}>Bonjour&nbsp;! 👋</p>
                      <p className={styles.dashHint}>Voici un aperçu de votre projet.</p>
                    </div>
                    <div className={styles.dashAvatars}>
                      <span className={styles.dashBell} />
                      <span className={styles.dashAvatar} />
                    </div>
                  </div>

                  <div className={styles.metrics}>
                    <div className={styles.metric}>
                      <p className={styles.metricValue}>12</p>
                      <p className={styles.metricLabel}>Réservations</p>
                      <span className={styles.metricBadge}>+24&nbsp;%</span>
                    </div>
                    <div className={styles.metric}>
                      <p className={styles.metricValue}>8</p>
                      <p className={styles.metricLabel}>Nouveaux messages</p>
                      <span className={styles.metricBadge}>+12&nbsp;%</span>
                    </div>
                    <div className={styles.metric}>
                      <p className={styles.metricValue}>{visits}</p>
                      <p className={styles.metricLabel}>Visites</p>
                      <span className={styles.metricBadge}>+18&nbsp;%</span>
                    </div>
                  </div>

                  <div
                    ref={chartsRef}
                    className={`${styles.charts}${chartsVisible ? ` ${styles.chartsVisible}` : ""}`}
                  >
                    <div
                      className={`${styles.lineChart}${chartsVisible ? ` ${styles.lineChartVisible}` : ""}`}
                    >
                      <span className={styles.weekBadge}>+24&nbsp;% cette semaine</span>
                      <svg viewBox="0 0 200 80" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="pfLineFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(39,91,232,0.28)" />
                            <stop offset="100%" stopColor="rgba(39,91,232,0)" />
                          </linearGradient>
                        </defs>
                        <path
                          className={styles.lineFill}
                          d="M0 58 C30 52, 50 62, 70 44 S110 28, 130 36 S170 18, 200 22 L200 80 L0 80 Z"
                        />
                        <path d="M0 58 C30 52, 50 62, 70 44 S110 28, 130 36 S170 18, 200 22" />
                      </svg>
                    </div>
                    <div className={styles.barChart}>
                      {BARS.map((h, i) => (
                        <span
                          key={i}
                          className={styles.bar}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className={styles.noteBottom} aria-hidden>
              De l&apos;idée au concret.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
