import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { StickyCtaMobile } from "@/components/tarifs/StickyCtaMobile";
import { TarifsPricingGrid } from "@/components/tarifs/TarifsPricingGrid";
import {
  BEWORK_CLIENT_KEEPS,
  BEWORK_TARIFS_TIER_PRICING_NOTE,
  BEWORK_PRICING_CRITERIA,
  BEWORK_REPOSITIONING_POINTS,
  BEWORK_SCOPE_TAKEOVER,
  BEWORK_TARIFS_FAQ,
  BEWORK_TARIFS_PROCESS_STEPS,
} from "@/lib/bework-public-offers";
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
        alt: "Tarifs BeWork — assistant travaux externalisé BTP, assistance technique et administrative BTP",
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

const TARIFS_VALUE_HEADING =
  "Une assistance travaux structurée, pas une simple prestation de saisie";

const TARIFS_VALUE_PARAGRAPHS = [
  "BeWork accompagne les entreprises du BTP dans le suivi administratif et documentaire de leurs chantiers, appels d’offres et marchés publics.",
  "Notre rôle : aider vos équipes à garder des dossiers propres, des relances suivies, des preuves centralisées, des situations préparées et des délais mieux maîtrisés.",
  "Vous gardez la décision finale. BeWork apporte la méthode, la rigueur et la continuité de suivi.",
] as const;

