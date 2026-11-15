import Link from "next/link";
import { BTP_CTA_EQUIPE_TP_VRD } from "@/lib/bework-btp-services";

const CONDUITE_ITEMS = [
  "Organisation et planification",
  "Suivi d’exécution et coordination",
  "Gestion des intervenants",
  "Reporting et avancement",
  "Suivi administratif et financier",
] as const;

const EQUIPES_ITEMS = [
  "Chefs d’équipe expérimentés",
  "Maçons VRD qualifiés",
  "Renfort opérationnel sur chantier",
  "Travaux de terrassement, voirie et réseaux",
  "Prestations adaptées aux besoins du chantier",
] as const;

export function BtpDualOffers() {
  return (
    <section
      id="nos-prestations"
      className="bw-btp-section bw-home-dual"
      aria-labelledby="dual-offers-title"
    >
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Nos deux prestations principales</p>
        <h2 id="dual-offers-title" className="mt-2 max-w-3xl font-bold">
          Deux réponses concrètes pour vos chantiers.
        </h2>
        <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
          Pilotage d’un côté, exécution terrain de l’autre. Chaque mission est
          définie et contractualisée — prestations sur devis.
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
            <h3 className="bw-home-offer-title">Conduite de travaux</h3>
            <p className="bw-home-offer-lead">
              Pilotage et gestion de vos chantiers.
            </p>
            <ul className="bw-home-offer-list">
              {CONDUITE_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link
              href="/conduite-de-travaux"
              className="bw-btp-btn bw-btp-btn-primary mt-7 self-start"
            >
              Découvrir la conduite de travaux
            </Link>
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
            <h3 className="bw-home-offer-title">Équipes travaux</h3>
            <p className="bw-home-offer-lead">
              Des professionnels opérationnels pour vos chantiers TP / VRD.
            </p>
            <ul className="bw-home-offer-list">
              {EQUIPES_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link
              href={BTP_CTA_EQUIPE_TP_VRD.href}
              className="bw-btp-btn bw-btp-btn-primary mt-7 self-start"
            >
              Demander une équipe travaux
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
