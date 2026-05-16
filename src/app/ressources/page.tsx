import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { BlueprintRessourcesBackdrop } from "@/components/home/BlueprintCotationDecor";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { ResourceSpotlightCarousel } from "@/components/ressources/ResourceSpotlightCarousel";
import { BLOG_ARTICLES, BLOG_SLUGS } from "@/content/blog-articles";
import { CAS_CLIENT_CASES } from "@/content/cas-clients-cases";
import { RESOURCE_GUIDE_PAGE_ITEMS, type ResourceGuideBadge } from "@/content/resource-guides-pages";
import { RESOURCE_GUIDE_CATEGORIES } from "@/content/resource-categories";
import { RESOURCE_TUTO_ITEMS, type ResourceTutoItem, type ResourceStatus } from "@/content/resource-tutos";
import { buildResourcesHubCollectionJsonLd } from "@/lib/jsonld-content-marketing";
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

const GUIDE_CAROUSEL_ITEMS: GuideCarouselItem[] = [
  ...[...BLOG_SLUGS].map((slug) => {
    const a = BLOG_ARTICLES[slug];
    return {
      key: `blog:${slug}`,
      title: a.title,
      excerpt: a.excerpt ?? a.description,
      href: `/blog/${slug}`,
      publishedTime: a.publishedTime,
    };
  }),
  ...RESOURCE_GUIDE_PAGE_ITEMS.map((g) => ({
    key: `resource:${g.href}`,
    title: g.title,
    excerpt: g.excerpt,
    href: g.href,
    publishedTime: g.publishedTime,
    badge: g.badge ?? ("Guide PDF" as const),
  })),
].sort((x, y) => new Date(y.publishedTime).getTime() - new Date(x.publishedTime).getTime());

const RESSOURCES_META_DESC =
  "Hub ressources BeWork : tutoriels PDF gratuits, guides administratif BTP et retours d’expérience pour entreprises du bâtiment.";