const INTERNAL_LINKS = [
  { href: "/assistants-administratifs-taches", label: "Missions & marchés publics" },
  {
    href: "/assistants-administratifs-taches#marches-publics-accords-cadres",
    label: "Exécution marché public (7 blocs)",
  },
  { href: "/gestion-marche-public-btp", label: "Gestion marché public" },
  { href: "/notre-facon-de-travailler", label: "Notre façon de travailler" },
  { href: "/ressources/compte-rendu-chantier", label: "Compte rendu de chantier" },
  { href: "/ressources/doe-btp", label: "DOE BTP" },
  { href: "/ressources/ppsps-btp", label: "PPSPS BTP" },
  { href: "/services/analyse-dce-btp", label: "Analyse DCE BTP" },
  { href: "/services/chiffrage-devis-btp", label: "Chiffrage & devis BTP" },
  { href: "/relance-devis-btp", label: "Relance devis BTP" },
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

      <main className="mx-auto max-w-site px-4 py-12 md:py-16">
        {/* Hero */}
        <section className="text-center">
          <h1 className="text-metallic-black font-sans text-4xl font-semibold tracking-tight md:text-5xl md:leading-tight">
            {TARIFS_H1}
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-xl leading-relaxed text-slate-700 md:text-[1.35rem] md:leading-relaxed">
            Des missions ponctuelles aux cellules travaux externalisées, BeWork aide les entreprises du BTP à structurer leurs
            devis, dossiers chantier, DCE, PPSPS, DOE, relances et comptes rendus avec méthode, IA spécialisée et supervision
            humaine.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
            Les tarifs affichés sont des prix de départ. Le tarif final dépend du nombre de chantiers, du volume de
            dossiers, des livrables attendus, de la fréquence de suivi et du niveau de supervision nécessaire.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <CalendlyBookingLink
              trackLocation="tarifs-hero-primary"
              className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-xl bg-[#1d4ed8] px-7 py-3 text-base font-semibold text-white shadow-md transition hover:bg-[#1e40af] sm:w-auto"
            >
              Réserver un appel
            </CalendlyBookingLink>
            <Link
              href="/contact?sujet=Intervention+ponctuelle"
              className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-7 py-3 text-base font-semibold text-[#0f172a] shadow-sm transition hover:border-[#1d4ed8]/30 hover:bg-[#f8fafc] sm:w-auto"
            >
              Demander une intervention ponctuelle
            </Link>
            <Link
              href="/assistants-administratifs-taches"
              className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-7 py-3 text-base font-semibold text-[#1d4ed8] shadow-sm transition-colors hover:border-[#1d4ed8]/40 hover:bg-[#eff6ff] sm:w-auto"
            >
              Voir les missions prises en charge
            </Link>
          </div>
        </section>

        {/* Grille tarifaire */}
        <section className="mt-14" aria-labelledby="offres-heading">
          <h2 id="offres-heading" className="text-center text-2xl font-bold text-[#0f172a] md:text-3xl">
            Nos offres
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-600 md:text-lg">
            Niveaux d&apos;accompagnement — prix de départ HT, ajustés au devis selon votre périmètre réel.
          </p>
          <div className="mt-8">
            <TarifsPricingGrid />
          </div>
        </section>

        {/* Repositionnement — sous la grille tarifaire */}
        <section className="mx-auto mt-10 max-w-4xl md:mt-12" aria-labelledby="repositionnement-heading">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm md:p-10">
            <h2 id="repositionnement-heading" className="text-center text-2xl font-bold text-[#0f172a] md:text-3xl">
              Une assistance technique et administrative BTP pour sécuriser vos dossiers
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-slate-600 md:text-lg">
              BeWork accompagne vos équipes dans le suivi administratif, documentaire et opérationnel de vos chantiers.
              L&apos;objectif : mieux structurer vos dossiers, suivre les relances, centraliser les preuves, préparer les
              situations, anticiper les réserves et sécuriser la facturation.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2" role="list">
              {BEWORK_REPOSITIONING_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-[#f8fafc] px-4 py-3.5 text-base text-slate-800"
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
            <h2 id="calcul-tarif-heading" className="text-2xl font-bold text-[#0f172a] md:text-3xl">
              Un tarif ajusté à votre organisation
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
              Le prix final dépend du périmètre réel de la mission. Une intervention ponctuelle n&apos;a pas le même
              niveau d&apos;engagement qu&apos;un suivi multi-chantiers ou qu&apos;une cellule travaux externalisée.
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
            <p className="mt-6 rounded-lg border border-slate-100 bg-[#f8fafc] px-4 py-3.5 text-base leading-relaxed text-slate-700">
              {BEWORK_TARIFS_TIER_PRICING_NOTE}
            </p>
          </div>
        </section>

        {/* Prise en charge */}
        <section className="mx-auto mt-14 max-w-5xl" aria-labelledby="prise-en-charge-heading">
          <h2 id="prise-en-charge-heading" className="text-2xl font-bold text-[#0f172a] md:text-3xl">
            Ce que BeWork peut prendre en charge
          </h2>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-3" role="list">
            {BEWORK_SCOPE_TAKEOVER.map((item) => (
              <li key={item} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-3 text-base text-slate-800">
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
            <h2 id="client-garde-heading" className="text-2xl font-bold text-[#0f172a] md:text-3xl">
              Ce que vous gardez toujours
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
              BeWork prépare, structure, suit et alerte. L&apos;entreprise garde toujours la validation finale et les décisions
              engageantes.
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

        {/* Positionnement tarifs */}
        <section className="mx-auto mt-14 max-w-3xl text-center" aria-labelledby="premium-heading">
          <h2 id="premium-heading" className="text-2xl font-bold text-[#0f172a] md:text-3xl">
            {TARIFS_VALUE_HEADING}
          </h2>
          {TARIFS_VALUE_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph} className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
              {paragraph}
            </p>
          ))}
        </section>

        {/* Processus */}
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

        {/* Liens internes SEO */}
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
              <Link
                href="/contact"
                className="rounded-xl border border-slate-100 px-4 py-3.5 text-base font-medium text-slate-800 transition hover:border-[#93c5fd] hover:bg-[#f8fafc]"
              >
                Contact &amp; diagnostic <span className="text-[#1d4ed8]">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
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

        {/* CTA bas */}
        <section className="mt-14 rounded-2xl border-2 border-[#1d4ed8]/25 bg-[#eff6ff] p-8 text-center md:p-10">
          <h2 className="text-2xl font-bold text-[#0f172a] md:text-3xl">Parlons de votre organisation</h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
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
          <Link href="/" className="text-base font-medium text-slate-600 underline hover:text-[#0f172a]">
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>

      <StickyCtaMobile />
    </div>
  );
}
