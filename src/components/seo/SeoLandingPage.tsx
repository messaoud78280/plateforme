import type { ReactNode } from "react";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";

type SeoLandingPageProps = {
  /** Résumé pour le JSON-LD WebPage (aligné sur la meta description) */
  description: string;
  h1: string;
  intro: ReactNode;
  children: ReactNode;
  /** Fil d’Ariane + JSON-LD WebPage / BreadcrumbList (dernier segment = page courante) */
  breadcrumbItems?: { name: string; href: string }[];
};

export function SeoLandingPage({ description, h1, intro, children, breadcrumbItems }: SeoLandingPageProps) {
  const lastPath = breadcrumbItems?.length ? breadcrumbItems[breadcrumbItems.length - 1]?.href : undefined;
  const structuredData =
    breadcrumbItems?.length && lastPath
      ? buildWebPageAndBreadcrumbJsonLd({
          pagePath: lastPath,
          h1,
          description,
          breadcrumbItems,
        })
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      {structuredData ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      ) : null}
      <MarketingSiteHeader plainBg />

      <main className="px-6 py-16 md:py-24">
        <article className="mx-auto max-w-3xl">
          {breadcrumbItems?.length ? (
            <nav className="mb-6 text-sm text-[#64748b]" aria-label="Fil d’Ariane">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {breadcrumbItems.map((item, i) => (
                  <li key={`${item.href}-${item.name}`} className="flex items-center gap-2">
                    {i > 0 ? <span aria-hidden className="text-[#94a3b8]">/</span> : null}
                    {i < breadcrumbItems.length - 1 ? (
                      <Link href={item.href} className="font-medium text-[#475569] hover:text-[#1d4ed8]">
                        {item.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-[#334155]">{item.name}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">{h1}</h1>
          <p className="mt-6 text-lg leading-relaxed text-[#334155]">{intro}</p>
          <div className="mt-12 prose prose-slate max-w-none prose-headings:text-[#0f172a] prose-p:text-[#334155]">
            {children}
          </div>
          <div className="mt-12 rounded-xl border-2 border-[#1d4ed8]/30 bg-[#eff6ff] p-8">
            <h2 className="text-xl font-bold text-[#0f172a]">Vérifier l’adéquation avec votre charge</h2>
            <p className="mt-3 text-[#334155]">
              BeWork intervient pour le BTP et les PME exigeantes en France, Belgique, Suisse et Luxembourg — forfaits TTC
              cadrés par volume.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link href="/contact" className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]">
                Échanger sur votre besoin
              </Link>
              <Link href="/tarifs" className="inline-flex rounded-lg border-2 border-[#1d4ed8] px-6 py-3 font-semibold text-[#1d4ed8] hover:bg-[#eff6ff]">
                Consulter les forfaits
              </Link>
              <Link href="/inscription" className="surface-metallic-outline inline-flex rounded-lg px-6 py-3 font-semibold text-[#334155] hover:text-[#1d4ed8]">
                Accès client
              </Link>
            </div>
          </div>
        </article>
      </main>

      <footer className="border-t border-[#c8cdd6] bg-[#f8f9fb] px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-[#334155] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <BeWorkLogo size="sm" />
              <span className="text-[#0f172a]">© {new Date().getFullYear()} BeWork</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/" className="font-medium hover:text-[#0f172a]">Accueil</Link>
            <Link href="/notre-facon-de-travailler" className="font-medium hover:text-[#0f172a]">Méthode</Link>
            <Link href="/blog" className="font-medium hover:text-[#0f172a]">Blog</Link>
            <Link href="/cas-clients" className="font-medium hover:text-[#0f172a]">Cas clients</Link>
            <Link href="/tarifs" className="font-medium hover:text-[#0f172a]">Tarifs</Link>
            <Link href="/contact" className="font-medium hover:text-[#0f172a]">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