export const metadata: Metadata = {
  title: "Ressources BeWork — Tutoriels, guides & cas clients",
  description: RESSOURCES_META_DESC,
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Ressources BeWork — Tutoriels, guides & cas clients",
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
    q: "Quelle différence entre un tutoriel PDF et un guide (article blog) ?",
    a: "Les tutoriels PDF sont des fiches téléchargeables, étape par étape, sur une tâche précise (PPSPS, DCE…). Les guides longs (articles) seront de nouveau proposés via le blog lorsque le catalogue sera enrichi ; pour l’instant, l’essentiel passe par les tutoriels et le hub ressources.",
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

function BadgeStatus({ status }: { status: ResourceStatus | "Cas client" | "Guide" | "Guide PDF" }) {
  const base =
    "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[0.625rem] font-semibold ring-1 sm:px-2 sm:py-0.5 sm:text-[0.6875rem]";
  const map: Record<string, string> = {
    "Tuto PDF": `${base} bg-teal-50 text-teal-950 ring-teal-200/90`,
    "Guide PDF": `${base} bg-amber-50 text-amber-950 ring-amber-200/90`,
    "Cas client": `${base} bg-amber-50 text-amber-950 ring-amber-200/90`,
    Guide: `${base} bg-violet-50 text-violet-950 ring-violet-200/90`,
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

const RESOURCE_CARD_SHELL =
  "flex h-full flex-col rounded-xl border border-slate-200/95 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-sm p-3 sm:p-3.5";

const RESOURCE_ICON_WRAP =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] ring-1 ring-blue-100 sm:h-9 sm:w-9";

const RESOURCE_CARD_ROW = "flex items-start gap-2.5 sm:gap-3";

const RESOURCE_LINK_BTN =
  "inline-flex min-h-[2.25rem] w-full items-center justify-center rounded-lg bg-[#1d4ed8] px-3 text-xs font-semibold text-white shadow-sm shadow-[#1d4ed8]/18 transition hover:bg-[#1e40af] sm:w-auto sm:min-h-[2.375rem] sm:px-4 sm:text-sm";

function TutoResourceCard({ item }: { item: ResourceTutoItem }) {
  return (
    <article className={RESOURCE_CARD_SHELL}>
      <div className={RESOURCE_CARD_ROW}>
        <span className={RESOURCE_ICON_WRAP} aria-hidden>
          <ResourceGlyph />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <h3 className="text-[0.8125rem] font-bold leading-snug tracking-tight text-slate-900 sm:text-sm">
              {item.title}
            </h3>
            <BadgeStatus status={item.status} />
          </div>
          <p className="mt-1 text-[0.75rem] leading-snug text-slate-600 sm:mt-1.5 sm:text-[0.8125rem] sm:leading-relaxed">{item.desc}</p>
        </div>
      </div>
      <div className="mt-2.5 sm:mt-3">
        <Link href={item.href} className={RESOURCE_LINK_BTN}>
          Ouvrir le tutoriel
        </Link>
      </div>
    </article>
  );
}

function GuideCarouselCard({ item }: { item: (typeof GUIDE_CAROUSEL_ITEMS)[number] }) {
  return (
    <article className={RESOURCE_CARD_SHELL}>
      <div className={RESOURCE_CARD_ROW}>
        <span className={RESOURCE_ICON_WRAP} aria-hidden>
          <GuideGlyph />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <h3 className="text-[0.8125rem] font-bold leading-snug tracking-tight text-slate-900 sm:text-sm">{item.title}</h3>
            <BadgeStatus status={item.badge ?? "Guide PDF"} />
          </div>
          <p className="mt-1 text-[0.75rem] leading-snug text-slate-600 sm:mt-1.5 sm:text-[0.8125rem] sm:leading-relaxed">{item.excerpt}</p>
        </div>
      </div>
      <div className="mt-2.5 sm:mt-3">
        <Link href={item.href} className={RESOURCE_LINK_BTN}>
          Lire le guide
        </Link>
      </div>
    </article>
  );
}

function CaseCarouselCard({ cas }: { cas: (typeof CAS_CLIENT_CASES)[number] }) {
  return (
    <article className={RESOURCE_CARD_SHELL}>
      <div className={RESOURCE_CARD_ROW}>
        <span className={RESOURCE_ICON_WRAP} aria-hidden>
          <UsersGlyph />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <h3 className="text-[0.8125rem] font-bold leading-snug text-slate-900 sm:text-sm">{cas.title}</h3>
            <BadgeStatus status="Cas client" />
          </div>
          <p className="mt-1 text-[0.75rem] leading-snug text-slate-600 sm:mt-1.5 sm:text-[0.8125rem] sm:leading-relaxed">
            <span className="font-semibold text-slate-700">Après :</span> {cas.after}
          </p>
        </div>
      </div>
      <div className="mt-2.5 sm:mt-3">
        <Link href="/cas-clients" className={RESOURCE_LINK_BTN}>
          Voir les cas clients
        </Link>
      </div>
    </article>
  );
}

export default function RessourcesPage() {
  return (
    <div className="relative min-h-screen bg-[#f8fafc]">
      <BlueprintRessourcesBackdrop />
      <FaqJsonLd />
      <ResourcesCollectionJsonLd />
      <MarketingSiteHeader plainBg />

      <main className="relative z-10 mx-auto max-w-site px-4 pb-16 pt-10 sm:px-6 md:pb-20 md:pt-14">
        <header className="border-b border-slate-200/90 pb-8 md:pb-10">
          <div className="max-w-xl text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">Ressources BeWork</p>
            <h1 className="mt-2 text-balance text-2xl font-bold tracking-tight text-black md:text-3xl lg:text-[2rem] lg:leading-tight">
              Tutoriels, guides et cas clients
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 md:mt-3.5 md:text-[0.9375rem] md:leading-relaxed">
              Une entrée unique pour parcourir nos tutoriels PDF, les guides blog (administratif BTP) et des exemples de missions côté terrain et bureau.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                href="/ressources/tutos"
                className="inline-flex min-h-9 w-full items-center justify-center rounded-lg bg-[#1d4ed8] px-4 text-sm font-semibold text-white shadow-sm shadow-[#1d4ed8]/18 transition hover:bg-[#1e40af] sm:w-auto sm:min-h-10 sm:px-5"
              >
                Voir les tutoriels
              </Link>
              <Link
                href="/ressources/guides"
                className="inline-flex min-h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto sm:min-h-10 sm:px-5"
              >
                Liste des guides
              </Link>
              <CalendlyBookingLink className="inline-flex min-h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto sm:min-h-10 sm:px-5">
                Réserver un appel
              </CalendlyBookingLink>
            </div>
          </div>
        </header>

        <section
          id="parcours-themes"
          className="mt-10 scroll-mt-24 border-t border-slate-200/90 pt-10 md:scroll-mt-28 md:pt-12"
          aria-labelledby="titre-themes"
        >
          <h2 id="titre-themes" className="text-lg font-bold tracking-tight text-black sm:text-xl">
            Parcourir par thème
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-snug text-slate-600 sm:text-sm sm:leading-relaxed">
            Raccourcis éditoriaux vers les hubs utiles (gestion de chantier, appels d’offres, sécurité, devis…). Les guides longs restent listés ci‑dessous et sur la page Guides.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RESOURCE_GUIDE_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="rounded-xl border border-slate-200/95 bg-white p-4 shadow-sm ring-1 ring-slate-100/80"
              >
                <h3 className="text-sm font-bold text-slate-900">{cat.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{cat.description}</p>
                <ul className="mt-3 space-y-1.5 text-xs font-medium sm:text-[0.8125rem]">
                  {cat.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[#1d4ed8] underline-offset-2 hover:underline">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {RESOURCE_TUTO_ITEMS.length > 0 ? (
          <section
            id="tutoriels"
            className="mt-10 scroll-mt-24 md:scroll-mt-28"
            aria-labelledby="titre-tutoriels"
          >
            <div className="max-w-xl text-left">
              <h2 id="titre-tutoriels" className="text-lg font-bold tracking-tight text-black sm:text-xl">
                Tutoriels
              </h2>
              <p className="mt-1 text-xs leading-snug text-slate-600 sm:text-sm sm:leading-relaxed">
                PDF et méthodes courtes pour avancer vite sur vos dossiers chantier.
              </p>
              <Link
                href="/ressources/tutos"
                className="mt-2 inline-flex text-xs font-semibold text-[#1d4ed8] underline-offset-4 hover:underline sm:mt-2.5 sm:text-sm"
              >
                Tous les tutoriels →
              </Link>
            </div>
            <div className="mt-4 w-full max-w-[min(100%,72rem)]">
              <ResourceSpotlightCarousel
                slidesPerView={2}
                dotListAriaLabel="Choisir une page de tutoriels"
                prevAriaLabel="Page précédente"
                nextAriaLabel="Page suivante"
              >
                {RESOURCE_TUTO_ITEMS.map((item) => (
                  <TutoResourceCard key={item.href} item={item} />
                ))}
              </ResourceSpotlightCarousel>
            </div>
          </section>
        ) : null}

        <section id="guides" className="mt-10 scroll-mt-24 md:scroll-mt-28" aria-labelledby="titre-guides">
          <div className="max-w-xl text-left">
            <h2 id="titre-guides" className="text-lg font-bold tracking-tight text-black sm:text-xl">
              Guides
            </h2>
            <p className="mt-1 text-xs leading-snug text-slate-600 sm:text-sm sm:leading-relaxed">
              Guides PDF (compilation conducteur de travaux, IA &amp; skills Claude) pour structurer votre administratif chantier.
            </p>
            {GUIDE_CAROUSEL_ITEMS.length > 0 ? (
              <Link
                href="/ressources/guides"
                className="mt-2 inline-flex text-xs font-semibold text-[#1d4ed8] underline-offset-4 hover:underline sm:mt-2.5 sm:text-sm"
              >
                Tous les guides →
              </Link>
            ) : (
              <p className="mt-2 text-xs text-slate-500 sm:text-sm">Catalogue vide pour le moment.</p>
            )}
          </div>
          <div className="mt-4 w-full max-w-[min(100%,72rem)]">
            {GUIDE_CAROUSEL_ITEMS.length > 0 ? (
              <div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {GUIDE_CAROUSEL_ITEMS.map((item) => (
                  <GuideCarouselCard key={item.key} item={item} />
                ))}
              </div>
            ) : (
              <div
                className="rounded-xl border border-dashed border-slate-300/95 bg-slate-50/80 px-4 py-10 text-center text-sm leading-relaxed text-slate-600 sm:px-6"
                aria-live="polite"
              >
                Aucun guide publié pour l’instant. Les tutoriels ci-dessus restent disponibles ; les guides PDF seront
                ajoutés ici au fil des mises en ligne.
              </div>
            )}
          </div>
        </section>

        <section id="cas-clients" className="mt-10 scroll-mt-24 md:mt-12 md:scroll-mt-28" aria-labelledby="titre-cas">
          <div className="max-w-xl text-left">
            <h2 id="titre-cas" className="text-lg font-bold tracking-tight text-black sm:text-xl">
              Cas clients
            </h2>
            <p className="mt-1 text-xs leading-snug text-slate-600 sm:text-sm sm:leading-relaxed">
              Exemples de problématiques traitées : relances, trésorerie, dossiers chantier.
            </p>
            <Link
              href="/cas-clients"
              className="mt-2 inline-flex text-xs font-semibold text-[#1d4ed8] underline-offset-4 hover:underline sm:mt-2.5 sm:text-sm"
            >
              Page cas clients →
            </Link>
          </div>
          <div className="mt-4 w-full max-w-[min(100%,72rem)]">
            <ResourceSpotlightCarousel
              slidesPerView={2}
              dotListAriaLabel="Choisir une page de cas clients"
              prevAriaLabel="Page précédente"
              nextAriaLabel="Page suivante"
            >
              {CAS_CLIENT_CASES.map((c) => (
                <CaseCarouselCard key={c.title} cas={c} />
              ))}
            </ResourceSpotlightCarousel>
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-none md:mt-16" aria-label="Découvrir BeWork">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm sm:p-5 md:p-6">
            <h2 className="text-lg font-bold tracking-tight text-black sm:text-xl">Besoin d&apos;un relais sur vos dossiers ?</h2>
            <p className="mt-2 max-w-xl text-xs leading-snug text-slate-600 sm:text-sm sm:leading-relaxed">
              BeWork peut structurer, relancer et suivre avec vous — vous gardez la validation terrain.
            </p>
            <div className="mt-4 flex max-w-sm flex-col gap-2">
              <CalendlyBookingLink className="inline-flex min-h-9 items-center justify-center rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#1d4ed8]/18 hover:bg-[#1e40af]">
                Réserver un appel
              </CalendlyBookingLink>
              <Link
                href="/dashboard/nouvelle-demande"
                className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#1d4ed8]/35 bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1e3a8a] hover:bg-[#dbeafe]"
              >
                Confier une tâche
              </Link>
            </div>
          </div>
        </section>

        <section aria-label="FAQ" className="mx-auto mt-10 max-w-none pb-8 md:mt-14">
          <h2 className="text-left text-lg font-bold text-black sm:text-xl">Questions fréquentes</h2>
          <ul className="mt-4 space-y-2">
            {FAQ_ITEMS.map((item) => (
              <li key={item.q} className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-3 text-sm font-semibold text-black [&::-webkit-details-marker]:hidden sm:px-4">
                    {item.q}
                    <span className="shrink-0 text-slate-500 group-open:rotate-180" aria-hidden>
                      ▾
                    </span>
                  </summary>
                  <div className="border-t border-slate-100 px-3 py-3 text-xs leading-relaxed text-slate-600 sm:px-4 sm:text-sm">
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
