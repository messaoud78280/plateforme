import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { PromoteursImmobiliersPage } from "@/components/marketing/PromoteursImmobiliersPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";
import { getPublicPageSeo } from "@/lib/seo-public-pages";
import { buildLandingServiceJsonLd, buildWebPageAndBreadcrumbJsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

const PAGE_PATH = "/promoteurs-immobiliers" as const;
const pageSeo = getPublicPageSeo(PAGE_PATH)!;

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

function PromoteursJsonLd() {
  const webPage = buildWebPageAndBreadcrumbJsonLd({
    pagePath: PAGE_PATH,
    h1: "Assistant travaux pour promoteurs immobiliers",
    description: pageSeo.description,
    breadcrumbItems: [
      { name: "Accueil", href: "/" },
      { name: "Promoteurs immobiliers", href: PAGE_PATH },
    ],
  });
  const serviceLd = buildLandingServiceJsonLd({
    name: "Assistant travaux pour promoteurs immobiliers",
    description: pageSeo.description,
    pageUrl: absoluteUrl(PAGE_PATH),
    serviceType: "Suivi administratif et opérationnel pour promoteurs immobiliers",
  });
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
    </>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <PromoteursJsonLd />
      <MarketingSiteHeader plainBg />
      <nav className="container-site px-4 pt-6 sm:px-6 sm:pt-8" aria-label="Fil d’Ariane">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
          <li>
            <Link href="/" className="font-medium text-[#1d4ed8] hover:underline">
              Accueil
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-slate-900">Promoteurs immobiliers</li>
        </ol>
      </nav>
      <PromoteursImmobiliersPage />
      <MarketingSiteFooter />
    </div>
  );
}
