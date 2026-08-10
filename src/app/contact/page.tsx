import type { Metadata } from "next";
import Link from "next/link";
import { ProspectContactForm } from "@/components/contact/ProspectContactForm";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { SeoInternalLinks } from "@/components/seo/SeoInternalLinks";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";
import { getPublicPageSeo } from "@/lib/seo-public-pages";
import { absoluteUrl } from "@/lib/site";

const CONTACT_PAGE_PATH = "/contact" as const;
const pageUrl = absoluteUrl(CONTACT_PAGE_PATH);
const contactSeo = getPublicPageSeo(CONTACT_PAGE_PATH)!;

export const metadata: Metadata = landingPageMetadataFromPath(CONTACT_PAGE_PATH);

const contactJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": `${pageUrl}#contact-page`,
      url: pageUrl,
      name: contactSeo.title,
      inLanguage: "fr-FR",
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      description: contactSeo.description,
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
            Parlez-nous de votre besoin
          </h1>
          <p className="mt-4 text-[0.9375rem] font-medium leading-relaxed text-black sm:text-base md:text-lg">
            Solution IA, automatisation, analyse documentaire, intégration à vos outils, ou plateforme métier —
            décrivez simplement ce que vous voulez améliorer. BeWork étudie et vous recontacte pour un{" "}
            <strong className="font-semibold text-black">échange adapté</strong>.
          </p>

          <div
            id="formulaire"
            className="relative mt-8 scroll-mt-28 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:mt-10 sm:p-6 md:p-8"
          >
            <ProspectContactForm source="contact_page" />
          </div>

          <div className="mt-6 flex w-full flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/faq"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:h-12 sm:w-auto sm:rounded-xl sm:border-2 sm:px-8 sm:py-3.5 sm:text-base"
            >
              Lire la FAQ
            </Link>
            <Link
              href="/tarifs"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:h-12 sm:w-auto sm:rounded-xl sm:border-2 sm:px-8 sm:py-3.5 sm:text-base"
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_TARIFS, "contact-page")}
            >
              Voir les tarifs
            </Link>
          </div>

          <div className="mt-12 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-semibold text-black">Déjà client ?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Pour une demande de mission ou un suivi, utilisez votre{" "}
              <Link href="/connexion" className="font-semibold text-[#1d4ed8] hover:underline">
                espace client
              </Link>{" "}
              (messagerie et nouvelle demande).
            </p>
          </div>

          <p className="mt-10 text-center text-sm text-slate-600">
            <Link href="/" className="font-medium text-[#1d4ed8] hover:underline">
              ← Retour à l’accueil
            </Link>
          </p>

          <SeoInternalLinks path={CONTACT_PAGE_PATH} className="mt-12" />
        </div>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
