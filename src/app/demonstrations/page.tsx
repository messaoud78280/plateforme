import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import {
  HOME_CARD,
  HOME_CONTENT,
  HOME_EYEBROW,
  HOME_H2,
  HOME_HEADER,
  HOME_LEAD,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/components/marketing/marketingCtaStyles";
import { DEMO_INTERACTIVE_SLUGS, DEMO_PROJECTS } from "@/lib/bework-formation";
import {
  breadcrumbJsonLd,
  buildMarketingPageMetadata,
  SEO_PAGES,
} from "@/lib/seo-formation-pages";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const seo = SEO_PAGES.demonstrations;
const pageUrl = absoluteUrl(seo.path);
const interactive = new Set<string>(DEMO_INTERACTIVE_SLUGS);

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
        <section className={`${HOME_SECTION} relative overflow-hidden`}>
          <BwAtmosphere variant="creation" />
          <div className="relative z-[1] mx-auto max-w-site px-5 sm:px-6">
            <div className={HOME_HEADER}>
              <p className={HOME_EYEBROW}>Démonstrations</p>
              <h1 className={HOME_H2}>
                Ce n&apos;est pas une image.
                <br />
                <span className="text-[#275BE8]">Essayez.</span>
              </h1>
              <p className={HOME_LEAD}>{seo.description}</p>
            </div>

            <ul className={`${HOME_CONTENT} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
              {DEMO_PROJECTS.map((demo) => (
                <li key={demo.slug}>
                  <Link
                    href={`/demonstrations/${demo.slug}`}
                    className={`${HOME_CARD} group flex h-full flex-col p-6 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(30,60,120,0.10)]`}
                  >
                    <span
                      className="h-1.5 w-12 rounded-full"
                      style={{ backgroundColor: demo.accent }}
                      aria-hidden
                    />
                    <h2 className="mt-4 text-lg font-semibold text-[#0B0D12] group-hover:text-[#275BE8]">
                      {demo.title}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[#42526B]">
                      {demo.description}
                    </p>
                    <span className="mt-4 text-sm font-semibold text-[#275BE8]">
                      {interactive.has(demo.slug) ? "Explorer →" : "Voir l’aperçu →"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-14 flex flex-wrap justify-center gap-3">
              <Link href="/formation" className={CTA_PRIMARY}>
                Découvrir la formation
              </Link>
              <Link href="/contact#participer" className={CTA_SECONDARY}>
                Participer
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
