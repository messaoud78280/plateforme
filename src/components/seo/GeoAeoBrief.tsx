import Link from "next/link";
import { BEWORK_AEO_DEFINITION, getGeoAeoBriefItems } from "@/lib/seo";
import { formatPriceLabelFr, getMarketingPriceBoundsLabels } from "@/lib/bework-public-offers";

type Props = {
  className?: string;
};

/**
 * Bloc GEO/AEO : 8 réponses courtes pour moteurs classiques et IA génératives.
 * Style discret (bordure existante) — pas de changement de charte globale.
 */
export function GeoAeoBrief({ className = "" }: Props) {
  const priceFrom = formatPriceLabelFr(getMarketingPriceBoundsLabels().monthlyLow);
  const items = getGeoAeoBriefItems(priceFrom);

  return (
    <section
      className={`not-prose rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 ${className}`.trim()}
      aria-labelledby="geo-aeo-brief-title"
    >
      <h2 id="geo-aeo-brief-title" className="font-heading text-[1.25rem] font-bold leading-snug text-black md:text-xl">
        BeWork en bref
      </h2>
      <p className="mt-3 text-base leading-relaxed text-slate-700">{BEWORK_AEO_DEFINITION}</p>
      <dl className="mt-6 space-y-5">
        {items.map((item) => (
          <div key={item.question}>
            <dt className="text-sm font-bold uppercase tracking-wide text-[#1d4ed8]">{item.question}</dt>
            <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-slate-800">{item.answer}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-sm text-slate-600">
        <Link href="/tarifs" className="font-semibold text-[#1d4ed8] underline underline-offset-2 hover:text-[#1e40af]">
          Voir la tarification
        </Link>
        {" · "}
        <Link href="/contact" className="font-semibold text-[#1d4ed8] underline underline-offset-2 hover:text-[#1e40af]">
          Demander une démonstration
        </Link>
        {" · "}
        <Link href="/faq" className="font-semibold text-[#1d4ed8] underline underline-offset-2 hover:text-[#1e40af]">
          FAQ complète
        </Link>
      </p>
    </section>
  );
}
