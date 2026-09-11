"use client";

import { useState } from "react";
import styles from "./FormationHero.module.css";

const CHIPS = [
  { label: "Réservation", color: "#f43f5e" },
  { label: "Clients", color: "#ec4899" },
  { label: "Calendrier", color: "#275be8" },
  { label: "Notifications", color: "#7c3aed" },
] as const;

const SLOTS = ["09:00", "10:30", "14:00", "15:30", "17:00"] as const;

const DAYS = ["L", "M", "M", "J", "V", "S", "D"] as const;

/** Calendrier fictif novembre 2024 — grille visuelle uniquement. */
const CAL_DAYS: Array<{ d: number | null; active?: boolean }> = [
  { d: null },
  { d: null },
  { d: null },
  { d: null },
  { d: 1 },
  { d: 2 },
  { d: 3 },
  { d: 4 },
  { d: 5 },
  { d: 6 },
  { d: 7 },
  { d: 8 },
  { d: 9 },
  { d: 10 },
  { d: 11, active: true },
  { d: 12 },
  { d: 13 },
  { d: 14 },
  { d: 15 },
  { d: 16 },
  { d: 17 },
  { d: 18 },
  { d: 19 },
  { d: 20 },
  { d: 21 },
  { d: 22 },
  { d: 23 },
  { d: 24 },
];

const FLOAT_CARDS = [
  {
    label: "SITE WEB",
    text: "Présentez votre activité en quelques minutes.",
  },
  {
    label: "APPLICATION",
    text: "Créez vos propres outils métiers.",
  },
  {
    label: "OUTIL MÉTIER",
    text: "Gagnez en autonomie au quotidien.",
  },
] as const;

type Props = {
  ready: boolean;
  ambient: boolean;
  reduceMotion: boolean;
};

/** Scène droite — idée → chips → mini-app → résultat (données fictives). */
export function FormationHeroScene({ ready, ambient, reduceMotion }: Props) {
  const [slot, setSlot] = useState<(typeof SLOTS)[number]>("10:30");

  const rootClass = [
    styles.scene,
    ready || reduceMotion ? styles.ready : "",
    ambient && !reduceMotion ? styles.ambient : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} aria-hidden>
      <span className={`${styles.halo} ${styles.haloA}`} />
      <span className={`${styles.halo} ${styles.haloB}`} />
      <span className={`${styles.halo} ${styles.haloC}`} />

      <p className={styles.note}>
        Vous décrivez.
        <br />
        L’IA vous accompagne.
        <br />
        Le projet prend forme.
      </p>
      <svg className={styles.noteArrow} viewBox="0 0 56 40" fill="none" aria-hidden>
        <path
          d="M8 4C18 10 28 18 34 28"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M28 26l6 3-1.5-6.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className={styles.idea}>
        <div className={styles.ideaTop}>
          <span className={styles.ideaIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 3.5 10.8c-.7.55-1.1 1.2-1.25 2.2h-4.5c-.15-1-.55-1.65-1.25-2.2A6 6 0 0 1 12 3z" />
            </svg>
          </span>
          <p className={styles.ideaText}>
            J’aimerais créer un système pour permettre à mes clients de réserver un
            rendez-vous.
          </p>
        </div>
      </div>

      <ul className={styles.chips}>
        {CHIPS.map((chip) => (
          <li key={chip.label} className={styles.chip}>
            <span className={styles.chipDot} style={{ background: chip.color }} />
            {chip.label}
          </li>
        ))}
      </ul>

      <div className={styles.app}>
        <div className={styles.badge}>
          <span className={styles.badgeMark}>✓</span>
          <span>
            Première version
            <br />
            prête à tester&nbsp;!
          </span>
        </div>

        <div className={styles.appHead}>
          <div className={styles.brand}>
            <span className={styles.brandMark} />
            Mon Activité
          </div>
          <ul className={styles.nav}>
            <li className={styles.navItem}>Accueil</li>
            <li className={styles.navItem}>Services</li>
            <li className={`${styles.navItem} ${styles.navItemActive}`}>Réserver</li>
            <li className={styles.navItem}>À propos</li>
          </ul>
          <div className={styles.user}>
            <span className={styles.avatar} />
            Marie Dupont
          </div>
        </div>

        <div className={styles.appBody}>
          <div>
            <p className={styles.panelTitle}>Choisissez un créneau</p>
            <div className={styles.calendar}>
              <div className={styles.calHead}>
                <span>Novembre 2024</span>
                <span aria-hidden>‹ ›</span>
              </div>
              <div className={styles.calGrid}>
                {DAYS.map((d, i) => (
                  <span key={`${d}-${i}`} className={styles.calDow}>
                    {d}
                  </span>
                ))}
                {CAL_DAYS.map((cell, i) => (
                  <span
                    key={i}
                    className={[
                      styles.calDay,
                      cell.d == null ? styles.calDayMuted : "",
                      cell.active ? styles.calDayActive : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {cell.d ?? ""}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <ul className={styles.slots}>
            {SLOTS.map((s) => {
              const active = s === slot;
              return (
                <li key={s}>
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`${styles.slot}${active ? ` ${styles.slotActive}` : ""}`}
                    onClick={() => setSlot(s)}
                  >
                    {s}
                    {active ? <span className={styles.slotCheck}>✓</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className={styles.booking}>
            <p className={styles.bookingHead}>Rendez-vous</p>
            <div className={styles.client}>
              <span className={styles.clientAvatar} />
              <div>
                <p className={styles.clientName}>Marie Dupont</p>
                <p className={styles.clientRole}>Cliente</p>
              </div>
            </div>
            <p className={styles.meta}>
              <span>
                <strong>Email</strong> · marie.dupont@exemple.fr
              </span>
              <span>
                <strong>Tél.</strong> · 06 12 34 56 78
              </span>
              <span>
                <strong>Objet</strong> · Rendez-vous découverte
              </span>
            </p>
            <button type="button" tabIndex={-1} className={styles.confirm}>
              Confirmer la réservation
            </button>
          </div>
        </div>
      </div>

      <ul className={styles.floatCards}>
        {FLOAT_CARDS.map((card) => (
          <li key={card.label} className={styles.floatCard}>
            <span className={styles.floatLabel}>{card.label}</span>
            <p className={styles.floatText}>{card.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
