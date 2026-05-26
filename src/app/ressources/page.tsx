import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { BlueprintRessourcesBackdrop } from "@/components/home/BlueprintCotationDecor";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { ResourcesClickableList } from "@/components/ressources/ResourcesClickableList";
import {
  ResourcesSectionHeader,
  ResourcesThemeCard,
  resourcesBtnPrimary,
  resourcesBtnCompactPdf,
  resourcesBtnSecondary,
  resourcesCardLinkBtn,
  resourcesCardShell,
  resourcesIconWrap,
} from "@/components/ressources/resources-hub-ui";
import { BLOG_ARTICLES, BLOG_SLUGS } from "@/content/blog-articles";
import { CAS_CLIENT_SIMPLE_CASES, CCMI_MARTIN_CASE } from "@/content/cas-clients-catalog";
import { RESOURCE_GUIDE_PAGE_ITEMS, type ResourceGuideBadge } from "@/content/resource-guides-pages";
import { RESOURCE_GUIDE_CATEGORIES } from "@/content/resource-categories";
import { getResourcePdfPublicPath, resourceSlugFromHref } from "@/content/resource-pdf-catalog";
import { RESOURCE_TUTO_ITEMS, type ResourceStatus } from "@/content/resource-tutos";
import { buildResourcesHubCollectionJsonLd } from "@/lib/jsonld-content-marketing";
import {
  SEO_OG_ALTERNATE_LOCALES,
  SEO_OG_LOCALE_PRIMARY,
  hreflangFrancophonieLanguages,
  metaDescriptionFrancophonie,
} from "@/lib/seo-francophonie";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/ressources");
const ogImage = absoluteUrl("/opengraph-image");

type GuideCarouselItem = {
  key: string;
  title: string;
  excerpt: string;
  href: string;
  publishedTime: string;
  badge?: ResourceGuideBadge;
};

type BlogCarouselItem = {
  key: string;
  title: string;
  excerpt: string;
  href: string;
  publishedTime: string;
};

/** Articles de blog publiés (triés du plus récent au plus ancien). Vide tant qu'aucun article n'est ajouté à BLOG_ARTICLES. */
const BLOG_CAROUSEL_ITEMS: BlogCarouselItem[] = [...BLOG_SLUGS]
  .map((slug) => {
    const a = BLOG_ARTICLES[slug];
    return {
      key: `blog:${slug}`,
      title: a.title,
      excerpt: a.excerpt ?? a.description,
      href: `/blog/${slug}`,
      publishedTime: a.publishedTime,
    };
  })
  .sort((x, y) => new Date(y.publishedTime).getTime() - new Date(x.publishedTime).getTime());

/** Guides PDF (articles longs téléchargeables). Section distincte du blog. */
const GUIDE_CAROUSEL_ITEMS: GuideCarouselItem[] = RESOURCE_GUIDE_PAGE_ITEMS.map((g) => ({
  key: `resource:${g.href}`,
  title: g.title,
  excerpt: g.excerpt,
  href: g.href,
  publishedTime: g.publishedTime,
  badge: g.badge ?? ("Guide PDF" as const),
})).sort((x, y) => new Date(y.publishedTime).getTime() - new Date(x.publishedTime).getTime());

const RESSOURCES_META_TITLE = "Ressources BTP : guides, tutos PDF et documents chantier";
const RESSOURCES_META_DESC = metaDescriptionFrancophonie(
  "Guides et tutoriels BTP : CR, DOE, PPSPS, DCE, devis et gestion administrative. PDF gratuits pour conducteurs et artisans",
);

