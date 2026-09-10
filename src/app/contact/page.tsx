import type { Metadata } from "next";
import Link from "next/link";
import { FormationInterestForm } from "@/components/contact/FormationInterestForm";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import { BEWORK_FORMATION_TAGLINE, BEWORK_SESSION_PRICE_EUR } from "@/lib/bework-formation";
import { absoluteUrl } from "@/lib/site";

const CONTACT_PAGE_PATH = "/contact" as const;
const pageUrl = absoluteUrl(CONTACT_PAGE_PATH);

export const metadata: Metadata = {
  title: "Contact — Participer à une formation BeWork",
  description:
    "Manifestez votre intérêt pour une session BeWork : formation pratique pour créer sites, applications et outils avec l’intelligence artificielle.",
  alternates: { canonical: pageUrl },
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": `${pageUrl}#contact-page`,
      url: pageUrl,
      name: "Contact — Formation BeWork",
      inLanguage: "fr-FR",
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      description:
        "Formulaire d’intérêt pour participer à une formation pratique BeWork sur la création avec l’IA.",
      mainEntity: { "@id": `${absoluteUrl("/")}#organization` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Contact", item: pageUrl },
      ],
    },
  ],
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }} />
      <MarketingSiteHeader plainBg />

      <main className="px-4 py-10 sm:py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-heading text-metallic-black text-[1.75rem] font-bold tracking-tight text-balance sm:text-3xl md:text-4xl">
            Participer à une formation BeWork
          </h1>
          <p className="mt-4 text-[0.9375rem] font-medium leading-relaxed text-black sm:text-base md:text-lg">
            {BEWORK_FORMATION_TAGLINE} Indiquez-nous votre activité et ce que vous aimeriez créer — session à{" "}
            {BEWORK_SESSION_PRICE_EUR}&nbsp;€.
          </p>

          <div
            id="participer"
            className="relative mt-8 scroll-mt-28 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:mt-10 sm:p-6 md:p-8"
          >
            <h2 className="text-lg font-semibold text-slate-900">Manifestation d&apos;intérêt</h2>
            <p className="mt-1 text-sm text-slate-600">
              Nous vous recontactons pour les prochaines dates et modalités.
            </p>
            <div className="mt-6">
              <FormationInterestForm />
            </div>
          </div>

          <div className="mt-6 flex w-full flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/faq"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:h-12 sm:w-auto sm:rounded-xl sm:border-2 sm:px-8 sm:py-3.5 sm:text-base"
            >
              Lire la FAQ
            </Link>
            <Link
              href="/formation"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:h-12 sm:w-auto sm:rounded-xl sm:border-2 sm:px-8 sm:py-3.5 sm:text-base"
            >
              Voir la formation
            </Link>
            <Link
              href="/tarifs"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:h-12 sm:w-auto sm:rounded-xl sm:border-2 sm:px-8 sm:py-3.5 sm:text-base"
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_TARIFS, "contact-page")}
            >
              Tarif de la session
            </Link>
          </div>

          <p className="mt-10 text-center text-sm text-slate-600">
            <Link href="/" className="font-medium text-[#1d4ed8] hover:underline">
              ← Retour à l’accueil
            </Link>
          </p>
        </div>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
