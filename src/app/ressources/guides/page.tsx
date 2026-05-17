import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BLOG_ARTICLES, BLOG_SLUGS } from "@/content/blog-articles";
import { RESOURCE_GUIDE_PAGE_ITEMS } from "@/content/resource-guides-pages";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const guidesUrl = absoluteUrl("/ressources/guides");
const guidesOgImage = absoluteUrl("/opengraph-image");

const GUIDE_INDEX: {
  key: string;
  href: string;
  title: string;
  excerpt: string;
  publishedTime: string;
  badge?: import("@/content/resource-guides-pages").ResourceGuideBadge;
}[] = [
  ...[...BLOG_SLUGS].map((slug) => {
    const a = BLOG_ARTICLES[slug];
    return {
      key: `blog:${slug}`,
      href: `/blog/${slug}`,
      title: a.title,
      excerpt: a.excerpt ?? a.description,
      publishedTime: a.publishedTime,
    };
  }),
  ...RESOURCE_GUIDE_PAGE_ITEMS.map((g) => ({
    key: `resource:${g.href}`,
    href: g.href,
    title: g.title,
    excerpt: g.excerpt,
    publishedTime: g.publishedTime,
    badge: g.badge,
  })),
].sort((x, y) => new Date(y.publishedTime).getTime() - new Date(x.publishedTime).getTime());

export const metadata: Metadata = {
  title: { absolute: "Guides BTP : conducteur de travaux et IA | BeWork" },
  description:
    "Guides PDF BeWork pour conducteurs de travaux : IA, skills Claude, gestion administrative chantier et externalisation bureau-chantier.",
  keywords: [
    "guides administratif BTP",
    "pilotage administratif BTP",
    "conseils artisan bâtiment",
    "externalisation administrative",
    "situation de travaux",
    "facturation chantier",
    "retenue de garantie BTP",
    "devis BTP",
    "traçabilité chantier",
    "DPGF",
    "assistant administratif distance",
  ],
  alternates: { canonical: guidesUrl, languages: { fr: guidesUrl, "x-default": guidesUrl } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: guidesUrl,
    siteName: "BeWork",
    title: "Guides BeWork — pilotage administratif & BTP",
    description:
      "Guides BeWork : méthodes et articles pour piloter l’administratif chantier, la trésorerie et l’externalisation en BTP.",
    images: [{ url: guidesOgImage, width: 1200, height: 630, alt: "Guides BeWork — administratif BTP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guides BeWork",
    description:
      "Guides BeWork : méthodes et articles pour piloter l’administratif chantier, la trésorerie et l’externalisation en BTP.",
  },
  robots: { index: true, follow: true },
};

type GuideCardVariant = "article" | "pdf";

function BadgeGuide({ variant, label }: { variant: GuideCardVariant; label?: string }) {
  const base =
    "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[0.625rem] font-semibold ring-1 sm:px-2 sm:py-0.5 sm:text-[0.6875rem]";
  const pdfLabel = label ?? "Tuto PDF";
  const cls =
    pdfLabel === "Guide PDF"
      ? `${base} bg-amber-50 text-amber-950 ring-amber-200/90`
      : variant === "pdf"
        ? `${base} bg-teal-50 text-teal-950 ring-teal-200/90`
        : `${base} bg-violet-50 text-violet-950 ring-violet-200/90`;
  return <span className={cls}>{variant === "pdf" ? pdfLabel : "Article"}</span>;
}

function GuideGlyph({ className }: { className?: string }) {
  const cn = className ?? "h-4 w-4 text-[#1d4ed8] sm:h-[1.125rem] sm:w-[1.125rem]";
  return (
    <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h10a2 2 0 002-2V9l-5-6H8a2 2 0 00-2 2v13a2 2 0 002 2z" />
      <path strokeLinecap="round" d="M14 17H9m5-5H9" />
    </svg>
  );
}

const CARD =
  "flex h-full flex-col rounded-xl border border-slate-200/95 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-sm sm:p-3.5";

const ICON_WRAP =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] ring-1 ring-blue-100 sm:h-9 sm:w-9";

const LINK_BTN =
  "inline-flex min-h-[2.25rem] w-full items-center justify-center rounded-lg bg-[#1d4ed8] px-3 text-xs font-semibold text-white shadow-sm shadow-[#1d4ed8]/18 transition hover:bg-[#1e40af] sm:w-auto sm:min-h-[2.375rem] sm:px-4 sm:text-sm";

function GuideCard({ item }: { item: (typeof GUIDE_INDEX)[number] }) {
  const variant: GuideCardVariant = item.key.startsWith("resource:") ? "pdf" : "article";
  const dateLabel = new Date(item.publishedTime).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className={CARD}>
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span className={ICON_WRAP} aria-hidden>
          <GuideGlyph />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <h2 className="text-[0.8125rem] font-bold leading-snug tracking-tight text-slate-900 sm:text-sm">{item.title}</h2>
            <BadgeGuide variant={variant} label={item.badge} />
          </div>
          <p className="mt-0.5 text-[0.6875rem] font-medium text-slate-500 sm:text-[0.75rem]">{dateLabel}</p>
          <p className="mt-1 text-[0.75rem] leading-snug text-slate-600 sm:mt-1.5 sm:text-[0.8125rem] sm:leading-relaxed">{item.excerpt}</p>
        </div>
      </div>
      <div className="mt-2.5 sm:mt-3">
        <Link href={item.href} className={LINK_BTN}>
          Lire le guide
        </Link>
      </div>
    </article>
  );
}

