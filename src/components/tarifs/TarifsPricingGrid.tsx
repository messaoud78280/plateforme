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
      ? "mt-8 block w-full rounded-xl bg-[#1d4ed8] py-4 text-center text-base font-semibold text-white shadow-md shadow-[#1d4ed8]/20 transition hover:bg-[#1e40af] md:text-lg"
      : "mt-8 block w-full rounded-xl border-2 border-slate-200 bg-white py-4 text-center text-base font-semibold text-[#0f172a] transition hover:border-[#1d4ed8]/40 hover:bg-[#f8fafc] md:text-lg";

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
    <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:items-stretch">
      {offers.map((offer) => {
        const featured = offer.recommended === true;
        return (
          <article
            id={`offre-${offer.key.toLowerCase().replace(/_/g, "-")}`}
            key={offer.key}
            style={{ scrollMarginTop: "5.5rem" }}
            className={`relative flex min-h-[28rem] flex-col rounded-2xl border-2 bg-white p-8 shadow-sm transition hover:shadow-md md:min-h-[30rem] md:p-9 lg:p-10 ${
              featured
                ? "border-[#1d4ed8] shadow-[0_16px_48px_-16px_rgba(29,78,216,0.35)] ring-2 ring-[#1d4ed8]/20 md:scale-[1.02]"
                : "border-slate-200/90"
            }`}
          >
            {featured ? (
              <span className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1d4ed8] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md md:text-sm">
                Offre recommandée
              </span>
            ) : null}

            <h3 className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-[1.65rem]">{offer.name}</h3>

            <p className="mt-4 text-[1.65rem] font-bold leading-snug text-[#1d4ed8] md:text-[1.85rem] lg:text-[2rem]">
              {formatOfferPriceLabel(offer)}
            </p>

            <p className="mt-5 text-base leading-relaxed text-slate-700 md:text-[1.05rem]">{offer.positioning}</p>

            <p className="mt-5 border-t border-slate-100 pt-5 text-base font-semibold leading-snug text-[#0f172a] md:text-[1.05rem]">
              {offer.tagline}
            </p>

            <div className="mt-6 flex-1">
              {offer.includes.length > 0 ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 md:text-sm">Inclus</p>
                  <ul className="mt-3 space-y-3 text-base text-slate-800 md:text-[1.05rem]" role="list">
                    {offer.includes.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-xs font-bold text-[#1d4ed8]"
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

            <OfferCta offer={offer} />
          </article>
        );
      })}
    </div>
  );
}
