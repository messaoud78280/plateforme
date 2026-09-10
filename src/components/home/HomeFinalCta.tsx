"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import styles from "./HomeFinalCta.module.css";

/**
 * Fond IMAGE 2 — assets HD pré-exportés (sans recompression next/image).
 * srcSet en descripteurs w pour écrans Retina / haute densité.
 */
const BG = {
  webp1920: "/marketing/cta-final-bg-1920.webp",
  webp2560: "/marketing/cta-final-bg-2560.webp",
  webp3200: "/marketing/cta-final-bg-3200.webp",
  webp3840: "/marketing/cta-final-bg-3840.webp",
  jpg1920: "/marketing/cta-final-bg-1920.jpg",
  jpg2560: "/marketing/cta-final-bg-2560.jpg",
  jpg3200: "/marketing/cta-final-bg-3200.jpg",
  jpg3840: "/marketing/cta-final-bg-3840.jpg",
} as const;

const WEBP_SRCSET = `${BG.webp1920} 1920w, ${BG.webp2560} 2560w, ${BG.webp3200} 3200w, ${BG.webp3840} 3840w`;
const JPG_SRCSET = `${BG.jpg1920} 1920w, ${BG.jpg2560} 2560w, ${BG.jpg3200} 3200w, ${BG.jpg3840} 3840w`;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** CTA final — composition IMAGE 1, fond IMAGE 2 haute résolution. */
export function HomeFinalCta() {
  const rootRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.22 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const reveal = inView ? styles.isIn : "";

  return (
    <section
      ref={rootRef}
      id="cta-final"
      className={styles.scene}
      aria-labelledby="final-cta-heading"
    >
      <div className={styles.bg} aria-hidden>
        {/*
          Picture + srcSet densités : évite next/image q=75 qui floutait les dégradés.
          Assets déjà exportés en WebP/JPEG haute qualité.
        */}
        <picture>
          <source type="image/webp" srcSet={WEBP_SRCSET} sizes="100vw" />
          <img
            src={BG.jpg2560}
            srcSet={JPG_SRCSET}
            sizes="100vw"
            alt=""
            className={styles.bgImg}
            decoding="async"
            fetchPriority="low"
            draggable={false}
          />
        </picture>
        <div className={styles.bgVeil} />
      </div>

      <p className={cx(styles.corner, styles.cornerTL)} aria-hidden>
        Des idées
        <br />
        qui comptent
      </p>
      <p className={cx(styles.corner, styles.cornerBL)} aria-hidden>
        Des personnes
        <br />
        plus libres
      </p>
      <p className={cx(styles.corner, styles.cornerBR)} aria-hidden>
        Plus de
        <br />
        possibles
      </p>
      <p className={styles.rail} aria-hidden>
        Apprendre — Créer — Avancer
      </p>

      <div className={cx(styles.badge, styles.badgeIdee)} aria-hidden>
        <span className={styles.badgeDot} />
        <span className={styles.badgeLine} />
        <span className={styles.badgePill}>Idée</span>
      </div>
      <div className={cx(styles.badge, styles.badgeProjet)} aria-hidden>
        <span className={styles.badgePill}>Projet</span>
        <span className={styles.badgeLine} />
        <span className={styles.badgeDot} />
      </div>

      <div className={styles.inner}>
        <div className={styles.halo} aria-hidden />

        <h2 id="final-cta-heading" className={cx(styles.title, reveal)}>
          <span className={styles.lineInk}>Une idée.</span>
          <span className={styles.lineInk}>Un projet.</span>
          <span className={styles.lineBlue}>Une nouvelle autonomie.</span>
        </h2>

        <p className={cx(styles.lead, reveal)}>
          Vous venez avec une idée. Vous repartez en sachant comment commencer à
          la construire — sans savoir coder.
        </p>

        <div className={cx(styles.actions, reveal)}>
          <Link
            href="/contact#participer"
            className={styles.btnPrimary}
            {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-final-participer")}
          >
            Demander une place
            <span aria-hidden>→</span>
          </Link>
          <Link href="/#demonstrations" className={styles.btnSecondary}>
            Revoir les démonstrations
          </Link>
        </div>
      </div>
    </section>
  );
}
