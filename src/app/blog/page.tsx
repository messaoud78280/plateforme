import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BLOG_ARTICLES, BLOG_SLUGS, type BlogSlug } from "@/content/blog-articles";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const blogUrl = absoluteUrl("/blog");
const blogOgImage = absoluteUrl("/opengraph-image");

const ARTICLE_INDEX: { slug: BlogSlug; title: string; excerpt: string; publishedTime: string }[] = [...BLOG_SLUGS]
  .map((slug) => {
    const a = BLOG_ARTICLES[slug];
    return {
      slug,
      title: a.title,
      excerpt: a.excerpt ?? a.description,
      publishedTime: a.publishedTime,
    };
  })
  .sort((x, y) => new Date(y.publishedTime).getTime() - new Date(x.publishedTime).getTime());

export const metadata: Metadata = {
  title: { absolute: "Blog BTP : assistant travaux et gestion chantier | BeWork" },
  description:
    "Articles BeWork sur l’assistant travaux BTP, la gestion administrative chantier, les relances, le DCE et l’externalisation bureau-chantier.",
  keywords: [
    "blog administratif BTP",
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
  alternates: { canonical: blogUrl, languages: { fr: blogUrl, "x-default": blogUrl } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: blogUrl,
    siteName: "BeWork",
    title: "Blog BeWork — Pilotage administratif & BTP",
    description:
      "Blog BeWork : articles sur administratif chantier, relances, DICT et externalisation pour artisans et PME du bâtiment.",
    images: [{ url: blogOgImage, width: 1200, height: 630, alt: "Blog BeWork — administratif BTP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog BeWork",
    description:
      "Blog BeWork : articles sur administratif chantier, relances, DICT et externalisation pour artisans et PME du bâtiment.",
  },
  robots: { index: true, follow: true },
};

export default function BlogPage() {
  const blogListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Blog BeWork",
    description: "Articles sur l'administratif externalisé, le BTP et la délégation.",
    numberOfItems: ARTICLE_INDEX.length,
    itemListElement: ARTICLE_INDEX.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/blog/${a.slug}`),
      name: a.title,
    })),
  };

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog BeWork",
    url: blogUrl,
    inLanguage: "fr-FR",
    publisher: { "@type": "Organization", name: "BeWork", url: SITE_URL },
    blogPost: ARTICLE_INDEX.map((a) => ({
      "@type": "BlogPosting",
      headline: a.title,
      url: absoluteUrl(`/blog/${a.slug}`),
      datePublished: a.publishedTime,
    })),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <MarketingSiteHeader plainBg />

      <main className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
            Blog BeWork
          </h1>
          <p className="mt-4 text-lg text-black">
            Conseils pour artisans et PME du bâtiment : administratif chantier, trésorerie, délégation et assistant administratif externalisé.
          </p>
          {ARTICLE_INDEX.length === 0 ? (
            <div className="mt-12 rounded-xl border border-[#dce3ec] bg-white/70 p-6 text-black md:p-8">
              <p className="font-medium">
                Les articles sont en cours de refonte&nbsp;: en attendant, parcourez les tutoriels PDF et les fiches métier depuis le hub
                ressources.
              </p>
              <Link
                href="/ressources"
                className="mt-4 inline-flex text-sm font-semibold text-[#1d4ed8] underline-offset-4 hover:underline"
              >
                Hub ressources BeWork →
              </Link>
            </div>
          ) : (
            <ul className="mt-12 space-y-8">
              {ARTICLE_INDEX.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/blog/${a.slug}`}
                    className="block rounded-xl surface-metallic-light p-6 transition hover:border-[#1d4ed8]/30 hover:shadow-md"
                  >
                    <h2 className="text-xl font-semibold text-black">{a.title}</h2>
                    <p className="mt-1 text-xs text-black">
                      {new Date(a.publishedTime).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-2 text-black">{a.excerpt}</p>
                    <span className="mt-4 inline-flex items-center text-sm font-medium text-[#1d4ed8]">
                      Lire l&apos;article →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <section className="mt-14 rounded-2xl border border-[#dce3ec] bg-white/60 p-7">
            <h2 className="text-lg font-semibold text-black">Pages pratiques (BTP)</h2>
            <p className="mt-2 text-sm leading-relaxed text-black">
              Accès direct aux ressources les plus demandées : relances, situations, DICT/DT et suivi.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { title: "Relance devis BTP", href: "/relance-devis-btp" },
                { title: "Impayés & relances", href: "/impayes-btp-relances" },
                { title: "Situation de travaux", href: "/situation-travaux-btp" },
                { title: "DICT / DT", href: "/dict-dt-travaux" },
              ].map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="rounded-xl surface-metallic-light p-4 font-medium text-black transition hover:shadow-sm"
                >
                  {r.title} <span className="text-[#1d4ed8]">→</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