export default function RessourcesGuidesPage() {
  const guideListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Guides BeWork",
    description: "Guides sur l'administratif externalisé, le BTP et la délégation.",
    numberOfItems: GUIDE_INDEX.length,
    itemListElement: GUIDE_INDEX.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(a.href),
      name: a.title,
    })),
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Guides BeWork",
    url: guidesUrl,
    inLanguage: "fr-FR",
    publisher: { "@type": "Organization", name: "BeWork", url: SITE_URL },
    hasPart: GUIDE_INDEX.map((a) => ({
      "@type": "Article",
      headline: a.title,
      url: absoluteUrl(a.href),
      datePublished: a.publishedTime,
    })),
  };

  const PRATIQUE_LINKS = [
    { title: "Relance devis BTP", href: "/relance-devis-btp" },
    { title: "Impayés & relances", href: "/impayes-btp-relances" },
    { title: "Situation de travaux", href: "/situation-travaux-btp" },
    { title: "DICT / DT", href: "/dict-dt-travaux" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <MarketingSiteHeader plainBg />

      <main className="mx-auto max-w-site px-4 pb-14 pt-10 sm:px-6 md:pb-16 md:pt-12">
        <header className="w-full border-b border-slate-200/90 pb-6 md:pb-8">
          <nav className="mb-4 text-[0.6875rem] text-slate-700 sm:text-sm" aria-label="Fil d’Ariane">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li>
                <Link href="/ressources" className="font-medium text-black hover:text-[#1d4ed8]">
                  Ressources
                </Link>
              </li>
              <li className="text-slate-400" aria-hidden>
                /
              </li>
              <li className="font-medium text-black">Guides</li>
            </ol>
          </nav>
          <h1 className="text-balance text-2xl font-bold tracking-tight text-black md:text-3xl">Guides</h1>
          <p className="mt-3 max-w-xl text-xs leading-snug text-slate-700 sm:text-sm sm:leading-relaxed md:text-[0.9375rem]">
            Guides PDF conducteur de travaux (compilation 52 pages, article IA &amp; skills). Pour les fiches pas à pas avec prompts, voir les
            pas à pas (prompts, skills), voir aussi les{" "}
            <Link href="/ressources/tutos" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
              tutoriels
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <CalendlyBookingLink className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              Réserver un appel
            </CalendlyBookingLink>
          </div>
        </header>

        <div className="mx-auto mt-8 w-full max-w-4xl">
          {GUIDE_INDEX.length === 0 ? (
            <div className="rounded-xl border border-slate-200/95 bg-white p-6 text-slate-700 shadow-sm sm:p-8">
              <p className="text-sm font-medium leading-relaxed">
                Les guides sous forme d&apos;articles sont en cours de refonte&nbsp;: les tutoriels PDF et autres ressources restent disponibles depuis le
                hub ou la liste tutoriels.
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <Link href="/ressources" className="text-sm font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
                  Hub ressources →
                </Link>
                <Link href="/ressources/tutos" className="text-sm font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
                  Tutoriels PDF →
                </Link>
              </div>
            </div>
          ) : (
            <div
              className={
                GUIDE_INDEX.length === 1
                  ? "mx-auto max-w-lg"
                  : "grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 sm:gap-2.5 md:gap-3"
              }
            >
              {GUIDE_INDEX.map((item) => (
                <GuideCard key={item.key} item={item} />
              ))}
            </div>
          )}
        </div>

        <section
          className="mx-auto mt-10 w-full max-w-4xl rounded-xl border border-slate-200/95 bg-white p-4 shadow-sm sm:mt-12 sm:p-5 md:p-6"
          aria-labelledby="pages-pratiques-heading"
        >
          <h2 id="pages-pratiques-heading" className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
            Pages pratiques (BTP)
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
            Accès direct aux ressources les plus demandées : relances, situations, DICT/DT et suivi.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-2.5">
            {PRATIQUE_LINKS.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="rounded-lg border border-slate-200/95 bg-slate-50/80 px-3 py-2.5 text-xs font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white sm:px-4 sm:py-3 sm:text-sm"
              >
                {r.title} <span className="text-[#1d4ed8]">→</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
