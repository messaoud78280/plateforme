import type { Metadata } from "next";
import Link from "next/link";
import { ProspectContactForm } from "@/components/contact/ProspectContactForm";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import {
  SEO_OG_ALTERNATE_LOCALES,
  SEO_OG_LOCALE_PRIMARY,
  hreflangFrancophonieLanguages,
} from "@/lib/seo-francophonie";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/contact");
const contactOgImage = absoluteUrl("/opengraph-image");

const CONTACT_TITLE = "Contact BeWork — qualifier votre besoin administratif BTP";
const CONTACT_DESCRIPTION =
  "Contactez BeWork et qualifiez votre besoin BTP en quelques minutes : type de marché, volume, délais. On vous rappelle pour cadrer la délégation administrative.";

export const metadata: Metadata = {
  title: { absolute: CONTACT_TITLE },
  description: CONTACT_DESCRIPTION,
  keywords: [
    "contact BeWork",
    "demande externalisation administrative BTP",
    "assistant travaux BTP",
    "suivi marchés travaux",
    "qualification besoin administratif chantier",
  ],
  alternates: { canonical: pageUrl, languages: hreflangFrancophonieLanguages("/contact") },
  openGraph: {
    type: "website",
    locale: SEO_OG_LOCALE_PRIMARY,
    alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
    url: pageUrl,
    siteName: "BeWork",
    title: CONTACT_TITLE,
    description: CONTACT_DESCRIPTION,
    images: [{ url: contactOgImage, width: 1200, height: 630, alt: "Contacter BeWork — partenaire administratif BTP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact BeWork — qualifier votre besoin BTP",
    description: CONTACT_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": `${pageUrl}#contact-page`,
      url: pageUrl,
      name: CONTACT_TITLE,
      inLanguage: "fr-FR",
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      description: CONTACT_DESCRIPTION,
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

      <main className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-metallic-black font-sans text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Contact & échange
          </h1>
          <p className="mt-4 text-base font-medium leading-relaxed text-black md:text-lg">
            Décrivez votre contexte en quelques champs : BeWork qualifie votre demande et vous recontacte pour un{" "}
            <strong className="font-semibold text-black">échange ciblé</strong> sur vos marchés et votre charge
            administrative.
          </p>

          <div
            id="formulaire"
            className="relative mt-10 scroll-mt-28 rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm md:p-8"
          >
            <ProspectContactForm source="contact_page" />
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Link
              href="/faq"
              className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-8 py-3.5 text-center text-base font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Lire la FAQ
            </Link>
            <Link
              href="/tarifs"
              className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-8 py-3.5 text-center text-base font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
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
        </div>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
