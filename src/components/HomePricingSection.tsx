import Link from "next/link";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import {
  BEWORK_PUBLIC_OFFERS,
  formatOfferPriceLabel,
} from "@/lib/bework-public-offers";

/** Aperçu tarifaire accueil — 3 offres clés, sans crédits ni calcul horaire. */
const HOME_PREVIEW_KEYS = ["INTERVENTION_PONCTUELLE", "RELAIS_PRO", "CELLULE_TRAVAUX"] as const;

export function HomePricingSection() {
  const previewOffers = HOME_PREVIEW_KEYS.map(
    (key) => BEWORK_PUBLIC_OFFERS.find((o) => o.key === key)!
  );

  return (
    <section
      id="tarifs"
      className="relative scroll-mt-24 bg-transparent pb-14 pt-10 md:scroll-mt-28 md:pb-16 md:pt-12"
      style={{ scrollMarginTop: "6rem" }}
      aria-labelledby="home-pricing-heading"
    >
      <div className="container-site relative z-[1]">
        <header className="mx-auto mb-7 max-w-2xl text-center md:mb-8">
          <p className="font-heading text-[12px] font-semibold uppercase tracking-[0.2em] text-[#1d4ed8] md:text-[13px]">
            Tarifs
          </p>
          <h2
            id="home-pricing-heading"
            className="mt-2 text-balance text-[1.625rem] font-bold leading-tight tracking-tight text-[#0f172a] md:text-[2rem]"
          >
            Un niveau d&apos;accompagnement, <span className="text-[#1d4ed8]">pas des crédits.</span>
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-[14px] leading-relaxed text-slate-600 md:text-[15px]">
            Missions ponctuelles, relais travaux mensuel ou cellule externalisée — prix de départ HT, ajustés au devis selon
            votre périmètre. Accessible pour tester, sérieux pour travailler.
          </p>
        </header>

        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3 md:items-stretch md:gap-6">
          {previewOffers.map((offer) => {
            const featured = offer.recommended === true;
            const cardFeatured =
              "relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-[#2563eb] bg-gradient-to-b from-white via-[#f8fbff] to-[#f0f7ff] p-5 shadow-[0_10px_40px_-14px_rgba(37,99,235,0.35)] ring-1 ring-blue-200/40";
            const cardDefault =
              "relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_2px_20px_-8px_rgba(15,23,42,0.1)]";

            return (
              <article key={offer.key} className={featured ? cardFeatured : cardDefault}>
                {featured ? (
                  <span className="mb-3 inline-flex self-center rounded-full bg-[#1d4ed8] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                    Offre recommandée
                  </span>
                ) : (
                  <div className="mb-3 min-h-[1.375rem]" aria-hidden />
                )}

                <h3 className="text-base font-bold text-[#0f172a] md:text-[1.05rem]">{offer.name}</h3>
                <p className="mt-2 text-[1.35rem] font-bold leading-tight text-[#1d4ed8] md:text-[1.5rem]">
                  {formatOfferPriceLabel(offer)}
                </p>
                <p className="mt-3 flex-1 text-left text-[12px] leading-snug text-slate-600 md:text-[13px]">
                  {offer.tagline}
                </p>

                <ul className="mt-3 space-y-1 border-t border-dashed border-slate-200/90 pt-3 text-left text-[11px] text-slate-600 md:text-[12px]">
                  {offer.includes.slice(0, 4).map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="mt-[0.35em] h-1 w-1 shrink-0 rounded-full bg-[#2563eb]" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-7 max-w-3xl text-center text-[12px] font-medium leading-relaxed text-slate-600 md:mt-8 md:text-[13px]">
          Relais bureau-chantier <span className="text-slate-300">&nbsp;·&nbsp;</span> Méthode &amp; traçabilité{" "}
          <span className="text-slate-300">&nbsp;·&nbsp;</span> Validation chez vous
        </p>

        <p className="mx-auto mt-4 max-w-2xl text-center text-[12px] leading-relaxed text-slate-600 md:text-[13px]">
          Relais Travaux Essentiel et offre sur mesure :{" "}
          <Link
            href="/tarifs"
            className="font-semibold text-[#1d4ed8] hover:text-[#1e40af]"
            {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_TARIFS, "home-pricing")}
          >
            voir toutes les offres
          </Link>
          .
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            href="/tarifs"
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#1d4ed8] px-6 text-[14px] font-semibold text-white shadow-md transition hover:bg-[#1e40af]"
            {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_TARIFS, "home-pricing-cta")}
          >
            Voir les tarifs BeWork
          </Link>
        </div>
      </div>
    </section>
  );
}
