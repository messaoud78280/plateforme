import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { StickyCtaMobile } from "@/components/tarifs/StickyCtaMobile";
import { TarifsPricingGrid } from "@/components/tarifs/TarifsPricingGrid";
import {
  BEWORK_CLIENT_KEEPS,
  BEWORK_PRICING_CRITERIA,
  BEWORK_REPOSITIONING_POINTS,
  BEWORK_SCOPE_TAKEOVER,
  BEWORK_TARIFS_FAQ,
  BEWORK_TARIFS_PROCESS_STEPS,
  beworkOffersForJsonLd,
} from "@/lib/bework-public-offers";
import {
  SEO_OG_ALTERNATE_LOCALES,
  SEO_OG_LOCALE_PRIMARY,
  hreflangFrancophonieLanguages,
} from "@/lib/seo-francophonie";
import { buildOfferCatalogJsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

const tarifsUrl = absoluteUrl("/tarifs");
const tarifsOgImage = absoluteUrl("/opengraph-image");

const TARIFS_META_DESC =
  "Découvrez les tarifs BeWork : missions ponctuelles, relais travaux mensuel et cellule travaux externalisée pour devis, DCE, PPSPS, DOE, relances et suivi chantier.";

export const metadata: Metadata = {
  title: { absolute: "Tarifs BeWork | Assistant travaux externalisé BTP" },
  description: TARIFS_META_DESC,
  keywords: [
    "tarifs assistant travaux",
    "assistant travaux externalisé",
    "assistant administratif BTP",
    "cellule travaux externalisée",
    "suivi chantier externalisé",
    "aide conducteur de travaux",
    "DCE BTP",
    "DOE BTP",
    "PPSPS BTP",
    "compte rendu de chantier",
    "relance devis BTP",
    "externalisation administrative BTP",
  ],
  alternates: { canonical: tarifsUrl, languages: hreflangFrancophonieLanguages("/tarifs") },
  openGraph: {
    type: "website",
    locale: SEO_OG_LOCALE_PRIMARY,
    alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
    url: tarifsUrl,
    siteName: "BeWork",
    title: "Tarifs BeWork | Assistant travaux externalisé BTP",
    description: TARIFS_META_DESC,
    images: [
      {
        url: tarifsOgImage,
        width: 1200,
        height: 630,
        alt: "Tarifs BeWork — relais bureau-chantier pour entreprises du BTP",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarifs BeWork | Assistant travaux externalisé BTP",
    description: TARIFS_META_DESC,
  },
  robots: { index: true, follow: true },
};

const WHY_NOT_CHEAPEST =
  "BeWork n’a pas vocation à être l’option la moins chère du marché. Notre rôle est d’apporter un relais fiable aux entreprises du BTP qui perdent du temps sur les devis, relances, dossiers chantier, pièces marché, DOE, PPSPS ou comptes rendus. Nos offres sont pensées pour les dirigeants, conducteurs de travaux et chargés d’affaires qui veulent déléguer sérieusement sans recruter immédiatement.";

const INTERNAL_LINKS = [
  { href: "/notre-facon-de-travailler", label: "Notre façon de travailler" },
  { href: "/ressources/compte-rendu-chantier", label: "Compte rendu de chantier" },
  { href: "/ressources/doe-btp", label: "DOE BTP" },
  { href: "/ressources/ppsps-btp", label: "PPSPS BTP" },
  { href: "/services/analyse-dce-btp", label: "Analyse DCE BTP" },
  { href: "/services/chiffrage-devis-btp", label: "Chiffrage & devis BTP" },
  { href: "/relance-devis-btp", label: "Relance devis BTP" },
] as const;

const tarifsStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    buildOfferCatalogJsonLd(beworkOffersForJsonLd(), tarifsUrl),
    {
      "@type": "FAQPage",
      "@id": `${tarifsUrl}#faq`,
      url: tarifsUrl,
      inLanguage: "fr-FR",
      mainEntity: BEWORK_TARIFS_FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 md:pb-16">
      <MarketingSiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tarifsStructuredData) }}
      />

      <main className="mx-auto max-w-site px-4 py-12 md:py-16">
        {/* Hero */}
        <section className="text-center">
          <h1 className="text-metallic-black font-sans text-3xl font-semibold tracking-tight md:text-4xl md:leading-tight">
            Tarifs BeWork : déléguer le suivi travaux sans recruter
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-slate-700">
            Des missions ponctuelles aux cellules travaux externalisées, BeWork aide les entreprises du BTP à structurer leurs
            devis, dossiers chantier, DCE, PPSPS, DOE, relances et comptes rendus avec méthode, IA spécialisée et supervision
            humaine.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
            Nos tarifs sont affichés en prix de départ. Chaque accompagnement est ensuite ajusté selon votre nombre de
            chantiers, votre volume de dossiers, les livrables attendus, la fréquence de suivi et le niveau de supervision
            nécessaire.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CalendlyBookingLink
              trackLocation="tarifs-hero-primary"
              className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-xl bg-[#1d4ed8] px-7 py-3 text-base font-semibold text-white shadow-md transition hover:bg-[#1e40af] sm:w-auto"
            >
              Réserver un appel
            </CalendlyBookingLink>
            <Link
              href="/contact?sujet=Mission+ponctuelle"
              className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-7 py-3 text-base font-semibold text-[#0f172a] shadow-sm transition hover:border-[#1d4ed8]/30 hover:bg-[#f8fafc] sm:w-auto"
            >
              Commencer par une mission ponctuelle
            </Link>
          </div>
        </section>

        {/* Grille tarifaire */}
        <section className="mt-14" aria-labelledby="offres-heading">
          <h2 id="offres-heading" className="text-center text-xl font-bold text-[#0f172a] md:text-2xl">
            Nos offres
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-600">
            Niveaux d&apos;accompagnement — prix de départ HT, ajustés au devis selon votre périmètre réel.
          </p>
          <div className="mt-8">
            <TarifsPricingGrid />
          </div>
        </section>

        {/* Repositionnement — sous la grille tarifaire */}
        <section className="mx-auto mt-10 max-w-4xl md:mt-12" aria-labelledby="repositionnement-heading">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm md:p-10">
            <h2 id="repositionnement-heading" className="text-center text-xl font-bold text-[#0f172a] md:text-2xl">
              Vous ne payez pas seulement du temps
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-slate-600 md:text-base">
              BeWork n&apos;est pas une assistance administrative low-cost. Vous achetez de la méthode, de la traçabilité, une
              meilleure organisation documentaire et un relais bureau-chantier capable de soulager vos équipes travaux.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2" role="list">
              {BEWORK_REPOSITIONING_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700"
                >
                  <span className="mt-0.5 text-[#1d4ed8]" aria-hidden>
                    ✓
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Calcul du tarif */}
        <section className="mx-auto mt-14 max-w-4xl" aria-labelledby="calcul-tarif-heading">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-8 md:p-10">
            <h2 id="calcul-tarif-heading" className="text-xl font-bold text-[#0f172a] md:text-2xl">
              Un tarif ajusté à votre organisation
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
              Le prix final dépend du périmètre réel de la mission. Un accompagnement pour un dossier ponctuel n&apos;a pas le
              même niveau d&apos;engagement qu&apos;un suivi multi-chantiers ou qu&apos;une cellule travaux externalisée.
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2" role="list">
              {BEWORK_PRICING_CRITERIA.map((criterion) => (
                <li key={criterion} className="flex gap-2 text-sm text-slate-700">
                  <span className="text-[#1d4ed8]" aria-hidden>
                    •
                  </span>
                  {criterion}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Prise en charge */}
        <section className="mx-auto mt-14 max-w-5xl" aria-labelledby="prise-en-charge-heading">
          <h2 id="prise-en-charge-heading" className="text-xl font-bold text-[#0f172a] md:text-2xl">
            Ce que BeWork peut prendre en charge
          </h2>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-3" role="list">
            {BEWORK_SCOPE_TAKEOVER.map((item) => (
              <li key={item} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2.5 text-sm text-slate-700">
                <span className="text-[#1d4ed8]" aria-hidden>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Ce que vous gardez */}
        <section className="mx-auto mt-14 max-w-4xl" aria-labelledby="client-garde-heading">
          <div className="rounded-2xl border-2 border-[#1d4ed8]/15 bg-[#eff6ff]/40 p-8 md:p-10">
            <h2 id="client-garde-heading" className="text-xl font-bold text-[#0f172a] md:text-2xl">
              Ce que vous gardez toujours
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-700 md:text-base">
              BeWork prépare, structure, suit et alerte. L&apos;entreprise garde toujours la validation finale et les décisions
              engageantes.
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2" role="list">
              {BEWORK_CLIENT_KEEPS.map((item) => (
                <li key={item} className="flex gap-2 text-sm font-medium text-[#0f172a]">
                  <span aria-hidden>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pourquoi pas les moins chers */}
        <section className="mx-auto mt-14 max-w-3xl text-center" aria-labelledby="premium-heading">
          <h2 id="premium-heading" className="text-xl font-bold text-[#0f172a] md:text-2xl">
            Pourquoi nos tarifs ne sont pas les moins chers
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">{WHY_NOT_CHEAPEST}</p>
        </section>

        {/* Processus */}
        <section className="mt-14" aria-labelledby="process-heading">
          <h2 id="process-heading" className="text-center text-xl font-bold text-[#0f172a] md:text-2xl">
            Comment démarrer avec BeWork ?
          </h2>
          <ol className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BEWORK_TARIFS_PROCESS_STEPS.map((step, i) => (
              <li key={step.title} className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1d4ed8] text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-[#0f172a]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Liens internes SEO */}
        <section className="mx-auto mt-14 max-w-5xl" aria-labelledby="ressources-heading">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-8 md:p-10">
            <h2 id="ressources-heading" className="text-lg font-semibold text-[#0f172a] md:text-xl">
              Aller plus loin
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {INTERNAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl border border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#93c5fd] hover:bg-[#f8fafc]"
                >
                  {link.label} <span className="text-[#1d4ed8]">→</span>
                </Link>
              ))}
              <Link
                href="/contact"
                className="rounded-xl border border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#93c5fd] hover:bg-[#f8fafc]"
              >
                Contact &amp; diagnostic <span className="text-[#1d4ed8]">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-bold text-[#0f172a] md:text-2xl">
            Questions fréquentes
          </h2>
          <ul className="mt-6 space-y-4">
            {BEWORK_TARIFS_FAQ.map(({ q, a }) => (
              <li key={q} className="rounded-xl border border-slate-200/90 bg-white shadow-sm">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-inset [&::-webkit-details-marker]:hidden">
                    <span>{q}</span>
                    <span className="shrink-0 pl-2 text-slate-400 group-open:rotate-180">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600">{a}</div>
                </details>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA bas */}
        <section className="mt-14 rounded-2xl border-2 border-[#1d4ed8]/25 bg-[#eff6ff] p-8 text-center md:p-10">
          <h2 className="text-xl font-bold text-[#0f172a] md:text-2xl">Parlons de votre organisation</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
            Nous cadrons ensemble le niveau d&apos;accompagnement adapté à vos chantiers et à votre volume de dossiers.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CalendlyBookingLink
              trackLocation="tarifs-footer"
              className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-xl bg-[#1d4ed8] px-8 py-3 font-semibold text-white shadow-md transition hover:bg-[#1e40af] sm:w-auto"
            >
              Réserver un appel
            </CalendlyBookingLink>
            <Link
              href="/contact"
              className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-8 py-3 font-semibold text-[#0f172a] transition hover:bg-slate-50 sm:w-auto"
            >
              Nous écrire
            </Link>
          </div>
        </section>

        <div className="mt-10 flex justify-center">
          <Link href="/" className="text-sm font-medium text-slate-600 underline hover:text-[#0f172a]">
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>

      <StickyCtaMobile />
    </div>
  );
}
