import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import {
  formatOfferPriceLabel,
  getBeworkTarifsGridOffers,
  type BeWorkPublicOffer,
} from "@/lib/bework-public-offers";

function OfferCta({ offer }: { offer: BeWorkPublicOffer }) {
  const className =
    offer.recommended
      ? "block w-full rounded-lg bg-[#1d4ed8] py-2.5 text-center text-xs font-semibold text-white shadow-md shadow-[#1d4ed8]/20 transition hover:bg-[#1e40af] lg:text-sm lg:py-3"
      : "block w-full rounded-lg border-2 border-slate-200 bg-white py-2.5 text-center text-xs font-semibold text-[#0f172a] transition hover:border-[#1d4ed8]/40 hover:bg-[#f8fafc] lg:text-sm lg:py-3";

  if (offer.cta.calendly) {
    return (
      <CalendlyBookingLink trackLocation={`tarifs-${offer.key}`} className={className}>
        {offer.cta.label}
      </CalendlyBookingLink>
    );
  }

  return (
    <Link href={offer.cta.href} className={className}>
      {offer.cta.label}
    </Link>
  );
}

export function TarifsPricingGrid() {
  const offers = getBeworkTarifsGridOffers();

  return (
    <div className="mx-auto grid w-full grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:items-stretch lg:gap-4 xl:gap-5">
      {offers.map((offer) => {
        const featured = offer.recommended === true;
        return (
          <article
            id={`offre-${offer.key.toLowerCase().replace(/_/g, "-")}`}
            key={offer.key}
            style={{ scrollMarginTop: "5.5rem" }}
            className={`relative flex h-full min-h-0 flex-col rounded-2xl border-2 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5 lg:p-4 xl:p-5 ${
              featured
                ? "border-[#1d4ed8] shadow-[0_12px_36px_-14px_rgba(29,78,216,0.35)] ring-2 ring-[#1d4ed8]/20"
                : "border-slate-200/90"
            }`}
          >
            {featured ? (
              <span className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1d4ed8] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md lg:text-[11px]">
                Offre recommandée
              </span>
            ) : null}

            <h3 className="text-sm font-bold leading-snug tracking-tight text-[#0f172a] lg:text-[0.9375rem] xl:text-base">
              {offer.name}
            </h3>

            <p className="mt-2 text-lg font-bold leading-snug text-[#1d4ed8] lg:text-[1.125rem] xl:text-xl">
              {formatOfferPriceLabel(offer)}
            </p>

            <p className="mt-2.5 text-xs leading-relaxed text-slate-700 lg:text-[0.8125rem] xl:text-sm">
              {offer.positioning}
            </p>

            <p className="mt-2.5 border-t border-slate-100 pt-2.5 text-xs font-semibold leading-snug text-[#0f172a] lg:text-[0.8125rem] xl:text-sm">
              {offer.tagline}
            </p>

            <div className="mt-3 flex flex-1 flex-col">
              {offer.includes.length > 0 ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 lg:text-[11px]">
                    Inclus
                  </p>
                  <ul className="mt-1.5 space-y-1.5 text-xs leading-snug text-slate-800 lg:text-[0.8125rem] xl:text-sm" role="list">
                    {offer.includes.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span
                          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[9px] font-bold text-[#1d4ed8] lg:h-[1.125rem] lg:w-[1.125rem] lg:text-[10px]"
                          aria-hidden
                        >
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>

            <div className="mt-auto pt-4">
              <OfferCta offer={offer} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
