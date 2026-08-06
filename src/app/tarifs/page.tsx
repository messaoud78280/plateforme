import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { StickyCtaMobile } from "@/components/tarifs/StickyCtaMobile";
import {
  BEWORK_CLIENT_KEEPS,
  BEWORK_PRICING_CRITERIA,
  BEWORK_TARIFS_FAQ,
  BEWORK_TARIFS_PROCESS_STEPS,
} from "@/lib/bework-public-offers";
import { CTA_GROUP, CTA_PRIMARY, CTA_SECONDARY } from "@/components/marketing/marketingCtaStyles";
import {
  SEO_OG_ALTERNATE_LOCALES,
  SEO_OG_LOCALE_PRIMARY,
  hreflangFrancophonieLanguages,
} from "@/lib/seo-francophonie";
import {
  TARIFS_H1,
  TARIFS_PAGE_PATH,
  TARIFS_SEO_DESCRIPTION,
  TARIFS_SEO_KEYWORDS,
  TARIFS_SEO_TITLE,
  buildTarifsPageJsonLd,
} from "@/lib/seo-tarifs";
import { absoluteUrl } from "@/lib/site";

const tarifsUrl = absoluteUrl(TARIFS_PAGE_PATH);
const tarifsOgImage = absoluteUrl("/opengraph-image");

export const metadata: Metadata = {
  title: { absolute: TARIFS_SEO_TITLE },
  description: TARIFS_SEO_DESCRIPTION,
  keywords: [...TARIFS_SEO_KEYWORDS],
  alternates: { canonical: tarifsUrl, languages: hreflangFrancophonieLanguages(TARIFS_PAGE_PATH) },
  openGraph: {
    type: "website",
    locale: SEO_OG_LOCALE_PRIMARY,
    alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
    url: tarifsUrl,
    siteName: "BeWork",
    title: TARIFS_SEO_TITLE,
    description: TARIFS_SEO_DESCRIPTION,
    images: [
      {
        url: tarifsOgImage,
        width: 1200,
        height: 630,
        alt: "Tarification BeWork — plateforme interne BTP sur étude personnalisée",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TARIFS_SEO_TITLE,
    description: TARIFS_SEO_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const INTERNAL_LINKS = [
  { href: "/#plateforme", label: "Découvrir la plateforme" },
  { href: "/#outils-ia", label: "Outils IA métier" },
  { href: "/#marches", label: "Marchés publics et privés" },
  { href: "/#partenaire", label: "Partenaire technologique" },
  { href: "/ressources", label: "Centre de ressources BTP" },
  { href: "/notre-facon-de-travailler", label: "Notre façon de travailler" },
] as const;

const tarifsStructuredData = buildTarifsPageJsonLd();

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 md:pb-16">
      <MarketingSiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tarifsStructuredData) }}
      />

      <main className="mx-auto max-w-site px-4 py-10 sm:py-12 md:py-16">
        <section className="text-center">
          <h1 className="font-heading text-metallic-black text-[1.75rem] font-bold tracking-tight sm:text-4xl md:text-5xl md:leading-tight">
            {TARIFS_H1}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-slate-700 sm:mt-5 sm:text-xl md:text-[1.35rem] md:leading-relaxed">
            Le tarif dépend du nombre d&apos;utilisateurs, des modules activés, du niveau de personnalisation, des outils
            IA et de l&apos;accompagnement souhaité.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:mt-4 sm:text-base md:text-lg">
            Aucune grille publique fixe n&apos;est affichée pour l&apos;instant : chaque déploiement repose sur une étude
            de votre organisation.
          </p>
          <div className={`mx-auto mt-6 max-w-md sm:mt-8 sm:max-w-none ${CTA_GROUP} sm:justify-center`}>
            <CalendlyBookingLink trackLocation="tarifs-hero-primary" className={CTA_PRIMARY}>
              Demander une étude
            </CalendlyBookingLink>
            <Link href="/#plateforme" className={CTA_SECONDARY}>
              Découvrir la plateforme
            </Link>
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-4xl sm:mt-14" aria-labelledby="calcul-tarif-heading">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-8 md:p-10">
            <h2 id="calcul-tarif-heading" className="text-xl font-bold text-[#0f172a] sm:text-2xl md:text-3xl">
              Comment est construite la proposition ?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
              Après un diagnostic de votre fonctionnement, nous cadrons le socle, les modules et l&apos;accompagnement
              utiles — sans inventer de montant hors contexte.
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2" role="list">
              {BEWORK_PRICING_CRITERIA.map((criterion) => (
                <li key={criterion} className="flex gap-2 text-base text-slate-800">
                  <span className="text-[#1d4ed8]" aria-hidden>
                    •
                  </span>
                  {criterion}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-4xl" aria-labelledby="client-garde-heading">
          <div className="rounded-2xl border-2 border-[#1d4ed8]/15 bg-[#eff6ff]/40 p-8 md:p-10">
            <h2 id="client-garde-heading" className="text-2xl font-bold text-[#0f172a] md:text-3xl">
              Ce que vous gardez toujours
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
              La plateforme assiste et structure. Les décisions engageantes restent chez vous.
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2" role="list">
              {BEWORK_CLIENT_KEEPS.map((item) => (
                <li key={item} className="flex gap-2 text-base font-medium text-[#0f172a]">
                  <span aria-hidden>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="process-heading">
          <h2 id="process-heading" className="text-center text-2xl font-bold text-[#0f172a] md:text-3xl">
            Comment démarrer avec BeWork ?
          </h2>
          <ol className="mx-auto mt-8 grid max-w-5xl list-none gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BEWORK_TARIFS_PROCESS_STEPS.map((step, i) => (
              <li key={step.title} className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1d4ed8] text-base font-bold text-white"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[#0f172a]">{step.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-slate-700">{step.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto mt-14 max-w-5xl" aria-labelledby="ressources-heading">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-8 md:p-10">
            <h2 id="ressources-heading" className="text-xl font-semibold text-[#0f172a] md:text-2xl">
              Aller plus loin
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {INTERNAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl border border-slate-100 px-4 py-3.5 text-base font-medium text-slate-800 transition hover:border-[#93c5fd] hover:bg-[#f8fafc]"
                >
                  {link.label} <span className="text-[#1d4ed8]">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-2xl font-bold text-[#0f172a] md:text-3xl">
            Questions fréquentes
          </h2>
          <ul className="mt-6 space-y-4">
            {BEWORK_TARIFS_FAQ.map(({ q, a }) => (
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
        </section>

        <section className="mt-14 rounded-2xl border-2 border-[#1d4ed8]/25 bg-[#eff6ff] p-8 text-center md:p-10">
          <h2 className="text-2xl font-bold text-[#0f172a] md:text-3xl">Parlons de votre organisation</h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
            Présentez votre fonctionnement actuel : nous vous montrerons comment configurer le socle BeWork.
          </p>
          <div className={`mt-6 ${CTA_GROUP} justify-center`}>
            <CalendlyBookingLink trackLocation="tarifs-footer" className={CTA_PRIMARY}>
              Demander une démonstration
            </CalendlyBookingLink>
            <Link href="/contact" className={CTA_SECONDARY}>
              Nous écrire
            </Link>
          </div>
        </section>

        <div className="mt-10 flex justify-center">
          <Link href="/" className="text-base font-medium text-slate-600 underline hover:text-[#0f172a]">
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>

      <StickyCtaMobile />
    </div>
  );
}
