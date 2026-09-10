import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import { CTA_GROUP, CTA_PRIMARY, CTA_SECONDARY } from "@/components/marketing/marketingCtaStyles";
import { FORMATION_FAQ } from "@/lib/bework-formation";
import {
  breadcrumbJsonLd,
  buildMarketingPageMetadata,
  SEO_PAGES,
} from "@/lib/seo-formation-pages";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const seo = SEO_PAGES.faq;
const faqUrl = absoluteUrl(seo.path);

export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
  keywords: [...seo.keywords],
});

function faqQuestionSlug(question: string): string {
  return (
    "q-" +
    question
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .replace(/-+/g, "-")
      .slice(0, 96)
  );
}

const faqWebPageLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${faqUrl}#webpage`,
      url: faqUrl,
      name: `${seo.title} | BeWork`,
      inLanguage: "fr-FR",
      description: seo.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      mainEntity: { "@id": `${faqUrl}#faq` },
    },
    {
      "@type": "FAQPage",
      "@id": `${faqUrl}#faq`,
      url: faqUrl,
      inLanguage: "fr-FR",
      mainEntity: FORMATION_FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
    breadcrumbJsonLd([
      { name: "Accueil", path: "/" },
      { name: "FAQ", path: "/faq" },
    ]),
  ],
};

export default function FaqPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqWebPageLd) }} />
      <BwAtmosphere variant="reassurance" />
      <MarketingSiteHeader plainBg />

      <main className="relative z-[1] px-6 py-16 md:py-24">
        <article className="mx-auto max-w-4xl">
          <header className="mx-auto max-w-3xl text-center">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0B0D12] md:text-4xl">
              FAQ — Formation BeWork
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-700">
              Réponses claires sur le déroulé, les prérequis et ce que la formation permet réellement d&apos;apprendre —
              sans promesse exagérée.
            </p>

            <nav
              aria-label="Sommaire des questions"
              className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm"
            >
              <p className="text-sm font-semibold text-black">Questions fréquentes :</p>
              <ul className="mt-3 columns-1 gap-x-8 gap-y-2 text-sm text-[#1d4ed8] sm:columns-2">
                {FORMATION_FAQ.map((item) => (
                  <li key={item.q} className="mb-2 break-inside-avoid">
                    <a href={`#${faqQuestionSlug(item.q)}`} className="underline underline-offset-2 hover:text-[#1e40af]">
                      {item.q}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </header>

          <div className="mt-12 space-y-4">
            <dl className="space-y-4">
              {FORMATION_FAQ.map((item) => (
                <div
                  key={item.q}
                  id={faqQuestionSlug(item.q)}
                  className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <dt className="text-base font-semibold text-black md:text-lg">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-slate-700 md:text-base">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "@id": `${faqUrl}#faq`,
                url: faqUrl,
                inLanguage: "fr-FR",
                mainEntity: FORMATION_FAQ.map((item) => ({
                  "@type": "Question",
                  name: item.q,
                  acceptedAnswer: { "@type": "Answer", text: item.a },
                })),
              }),
            }}
          />

          <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-black">Une question reste en suspens&nbsp;?</h2>
            <p className="mt-3 text-slate-700">
              Indiquez-nous votre activité et ce que vous aimeriez créer — nous vous recontactons.
            </p>
            <div className={`mt-6 ${CTA_GROUP}`}>
              <Link href="/contact#participer" className={CTA_PRIMARY}>
                Participer
              </Link>
              <Link href="/formation" className={CTA_SECONDARY}>
                Voir la formation
              </Link>
              <Link href="/tarifs" className={CTA_SECONDARY}>
                Tarif de la session
              </Link>
            </div>
          </div>
        </article>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
