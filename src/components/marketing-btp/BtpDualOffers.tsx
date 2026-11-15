import Link from "next/link";
import {
  BTP_CTA_CONDUCTEUR,
  BTP_CTA_EQUIPE_TP_VRD,
} from "@/lib/bework-btp-services";

const CONDUITE_ITEMS = [
  "Conducteur de travaux externalisé",
  "Chef de chantier en régie",
  "Pilotage, coordination et préparation",
  "Suivi technique, administratif et financier",
  "Mission ponctuelle, renfort ou opération complète",
] as const;

const EQUIPES_ITEMS = [
  "Chefs d’équipe TP/VRD",
  "Maçons VRD qualifiés",
  "Voirie, réseaux et aménagements extérieurs",
  "Renfort opérationnel sur chantier",
  "Prestations en régie contractualisées",
] as const;

export function BtpDualOffers() {
  return (
    <section
      id="nos-prestations"
      className="bw-btp-section bw-home-dual"
      aria-labelledby="dual-offers-title"
    >
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Deux offres principales</p>
        <h2 id="dual-offers-title" className="mt-2 max-w-3xl font-bold">
          Nous pilotons les chantiers et fournissons des renforts opérationnels
          TP/VRD.
        </h2>
        <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
          Chaque mission est définie et contractualisée. BeWork n’est pas une
          entreprise de travail temporaire — prestations sur devis.
        </p>

        <div className="bw-home-dual-grid mt-10">
          <article id="offre-conduite" className="bw-home-offer-card">
            <div className="bw-home-offer-icon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
            </div>
            <h3 className="bw-home-offer-title">
              Conduite de travaux externalisée
            </h3>
            <p className="bw-home-offer-lead">
              Compétences opérationnelles pour gérer et suivre vos chantiers.
            </p>
            <ul className="bw-home-offer-list">
              {CONDUITE_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={BTP_CTA_CONDUCTEUR.href}
                className="bw-btp-btn bw-btp-btn-primary self-start"
              >
                {BTP_CTA_CONDUCTEUR.label}
              </Link>
              <Link
                href="/conduite-de-travaux"
                className="bw-btp-btn bw-btp-btn-secondary self-start"
              >
                En savoir plus
              </Link>
            </div>
          </article>

          <article id="offre-equipes" className="bw-home-offer-card">
            <div className="bw-home-offer-icon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 7.2 12 5l3 2.2v2.3H9V7.2Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.5 18.5c.8-2 2.7-3.3 5-3.3h5c2.3 0 4.2 1.3 5 3.3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="bw-home-offer-title">Équipes TP/VRD en régie</h3>
            <p className="bw-home-offer-lead">
              Renforts opérationnels pour vos travaux publics et VRD.
            </p>
            <ul className="bw-home-offer-list">
              {EQUIPES_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={BTP_CTA_EQUIPE_TP_VRD.href}
                className="bw-btp-btn bw-btp-btn-primary self-start"
              >
                {BTP_CTA_EQUIPE_TP_VRD.label}
              </Link>
              <Link
                href="/equipes-tp-vrd"
                className="bw-btp-btn bw-btp-btn-secondary self-start"
              >
                En savoir plus
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
