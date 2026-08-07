import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { SERVICE_PAGES, SERVICE_PAGE_ORDER } from "@/content/service-pages";
import { buildServicesHubItemListJsonLd } from "@/lib/jsonld-content-marketing";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import {
  SEO_OG_ALTERNATE_LOCALES,
  SEO_OG_LOCALE_PRIMARY,
  hreflangFrancophonieLanguages,
  metaDescriptionFrancophonie,
} from "@/lib/seo-francophonie";
import { absoluteUrl } from "@/lib/site";

const path = "/services";
const url = absoluteUrl(path);
const title = "Capacités BeWork — plateforme interne BTP et outils IA métier";
const description = metaDescriptionFrancophonie(
  "Hub BeWork : modules plateforme (DCE, CR, PPSPS, DOE, marchés). Vos équipes utilisent ; BeWork configure et fait évoluer",
);

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url, languages: hreflangFrancophonieLanguages(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: SEO_OG_LOCALE_PRIMARY,
    alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
    url,
    siteName: "BeWork",
    title,
    description,
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

const jsonLd = buildWebPageAndBreadcrumbJsonLd({
  pagePath: path,
  h1: "Capacités de la plateforme BeWork",
  description,
  breadcrumbItems: [
    { name: "Accueil", href: "/" },
    { name: "Services", href: path },
  ],
});

const itemListLd = buildServicesHubItemListJsonLd(SERVICE_PAGE_ORDER);

export default function ServicesHubPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <MarketingSiteHeader plainBg />
      <main className="mx-auto max-w-site px-6 py-14 md:py-20">
        <article className="mx-auto max-w-3xl">
          <nav className="mb-6 text-sm text-slate-600" aria-label="Fil d’Ariane">
            <ol className="flex flex-wrap gap-2">
              <li>
                <Link href="/" className="font-medium text-[#1d4ed8] hover:underline">
                  Accueil
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="font-medium text-slate-900">Services</li>
            </ol>
          </nav>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-black md:text-[2.35rem]">Capacités de la plateforme BeWork</h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-700">
            Chaque page présente une capacité métier de la plateforme (module, workflow ou outil IA) et renvoie vers les
            ressources détaillées. BeWork est un{" "}
            <strong>éditeur de plateformes internes BTP</strong> pour entreprises en France, Belgique, Suisse et
            Luxembourg.
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">En résumé :</span> vos équipes utilisent la plateforme au
            quotidien ; BeWork configure, forme et fait évoluer l&apos;environnement.{" "}
            <Link href="/promoteurs-immobiliers" className="font-semibold text-[#1d4ed8] hover:underline">
              Promoteurs immobiliers
            </Link>{" "}
            : suivi documentaire, relances, réserves et DOE dans un environnement adapté à vos opérations.
          </p>

          <ul className="mt-12 grid gap-4 sm:grid-cols-2">
            {SERVICE_PAGE_ORDER.map((slug) => {
              const p = SERVICE_PAGES[slug];
              return (
                <li key={slug}>
                  <Link
                    href={`/services/${slug}`}
                    className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
                  >
                    <span className="text-sm font-bold text-[#1d4ed8]">Capacité</span>
                    <span className="mt-2 text-base font-semibold leading-snug text-slate-900">{p.h1}</span>
                    <span className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{p.intro}</span>
                    <span className="mt-4 text-sm font-semibold text-[#1d4ed8]">Lire la page →</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-base font-semibold text-slate-900">Passer à l’action</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Mise en place et abonnement sur étude. Demandez une démonstration pour composer votre plateforme.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CalendlyBookingLink className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#1d4ed8] px-5 text-sm font-semibold text-white hover:bg-[#1e40af]">
                Demander une démonstration
              </CalendlyBookingLink>
              <Link
                href="/tarifs"
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Voir les tarifs
              </Link>
              <Link
                href="/assistants-administratifs-taches"
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Catalogue des missions
              </Link>
            </div>
          </div>
        </article>
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
