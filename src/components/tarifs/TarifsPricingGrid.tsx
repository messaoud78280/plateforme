import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import {
  BEWORK_PUBLIC_OFFERS,
  formatOfferPriceLabel,
  type BeWorkPublicOffer,
} from "@/lib/bework-public-offers";

function OfferCta({ offer }: { offer: BeWorkPublicOffer }) {
  const className =
    offer.recommended
      ? "mt-6 block w-full rounded-lg bg-[#1d4ed8] py-3.5 text-center text-base font-semibold text-white shadow-md shadow-[#1d4ed8]/20 transition hover:bg-[#1e40af]"
      : "mt-6 block w-full rounded-lg border-2 border-slate-200 bg-white py-3.5 text-center text-base font-semibold text-[#0f172a] transition hover:border-[#1d4ed8]/40 hover:bg-[#f8fafc]";

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
  return (
    <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-3 xl:items-stretch">
      {BEWORK_PUBLIC_OFFERS.map((offer) => {
        const featured = offer.recommended === true;
        return (
          <article
            id={`offre-${offer.key.toLowerCase().replace(/_/g, "-")}`}
            key={offer.key}
            style={{ scrollMarginTop: "5.5rem" }}
            className={`relative flex flex-col rounded-2xl border-2 bg-white p-7 shadow-sm transition hover:shadow-md ${
              featured
                ? "border-[#1d4ed8] shadow-[0_12px_40px_-16px_rgba(29,78,216,0.35)] ring-2 ring-[#1d4ed8]/20 xl:scale-[1.02]"
                : "border-slate-200/90"
            }`}
          >
            {featured ? (
              <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1d4ed8] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md">
                Offre recommandée
              </span>
            ) : null}

            <h3 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-2xl">{offer.name}</h3>

            <p className="mt-3 text-3xl font-bold leading-tight text-[#1d4ed8] md:text-4xl">
              {formatOfferPriceLabel(offer)}
            </p>

            <p className="mt-4 text-base leading-relaxed text-slate-700">{offer.positioning}</p>

            <p className="mt-4 border-t border-slate-100 pt-4 text-base font-semibold leading-snug text-[#0f172a]">
              {offer.tagline}
            </p>

            {offer.examples && offer.examples.length > 0 ? (
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1d4ed8]">Exemples de missions</p>
                <ul className="mt-2.5 space-y-2 text-base text-slate-700" role="list">
                  {offer.examples.map((ex) => (
                    <li key={ex} className="flex gap-2.5">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className={offer.includes.length > 0 ? "mt-5 flex-1" : "mt-5 flex-1 flex flex-col justify-end"}>
              {offer.includes.length > 0 ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Inclus</p>
                  <ul className="mt-2.5 space-y-2.5 text-base text-slate-800" role="list">
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
