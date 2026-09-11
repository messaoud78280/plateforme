import type { Metadata } from "next";
import { DemonstrationsHub } from "@/components/demonstrations/DemonstrationsHub";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { DEMO_PROJECTS } from "@/lib/bework-formation";
import {
  breadcrumbJsonLd,
  buildMarketingPageMetadata,
  SEO_PAGES,
} from "@/lib/seo-formation-pages";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const seo = SEO_PAGES.demonstrations;
const pageUrl = absoluteUrl(seo.path);

export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
  keywords: [...seo.keywords],
});

const demosJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: `${seo.title} | BeWork`,
      description: seo.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@type": "Thing", name: "Démonstrations de projets créés avec l’IA" },
    },
    {
      "@type": "ItemList",
      "@id": `${pageUrl}#list`,
      name: "Démonstrations BeWork",
      numberOfItems: DEMO_PROJECTS.length,
      itemListElement: DEMO_PROJECTS.map((demo, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: demo.title,
        url: absoluteUrl(`/demonstrations/${demo.slug}`),
        description: demo.description,
      })),
    },
    breadcrumbJsonLd([
      { name: "Accueil", path: "/" },
      { name: "Démonstrations", path: "/demonstrations" },
    ]),
  ],
};

export default function DemonstrationsHubPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(demosJsonLd) }}
      />
      <MarketingSiteHeader plainBg />

      <main>
        <div className="relative overflow-hidden">
          <BwAtmosphere variant="creation" />
          <div className="relative z-[1]">
            <DemonstrationsHub />
          </div>
        </div>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
