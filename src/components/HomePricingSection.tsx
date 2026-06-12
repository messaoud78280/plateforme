import Link from "next/link";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import {
  BEWORK_PUBLIC_OFFERS,
  formatOfferPriceLabel,
} from "@/lib/bework-public-offers";

/** Aperçu tarifaire accueil — 3 offres clés, sans crédits ni calcul horaire. */
const HOME_PREVIEW_KEYS = ["RELAIS_ESSENTIEL", "RELAIS_PRO", "CELLULE_TRAVAUX"] as const;

export function HomePricingSection() {
  const previewOffers = HOME_PREVIEW_KEYS.map(
    (key) => BEWORK_PUBLIC_OFFERS.find((o) => o.key === key)!,
  );

  return (
    <section
      id="tarifs"
      className="relative scroll-mt-24 bg-transparent pb-14 pt-10 md:scroll-mt-28 md:pb-16 md:pt-12"
      style={{ scrollMarginTop: "6rem" }}
      aria-labelledby="home-pricing-heading"
    >
      <div className="container-site relative z-[1]">
        <header className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
          <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-[#1d4ed8] md:text-sm">
            Tarifs
          </p>
          <h2
            id="home-pricing-heading"
            className="mt-2 text-balance text-[1.75rem] font-bold leading-tight tracking-tight text-[#0f172a] md:text-[2.125rem]"
          >
            Un niveau d&apos;accompagnement, <span className="text-[#1d4ed8]">pas des crédits.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-700 md:text-[1.05rem]">
            Relais travaux mensuel, cellule externalisée ou sur mesure — prix de départ HT, ajustés au devis selon votre
            périmètre. Sérieux pour travailler, premium pour durer.
          </p>
        </header>

        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3 md:items-stretch md:gap-6">
          {previewOffers.map((offer) => {
            const featured = offer.recommended === true;
            const cardFeatured =
              "relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-[#1d4ed8] bg-gradient-to-b from-white via-[#f8fbff] to-[#eef4ff] p-6 shadow-[0_12px_44px_-14px_rgba(29,78,216,0.38)] ring-2 ring-[#1d4ed8]/15";
            const cardDefault =
              "relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-slate-300/90 bg-white p-6 shadow-[0_4px_24px_-10px_rgba(15,23,42,0.14)]";

            return (
              <article key={offer.key} className={featured ? cardFeatured : cardDefault}>
                {featured ? (
                  <span className="mb-3 inline-flex self-center rounded-full bg-[#1d4ed8] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white shadow-sm md:text-xs">
                    Offre recommandée
                  </span>
                ) : (
                  <div className="mb-3 min-h-[1.5rem]" aria-hidden />
                )}

                <h3 className="text-lg font-bold leading-snug text-[#0f172a] md:text-xl">{offer.name}</h3>
                <p className="mt-2.5 text-xl font-bold leading-snug text-[#1d4ed8] md:text-2xl">
                  {formatOfferPriceLabel(offer)}
                </p>
                <p className="mt-3 flex-1 text-left text-sm font-medium leading-snug text-slate-800 md:text-[0.9375rem] md:leading-relaxed">
                  {offer.tagline}
                </p>

                <ul className="mt-4 space-y-2 border-t border-slate-300/80 pt-4 text-left text-sm leading-snug text-slate-800 md:text-[0.9375rem]">
                  {offer.includes.slice(0, 4).map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <span
                        className="mt-[0.4em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]"
                        aria-hidden
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-sm font-semibold leading-relaxed text-slate-700 md:text-base">
          Relais bureau-chantier <span className="text-slate-400">&nbsp;·&nbsp;</span> Méthode &amp; traçabilité{" "}
          <span className="text-slate-400">&nbsp;·&nbsp;</span> Validation chez vous
        </p>

        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-slate-700 md:text-base">
          Relais Travaux Essentiel et offre sur mesure :{" "}
          <Link
            href="/tarifs"
            className="font-semibold text-[#1d4ed8] underline-offset-2 hover:text-[#1e40af] hover:underline"
            {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_TARIFS, "home-pricing")}
          >
            voir toutes les offres
          </Link>
          .
        </p>

        <div className="mt-7 flex justify-center">
          <Link
            href="/tarifs"
            className="inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-base font-semibold text-white shadow-md transition hover:bg-[#1e40af]"
            {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_TARIFS, "home-pricing-cta")}
          >
            Voir les tarifs BeWork
          </Link>
        </div>
      </div>
    </section>
  );
}
