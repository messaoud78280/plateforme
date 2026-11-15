import Image from "next/image";
import Link from "next/link";
import {
  BEWORK_BTP_HERO_SUBTITLE,
  BEWORK_BTP_SLOGAN,
  BTP_CTA_CONDUCTEUR,
  BTP_CTA_EQUIPE_TP_VRD,
} from "@/lib/bework-btp-services";

export function BtpHomeHero() {
  return (
    <section className="bw-btp-hero bw-home-hero" aria-labelledby="home-hero-title">
      <div className="bw-btp-container-wide bw-home-hero-grid">
        <div className="bw-home-hero-copy">
          <p className="bw-btp-eyebrow">
            BEWORK — CONDUITE DE TRAVAUX &amp; ÉQUIPES TP/VRD EN RÉGIE
          </p>
          <h1 id="home-hero-title" className="bw-home-hero-title">
            {BEWORK_BTP_SLOGAN.replace(/^BeWork —\s*/, "")}
          </h1>
          <p className="bw-btp-lead mt-5">{BEWORK_BTP_HERO_SUBTITLE}</p>

          <div className="bw-home-hero-chips">
            <a href="#offre-conduite" className="bw-home-chip">
              <span className="bw-home-chip-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8 7h8M8 11h8M8 15h5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <rect
                    x="4"
                    y="3"
                    width="16"
                    height="18"
                    rx="2.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </span>
              <span>Conduite de travaux externalisée</span>
              <span className="bw-home-chip-arrow" aria-hidden>
                →
              </span>
            </a>
            <a href="#offre-equipes" className="bw-home-chip">
              <span className="bw-home-chip-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8 14c0-2.2 1.8-4 4-4s4 1.8 4 4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4.5 18.5c.8-2 2.7-3.3 5-3.3h5c2.3 0 4.2 1.3 5 3.3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 7.2 12 5l3 2.2v2.3H9V7.2Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>Équipes TP/VRD en régie</span>
              <span className="bw-home-chip-arrow" aria-hidden>
                →
              </span>
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={BTP_CTA_CONDUCTEUR.href}
              className="bw-btp-btn bw-btp-btn-primary"
            >
              {BTP_CTA_CONDUCTEUR.label}
              <span aria-hidden>→</span>
            </Link>
            <Link
              href={BTP_CTA_EQUIPE_TP_VRD.href}
              className="bw-btp-btn bw-btp-btn-secondary"
            >
              {BTP_CTA_EQUIPE_TP_VRD.label}
            </Link>
          </div>

          <p className="bw-home-hero-tags">
            Yvelines · Île-de-France · Conducteur externalisé · Chef de chantier
            en régie · Renfort TP/VRD · Maçon VRD
          </p>
        </div>

        <div className="bw-home-hero-visual">
          <div className="bw-home-hero-photo">
            <Image
              src="/marketing/btp-hero-chantier.jpg"
              alt="Conducteur de travaux étudiant un plan sur un chantier BTP — photo d’ambiance illustrative"
              fill
              priority
              className="bw-home-hero-img"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 48vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
