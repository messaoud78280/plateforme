import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { ResourcesClickableList } from "@/components/ressources/ResourcesClickableList";
import { resourcesBtnSecondary } from "@/components/ressources/resources-hub-ui";
import { getResourcePdfPublicPath, resourceSlugFromHref } from "@/content/resource-pdf-catalog";
import { RESOURCE_TUTO_ITEMS, type ResourceStatus } from "@/content/resource-tutos";
import {
  SEO_OG_ALTERNATE_LOCALES,
  SEO_OG_LOCALE_PRIMARY,
  hreflangFrancophonieLanguages,
} from "@/lib/seo-francophonie";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/ressources/tutos");
const ogImage = absoluteUrl("/opengraph-image");

const TUTOS_META_TITLE = "Tutoriels BTP : skills Claude et PDF gratuits | BeWork";
const TUTOS_META_DESC =
  "Tutoriels BeWork : créez vos skills IA pour analyser un DCE, générer un PPSPS, un DOE ou un devis. Guides pas à pas pour gagner du temps sur l'administratif BTP.";

export const metadata: Metadata = {
  title: { absolute: TUTOS_META_TITLE },
  description: TUTOS_META_DESC,
  alternates: { canonical: pageUrl, languages: hreflangFrancophonieLanguages("/ressources/tutos") },
  openGraph: {
    type: "website",
    locale: SEO_OG_LOCALE_PRIMARY,
    alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
    url: pageUrl,
    siteName: "BeWork",
    title: TUTOS_META_TITLE,
    description: TUTOS_META_DESC,
    images: [{ url: ogImage, width: 1200, height: 630, alt: "BeWork — tutoriels" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TUTOS_META_TITLE,
    description: TUTOS_META_DESC,
  },
  robots: { index: true, follow: true },
};

function BadgeStatus({ status }: { status: ResourceStatus }) {
  const base =
    "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[0.625rem] font-semibold ring-1 sm:px-2 sm:py-0.5 sm:text-[0.6875rem] bg-teal-50 text-teal-950 ring-teal-200/90";
  return <span className={base}>{status}</span>;
}

function ResourceGlyph({ className }: { className?: string }) {
  const cn = className ?? "h-4 w-4 text-[#1d4ed8] sm:h-[1.125rem] sm:w-[1.125rem]";
  return (
    <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h10a2 2 0 002-2V9l-5-6H8a2 2 0 00-2 2v13a2 2 0 002 2z" />
      <path strokeLinecap="round" d="M13 4v7h7M10 17h9M10 13h9" />
    </svg>
  );
}

export default function RessourcesTutosPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9]">
      <MarketingSiteHeader plainBg />

      <main className="mx-auto max-w-site px-4 pb-14 pt-10 sm:px-6 md:pb-16 md:pt-12">
        <header className="mx-auto max-w-3xl border-b border-slate-200/90 pb-8 text-center md:pb-10">
          <nav className="mb-4 text-sm text-slate-600" aria-label="Fil d’Ariane">
            <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <li>
                <Link href="/ressources" className="font-medium text-[#2563eb] hover:underline">
                  Ressources
                </Link>
              </li>
              <li className="text-slate-400" aria-hidden>
                /
              </li>
              <li className="font-medium text-slate-900">Tutoriels</li>
            </ol>
          </nav>
          <h1 className="font-heading text-balance text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
            Tutoriels
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
            Tutoriels courts et fiches PDF préparés par BeWork : méthodes pas à pas avec prompts à copier. Téléchargez le PDF
            directement ou ouvrez la fiche pour le lire en ligne.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <CalendlyBookingLink className={resourcesBtnSecondary}>Réserver un appel</CalendlyBookingLink>
          </div>
        </header>

        <ResourcesClickableList
          className="mx-auto mt-10 max-w-6xl"
          columns={2}
          items={RESOURCE_TUTO_ITEMS.map((item) => {
            const pdfHref = getResourcePdfPublicPath(item.href);
            return {
              href: item.href,
              title: item.title,
              description: item.desc,
              badge: <BadgeStatus status={item.status} />,
              icon: <ResourceGlyph className="h-5 w-5 sm:h-[1.125rem] sm:w-[1.125rem]" />,
              pdfHref,
              resourceSlug: resourceSlugFromHref(item.href),
              openLabel: "Ouvrir le tutoriel",
              pdfLabel: "Télécharger le PDF",
            };
          })}
        />
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
