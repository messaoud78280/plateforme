"use client";

import Image from "next/image";
import Link from "next/link";
import { BEWORK_SESSION_PRICE_EUR } from "@/lib/bework-formation";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import styles from "./HomePricingSession.module.css";

/** Assets fournis — PHOTO gauche + AFFICHE droite */
const IMG_ATELIER = "/marketing/journee-atelier-portrait.jpg";
const IMG_POSTER = "/marketing/explorer-apprendre-construire.jpg";

const INCLUDES = [
  { label: "Journée complète", tone: "", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { label: "Petit groupe", tone: styles.iViolet, d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Démonstrations", tone: styles.iSky, d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Préparation de l’environnement", tone: styles.iViolet, d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Pratique guidée", tone: "", d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { label: "Accompagnement", tone: styles.iMint, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { label: "Réflexion autour de votre projet", tone: styles.iPeach, d: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { label: "Méthode réutilisable", tone: styles.iViolet, d: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
] as const;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Section tarif — composition bento fidèle à la référence (desktop). */
export function HomePricingSession() {
  return (
    <section id="tarif" className={styles.scene} aria-labelledby="tarif-heading">
      <div className={cx(styles.halo, styles.haloA)} aria-hidden />
      <div className={cx(styles.halo, styles.haloB)} aria-hidden />
      <div className={cx(styles.halo, styles.haloC)} aria-hidden />

      <div className={styles.shell}>
        <p className={styles.outerNote} aria-hidden>
          Plus qu’une formation,
          <br />
          une nouvelle façon
          <br />
          de créer demain.
          <span className={styles.noteUnderline} />
        </p>

        <div className={styles.panel}>
          <div className={styles.bento}>
            {/* ZONE GAUCHE — grande photo */}
            <div className={styles.photoCol}>
              <div className={styles.photoFrame}>
                <Image
                  src={IMG_ATELIER}
                  alt="Atelier BeWork : journée pratique en petit groupe"
                  fill
                  className={styles.photoImg}
                  sizes="(max-width:1099px) 90vw, 420px"
                  priority={false}
                />
                <p className={styles.photoCaption} aria-hidden>
                  Apprendre ensemble,
                  <br />
                  pour aller plus loin.
                </p>
              </div>
            </div>

            {/* ZONE CENTRALE — éditorial */}
            <div className={styles.center}>
              <p className={styles.eyebrow}>La journée BeWork</p>
              <h2 id="tarif-heading" className={styles.title}>
                <span className={styles.titleLine}>Une journée pour apprendre</span>
                <span className={cx(styles.titleLine, styles.titleAccent)}>à créer autrement.</span>
              </h2>

              <div className={styles.priceBlock}>
                <p className={styles.price}>{BEWORK_SESSION_PRICE_EUR}&nbsp;€</p>
                <span className={styles.brush} aria-hidden />
                <p className={styles.priceLabel}>Par participant</p>
              </div>

              <p className={styles.lead}>
                Des outils concrets, de la pratique et un accompagnement pour passer de vos idées à
                vos premiers projets.
              </p>

              <p className={styles.includesHead}>Ce qui est compris</p>
              <ul className={styles.includes}>
                {INCLUDES.map((item) => (
                  <li key={item.label} className={styles.include}>
                    <span className={cx(styles.includeIcon, item.tone)} aria-hidden>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.d} />
                      </svg>
                    </span>
                    <p className={styles.includeLabel}>{item.label}</p>
                  </li>
                ))}
              </ul>

              <p className={styles.closing}>
                Vous venez avec vos idées.
                <span className={styles.closingStrong}>
                  Vous repartez en sachant comment commencer à les construire.
                </span>
              </p>

              <Link
                href="/contact#participer"
                className={styles.cta}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-tarif-participer")}
              >
                Demander une place
                <span aria-hidden>→</span>
              </Link>
            </div>

            {/* ZONE DROITE — affiche flottante */}
            <div className={styles.posterCol}>
              <div className={styles.posterFrame}>
                <Image
                  src={IMG_POSTER}
                  alt="Explorer, apprendre, construire"
                  fill
                  className={styles.posterImg}
                  sizes="(max-width:1099px) 56vw, 220px"
                />
              </div>
            </div>
          </div>

          <footer className={styles.panelFooter}>
            <div className={styles.brand}>
              <span className={styles.brandName}>BeWork</span>
              <span className={styles.brandTag}>Apprendre aujourd’hui. Construire demain.</span>
            </div>
            <p className={styles.steps} aria-hidden>
              Idées <span>→</span> Compétences <span>→</span> Projets
            </p>
          </footer>
        </div>
      </div>
    </section>
  );
}
