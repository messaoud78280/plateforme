import type { Metadata } from "next";
import { ParticiperPageContent } from "@/components/contact/ParticiperPageContent";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import {
  beworkCompleteOfferJsonLd,
  beworkCourseJsonLd,
  beworkSessionOfferJsonLd,
  breadcrumbJsonLd,
  buildMarketingPageMetadata,
  SEO_PAGES,
} from "@/lib/seo-formation-pages";
import type { TrainingOfferId } from "@/lib/bework-formation";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const seo = SEO_PAGES.contact;
const pageUrl = absoluteUrl(seo.path);

export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
  keywords: [...seo.keywords],
});

const contactJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": `${pageUrl}#contact-page`,
      url: pageUrl,
      name: `${seo.title} | BeWork`,
      inLanguage: "fr-FR",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      description: seo.description,
      mainEntity: { "@id": `${SITE_URL}/#organization` },
    },
    beworkCourseJsonLd(),
    {
      ...beworkSessionOfferJsonLd(),
      "@id": `${pageUrl}#offer-7h`,
    },
    {
      ...beworkCompleteOfferJsonLd(),
      "@id": `${pageUrl}#offer-14h`,
    },
    breadcrumbJsonLd([
      { name: "Accueil", path: "/" },
      { name: "Participer", path: "/contact" },
    ]),
  ],
};

type ContactPageProps = {
  searchParams: Promise<{ parcours?: string | string[] }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const requestedOffer = (await searchParams).parcours;
  const initialOfferId: TrainingOfferId =
    requestedOffer === "complete" ? "complete" : "essential";

  return (
    <div className="min-h-screen min-w-0 overflow-x-clip bg-transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <MarketingSiteHeader plainBg />
      <main>
        <ParticiperPageContent initialOfferId={initialOfferId} />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
