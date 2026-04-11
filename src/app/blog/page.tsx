import type { Metadata } from "next";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
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
  title: "Blog BeWork — Pilotage administratif BTP, artisans & externalisation",
  description:
    "Articles sur le pilotage administratif des entreprises du bâtiment : facturation chantier, relances, situations de travaux, DICT, délégation et externalisation pour PME et artisans.",
  keywords: [
    "blog administratif BTP",
    "pilotage administratif BTP",
    "conseils artisan bâtiment",
    "externalisation administrative",
    "situation de travaux",
    "facturation chantier",
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
      "Guides pratiques : pilotage administratif chantier, trésorerie, relances, DICT, délégation et externalisation pour dirigeants et artisans.",
    images: [{ url: blogOgImage, width: 1200, height: 630, alt: "Blog BeWork — administratif BTP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog BeWork",
    description: "Articles administratif BTP, artisans et externalisation pour PME.",
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
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
            Blog BeWork
          </h1>
          <p className="mt-4 text-lg text-[#334155]">
            Conseils pour artisans et PME du bâtiment : administratif chantier, trésorerie, délégation et assistant administratif externalisé.
          </p>
          <ul className="mt-12 space-y-8">
            {ARTICLE_INDEX.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/blog/${a.slug}`}
                  className="block rounded-xl surface-metallic-light p-6 transition hover:border-[#1d4ed8]/30 hover:shadow-md"
                >
                  <h2 className="text-xl font-semibold text-[#0f172a]">{a.title}</h2>
                  <p className="mt-1 text-xs text-[#64748b]">
                    {new Date(a.publishedTime).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-2 text-[#334155]">{a.excerpt}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-[#1d4ed8]">
                    Lire l&apos;article →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <footer className="border-t border-[#c8cdd6] bg-[#f8f9fb] px-6 py-12 mt-16">
        <div className="mx-auto max-w-6xl flex flex-col gap-6 md:flex-row md:items-center md:justify-between text-sm text-[#334155]">
          <div className="flex items-center gap-3">
            <BeWorkLogo size="sm" />
            <span className="text-[#0f172a]">© {new Date().getFullYear()} BeWork</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="font-medium hover:text-[#0f172a]">Accueil</Link>
            <Link href="/tarifs" className="font-medium hover:text-[#0f172a]">Tarifs</Link>
            <Link href="/contact" className="font-medium hover:text-[#0f172a]">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