export const metadata: Metadata = {
  title: { absolute: RESSOURCES_META_TITLE },
  description: RESSOURCES_META_DESC,
  alternates: { canonical: pageUrl, languages: hreflangFrancophonieLanguages("/ressources") },
  openGraph: {
    type: "website",
    locale: SEO_OG_LOCALE_PRIMARY,
    alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
    url: pageUrl,
    siteName: "BeWork",
    title: RESSOURCES_META_TITLE,
    description: RESSOURCES_META_DESC,
    images: [{ url: ogImage, width: 1200, height: 630, alt: "BeWork — ressources" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ressources BeWork",
    description: RESSOURCES_META_DESC,
  },
  robots: { index: true, follow: true },
};

const FAQ_ITEMS = [
  {
    q: "Quelle différence entre tutoriels, guides et articles de blog ?",
    a: "Les tutoriels PDF sont des fiches courtes téléchargeables (méthode pas à pas sur une tâche précise — PPSPS, DCE, planning chantier…). Les guides PDF sont des compilations plus longues, à lire ou imprimer. Les articles de blog sont des contenus courts en ligne pour la veille métier, les retours d’expérience et les nouveautés BeWork.",
  },
  {
    q: "Le guide PDF « compte rendu de chantier » est-il gratuit ?",
    a: "Oui. Il est listé parmi les guides et consultable sur sa page dédiée, avec le PDF BeWork et la transcription du guide.",
  },
  {
    q: "Puis-je réserver un appel après lecture des ressources ?",
    a: "Oui — vous pouvez réserver un appel découverte depuis le site ou confier une tâche précise selon vos besoins.",
  },
] as const;

function FaqJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function ResourcesCollectionJsonLd() {
  const schema = buildResourcesHubCollectionJsonLd(RESSOURCES_META_DESC);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function BadgeStatus({ status }: { status: ResourceStatus | "Cas client" | "Guide" | "Guide PDF" | "Article" }) {
  const base =
    "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[0.625rem] font-semibold ring-1 sm:px-2 sm:py-0.5 sm:text-[0.6875rem]";
  const map: Record<string, string> = {
    "Tuto PDF": `${base} bg-teal-50 text-teal-950 ring-teal-200/90`,
    "Guide PDF": `${base} bg-amber-50 text-amber-950 ring-amber-200/90`,
    "Cas client": `${base} bg-amber-50 text-amber-950 ring-amber-200/90`,
    Guide: `${base} bg-violet-50 text-violet-950 ring-violet-200/90`,
    Article: `${base} bg-sky-50 text-sky-950 ring-sky-200/90`,
  };
  return <span className={map[status] ?? map.Guide}>{status}</span>;
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

function GuideGlyph({ className }: { className?: string }) {
  const cn = className ?? "h-4 w-4 text-[#1d4ed8] sm:h-[1.125rem] sm:w-[1.125rem]";
  return (
    <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 21h10a2 2 0 002-2V9l-5-6H8a2 2 0 00-2 2v13a2 2 0 002 2z"
      />
      <path strokeLinecap="round" d="M14 17H9m5-5H9" />
    </svg>
  );
}

function UsersGlyph({ className }: { className?: string }) {
  const cn = className ?? "h-4 w-4 text-[#1d4ed8] sm:h-[1.125rem] sm:w-[1.125rem]";
  return (
    <svg className={cn} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="9.5" cy="8.5" r="2.75" stroke="currentColor" strokeWidth="1.55" />
      <path
        d="M4 20c.9-4.2 4.73-7 11-7 6.05 0 9.93 3.33 11 8"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
    </svg>
  );
}

const RESOURCE_CARD_ROW = "flex items-start gap-3 sm:gap-3.5";

const CARD_STRIPE =
  "pointer-events-none absolute inset-x-4 bottom-0 h-[2px] rounded-t-full bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] opacity-0 transition-opacity duration-300 motion-safe:group-hover/card:opacity-90 sm:inset-x-5";

function ResourceCarouselCard({
  title,
  badge,
  excerpt,
  href,
  cta,
  glyph,
  pdfHref,
  pdfFileName,
}: {
  title: string;
  badge: ResourceStatus | "Cas client" | "Guide" | "Guide PDF" | "Article";
  excerpt: ReactNode;
  href: string;
  cta: string;
  glyph: ReactNode;
  pdfHref?: string;
  pdfFileName?: string;
}) {
  return (
    <article className={resourcesCardShell}>
      <span className={CARD_STRIPE} aria-hidden />
      <div className={RESOURCE_CARD_ROW}>
        <span className={resourcesIconWrap} aria-hidden>
          {glyph}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-heading text-base font-bold leading-snug tracking-tight text-[#0f172a] sm:text-[1.05rem]">
              {title}
            </h3>
            <BadgeStatus status={badge} />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{excerpt}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
        <Link href={href} className={resourcesCardLinkBtn}>
          {cta}
        </Link>
        {pdfHref ? (
          <a href={pdfHref} download={pdfFileName} className={resourcesBtnCompactPdf}>
            Télécharger le PDF
          </a>
        ) : null}
      </div>
    </article>
  );
}

function GuideCarouselCard({ item }: { item: (typeof GUIDE_CAROUSEL_ITEMS)[number] }) {
  const pdfHref = getResourcePdfPublicPath(item.href);
  const pdfFileName = pdfHref?.split("/").pop();
  return (
    <ResourceCarouselCard
      title={item.title}
      badge={item.badge ?? "Guide PDF"}
      excerpt={item.excerpt}
      href={item.href}
      cta="Lire le guide"
      glyph={<GuideGlyph className="h-5 w-5 sm:h-[1.125rem] sm:w-[1.125rem]" />}
      pdfHref={pdfHref}
      pdfFileName={pdfFileName}
    />
  );
}

function BlogArticleCard({ item }: { item: (typeof BLOG_CAROUSEL_ITEMS)[number] }) {
  const dateLabel = new Date(item.publishedTime).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <ResourceCarouselCard
      title={item.title}
      badge="Article"
      excerpt={
        <>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{dateLabel}</span>
          <span className="mt-1 block">{item.excerpt}</span>
        </>
      }
      href={item.href}
      cta="Lire l’article"
      glyph={<GuideGlyph className="h-5 w-5 sm:h-[1.125rem] sm:w-[1.125rem]" />}
    />
  );
}

export default function RessourcesPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9]">
      <BlueprintRessourcesBackdrop className="opacity-[0.55] md:opacity-70" />
      <FaqJsonLd />
      <ResourcesCollectionJsonLd />
      <MarketingSiteHeader plainBg />

      <main className="relative z-10 mx-auto max-w-site px-4 pb-20 pt-6 sm:px-6 md:pb-24 md:pt-10">
        <header className="mx-auto max-w-3xl pb-12 text-center md:pb-16">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#93c5fd]/70 bg-gradient-to-r from-[#eff6ff] via-white to-[#eff6ff] px-4 py-1.5 text-xs font-semibold tracking-tight text-[#2563eb] shadow-[0_8px_28px_-18px_rgba(37,99,235,0.35)] ring-1 ring-white/80 sm:text-sm">
            <ResourceGlyph className="h-4 w-4 shrink-0" />
            Ressources BeWork · BTP
          </p>
          <h1 className="font-heading mt-5 text-balance text-[clamp(1.75rem,4vw,2.65rem)] font-bold leading-[1.15] tracking-tight text-[#0f172a]">
            Tutoriels, guides et{" "}
            <span className="text-[#2563eb]">cas clients</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
            Méthodes PDF, guides terrain et retours d&apos;expérience pour structurer votre administratif chantier — sans jargon inutile.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/ressources/tutos" className={resourcesBtnPrimary}>
              Voir les tutoriels
            </Link>
            <Link href="/ressources/guides" className={resourcesBtnSecondary}>
              Liste des guides
            </Link>
            <Link href="/blog" className={resourcesBtnSecondary}>
              Lire le blog
            </Link>
          </div>
        </header>

        <section
          id="parcours-themes"
          className="scroll-mt-28 border-y border-slate-200/80 bg-white/60 py-12 backdrop-blur-[2px] md:scroll-mt-32 md:py-16"
          aria-labelledby="titre-themes"
        >
          <ResourcesSectionHeader
            id="titre-themes"
            title="Parcourir par thème"
            description="Raccourcis vers gestion de chantier, appels d’offres, sécurité, devis et organisation conducteur de travaux."
          />
          <div className="mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {RESOURCE_GUIDE_CATEGORIES.map((cat) => (
              <ResourcesThemeCard
                key={cat.id}
                id={cat.id}
                title={cat.title}
                description={cat.description}
                links={cat.links}
              />
            ))}
          </div>
        </section>

        {RESOURCE_TUTO_ITEMS.length > 0 ? (
          <section id="tutoriels" className="mt-14 scroll-mt-28 md:mt-16 md:scroll-mt-32" aria-labelledby="titre-tutoriels">
            <ResourcesSectionHeader
              id="titre-tutoriels"
              title="Tutoriels"
              description="PDF et méthodes courtes pour avancer vite sur vos dossiers chantier."
              linkHref="/ressources/tutos"
              linkLabel="Tous les tutoriels →"
            />
            <ResourcesClickableList
              className="mx-auto mt-8 max-w-6xl"
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
          </section>
        ) : null}

        <section id="guides" className="mt-14 scroll-mt-28 md:mt-16 md:scroll-mt-32" aria-labelledby="titre-guides">
          <ResourcesSectionHeader
            id="titre-guides"
            title="Guides"
            description="Guides PDF et articles pour structurer votre administratif chantier (conducteur de travaux, IA & skills)."
            linkHref={GUIDE_CAROUSEL_ITEMS.length > 0 ? "/ressources/guides" : undefined}
            linkLabel={GUIDE_CAROUSEL_ITEMS.length > 0 ? "Tous les guides →" : undefined}
          />
          <div className="mx-auto mt-8 w-full max-w-6xl">
            {GUIDE_CAROUSEL_ITEMS.length > 0 ? (
              <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {GUIDE_CAROUSEL_ITEMS.map((item) => (
                  <GuideCarouselCard key={item.key} item={item} />
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl border border-dashed border-slate-300/90 bg-white/80 px-6 py-12 text-center text-sm leading-relaxed text-slate-600"
                aria-live="polite"
              >
                Aucun guide publié pour l’instant. Les tutoriels ci-dessus restent disponibles ; les guides PDF seront ajoutés ici au fil des mises en ligne.
              </div>
            )}
          </div>
        </section>

        <section id="blog" className="mt-14 scroll-mt-28 md:mt-16 md:scroll-mt-32" aria-labelledby="titre-blog">
          <ResourcesSectionHeader
            id="titre-blog"
            title="Blog"
            description="Articles courts pour le BTP : pilotage administratif, marchés travaux, IA terrain et retours d’expérience BeWork."
            linkHref={BLOG_CAROUSEL_ITEMS.length > 0 ? "/blog" : undefined}
            linkLabel={BLOG_CAROUSEL_ITEMS.length > 0 ? "Tous les articles →" : undefined}
          />
          <div className="mx-auto mt-8 w-full max-w-6xl">
            {BLOG_CAROUSEL_ITEMS.length > 0 ? (
              <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {BLOG_CAROUSEL_ITEMS.slice(0, 6).map((item) => (
                  <BlogArticleCard key={item.key} item={item} />
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl border border-dashed border-slate-300/90 bg-white/80 px-6 py-12 text-center text-sm leading-relaxed text-slate-600"
                aria-live="polite"
              >
                <p className="font-medium text-slate-800">
                  Les premiers articles de blog arrivent prochainement.
                </p>
                <p className="mx-auto mt-2 max-w-xl">
                  En attendant, les tutoriels PDF et les guides ci-dessus couvrent l’essentiel des sujets BTP traités par BeWork
                  (CCTP, DCE, DOE, PPSPS, planning chantier, situations, relances).
                </p>
                <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/ressources/tutos" className={resourcesBtnPrimary}>
                    Voir les tutoriels
                  </Link>
                  <Link href="/ressources/guides" className={resourcesBtnSecondary}>
                    Voir les guides
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="cas-clients" className="mt-14 scroll-mt-28 md:mt-16 md:scroll-mt-32" aria-labelledby="titre-cas">
          <ResourcesSectionHeader
            id="titre-cas"
            title="Cas clients"
            description="Exemples concrets : relances, trésorerie, dossiers chantier."
            linkHref="/cas-clients"
            linkLabel="Page cas clients →"
          />
          <ResourcesClickableList
            className="mx-auto mt-8 max-w-6xl"
            columns={1}
            items={[
              {
                href: CCMI_MARTIN_CASE.href,
                title: CCMI_MARTIN_CASE.cardTitle,
                description: CCMI_MARTIN_CASE.cardSummary,
                badge: <BadgeStatus status="Cas client" />,
                icon: <UsersGlyph className="h-5 w-5 sm:h-[1.125rem] sm:w-[1.125rem]" />,
                openLabel: "Voir le cas client",
              },
              ...CAS_CLIENT_SIMPLE_CASES.map((c) => ({
                href: "/cas-clients",
                title: c.title,
                description: (
                  <>
                    <span className="font-semibold text-slate-700">Après :</span> {c.after}
                  </>
                ),
                badge: <BadgeStatus status="Cas client" />,
                icon: <UsersGlyph className="h-5 w-5 sm:h-[1.125rem] sm:w-[1.125rem]" />,
                openLabel: "Voir les cas clients",
              })),
            ]}
          />
        </section>

        <section className="mx-auto mt-16 max-w-3xl md:mt-20" aria-label="Découvrir BeWork">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 text-center shadow-[0_10px_40px_-14px_rgba(15,23,42,0.1)] ring-1 ring-slate-100/85 sm:p-8 md:p-10">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-[#0f172a]">Besoin d&apos;un relais sur vos dossiers ?</h2>
            <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-slate-600">
              BeWork structure, relance et suit avec vous — vous gardez la validation terrain.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <CalendlyBookingLink className={resourcesBtnPrimary}>Réserver un appel</CalendlyBookingLink>
              <Link href="/dashboard/nouvelle-demande" className={resourcesBtnSecondary}>
                Confier une tâche
              </Link>
            </div>
          </div>
        </section>

        <section aria-label="FAQ" className="mx-auto mt-14 max-w-3xl pb-4 md:mt-16">
          <h2 className="font-heading text-center text-2xl font-bold tracking-tight text-[#0f172a]">Questions fréquentes</h2>
          <ul className="mt-6 space-y-3">
            {FAQ_ITEMS.map((item) => (
              <li key={item.q} className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100/80">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-semibold text-[#0f172a] [&::-webkit-details-marker]:hidden sm:px-5 sm:text-base">
                    {item.q}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-180" aria-hidden>
                      ▾
                    </span>
                  </summary>
                  <div className="border-t border-slate-100 px-4 py-4 text-sm leading-relaxed text-slate-600 sm:px-5">
                    {item.a}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
