import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { TrainingOffersSection } from "@/components/marketing/TrainingOffersSection";
import { QualiopiInlineNote } from "@/components/qualiopi/QualiopiInlineNote";
import { BEWORK_EXTENSION_PRICE_EUR } from "@/lib/bework-formation";
import {
  breadcrumbJsonLd,
  buildMarketingPageMetadata,
  SEO_PAGES,
} from "@/lib/seo-formation-pages";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const seo = SEO_PAGES.tarifs;
const pageUrl = absoluteUrl(seo.path);

export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

const FAQ_TARIFS = [
  {
    q: "Y a-t-il un abonnement après la formation ?",
    a: "Non pour cette offre : le tarif indiqué concerne la session de formation. Les outils éventuellement utilisés pendant la formation relèvent de votre propre environnement.",
  },
  {
    q: "Puis-je commencer par 7 h et prolonger ensuite ?",
    a: `Oui. Commencez par la première journée. Si vous souhaitez continuer, ajoutez le deuxième jour pour ${BEWORK_EXTENSION_PRICE_EUR} € supplémentaires.`,
  },
  {
    q: "Le prix inclut-il le matériel ?",
    a: "Non. Vous venez avec votre ordinateur. La formation couvre l’accompagnement, les démonstrations et la méthode.",
  },
] as const;

const tarifsJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: `${seo.title} | BeWork`,
      description: seo.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
    {
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: FAQ_TARIFS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
    breadcrumbJsonLd([
      { name: "Accueil", path: "/" },
      { name: "Tarifs", path: "/tarifs" },
    ]),
  ],
};

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tarifsJsonLd) }}
      />
      <MarketingSiteHeader plainBg />

      <main className="pb-16 pt-6 sm:pt-8">
        <TrainingOffersSection id="tarif" analyticsPrefix="tarifs" headingLevel="h1" />

        <div className="mx-auto mt-2 max-w-3xl px-4">
          <QualiopiInlineNote />
        </div>

        <section className="mx-auto mt-6 max-w-3xl px-4" aria-labelledby="faq-tarifs">
          <h2 id="faq-tarifs" className="text-2xl font-bold text-[#0f172a]">
            Questions sur le tarif
          </h2>
          <ul className="mt-6 space-y-4">
            {FAQ_TARIFS.map(({ q, a }) => (
              <li key={q} className="rounded-xl border border-slate-200/90 bg-white shadow-sm">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-base font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-inset [&::-webkit-details-marker]:hidden">
                    <span>{q}</span>
                    <span className="shrink-0 pl-2 text-slate-400 group-open:rotate-180">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="border-t border-slate-100 px-5 py-4 text-base leading-relaxed text-slate-700">{a}</div>
                </details>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center">
            <Link href="/formation" className="font-semibold text-[#1d4ed8] hover:underline">
              Voir le détail de la formation →
            </Link>
          </p>
        </section>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
