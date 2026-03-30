import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BLOG_ARTICLES, BLOG_SLUGS, type BlogArticle, type BlogSlug } from "@/content/blog-articles";
import { absoluteUrl, SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const raw = BLOG_ARTICLES[slug as BlogSlug];
  if (!raw) return { title: "Article non trouvé | BeWork" };
  const article = raw as BlogArticle;
  const url = absoluteUrl(`/blog/${slug}`);
  const modified = article.modifiedTime ?? article.publishedTime;
  const ogImage = absoluteUrl("/opengraph-image");
  return {
    title: `${article.title} | BeWork Blog`,
    description: article.description,
    keywords: article.keywords,
    alternates: { canonical: url, languages: { fr: url, "x-default": url } },
    openGraph: {
      type: "article",
      locale: "fr_FR",
      url,
      siteName: "BeWork",
      title: article.title,
      description: article.description,
      publishedTime: article.publishedTime,
      modifiedTime: modified,
      images: [{ url: ogImage, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const raw = BLOG_ARTICLES[slug as BlogSlug];
  if (!raw) notFound();
  const article = raw as BlogArticle;

  const pageUrl = absoluteUrl(`/blog/${slug}`);
  const ogImageDefault = absoluteUrl("/opengraph-image");
  const dateModified = article.modifiedTime ?? article.publishedTime;
  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    inLanguage: "fr-FR",
    url: pageUrl,
    datePublished: article.publishedTime,
    dateModified,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    author: {
      "@type": "Organization",
      name: "BeWork",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "BeWork",
      url: SITE_URL,
    },
    image: [ogImageDefault],
    ...(article.articleSection ? { articleSection: article.articleSection } : {}),
    keywords: article.keywords.join(", "),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <MarketingSiteHeader plainBg showBlogLink />

      <main className="px-6 py-16 md:py-24">
        <article className="mx-auto max-w-2xl" itemScope itemType="https://schema.org/BlogPosting">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
          />
          <Link href="/blog" className="text-sm font-medium text-[#1d4ed8] hover:underline">
            ← Retour au blog
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl" itemProp="headline">
            {article.title}
          </h1>
          <p className="mt-3 text-sm text-[#64748b]">
            <time dateTime={article.publishedTime} itemProp="datePublished">
              {new Date(article.publishedTime).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
            {article.modifiedTime && article.modifiedTime !== article.publishedTime ? (
              <>
                {" · "}
                <span className="sr-only">Mis à jour le </span>
                <time dateTime={article.modifiedTime} itemProp="dateModified">
                  mis à jour le{" "}
                  {new Date(article.modifiedTime).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </>
            ) : null}
          </p>
          <div className="mt-12 space-y-6 text-[#334155]">
            {article.body.map((block, i) =>
              block.type === "h2" ? (
                <h2 key={i} className="text-xl font-semibold text-[#0f172a]">
                  {block.content}
                </h2>
              ) : (
                <p key={i} className="leading-relaxed">
                  {block.content}
                </p>
              )
            )}
          </div>
          <div className="mt-12 rounded-xl border-2 border-[#1d4ed8]/30 bg-[#eff6ff] p-8">
            <p className="font-semibold text-[#0f172a]">Structurer votre administratif BTP</p>
            <p className="mt-2 text-[#334155] leading-relaxed">
              Offre Suivi à{" "}
              <span className="tarif-emphase text-[#0f172a]">490</span>{" "}
              <span className="font-semibold text-[#0f172a]">€ TTC / mois</span> — niveau le plus adapté pour une activité
              régulière. Palier d’entrée Structure à 290 € TTC / mois ; Renfort et Pilotage au-delà. Un échange permet de
              vérifier l’adéquation avant tout engagement.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]"
              >
                Demander un cadrage
              </Link>
              <Link
                href="/tarifs"
                className="inline-flex rounded-lg border-2 border-[#1d4ed8] px-6 py-3 font-semibold text-[#1d4ed8] hover:bg-white"
              >
                Voir les forfaits
              </Link>
            </div>
          </div>
        </article>
      </main>

      <footer className="border-t border-[#c8cdd6] bg-[#f8f9fb] px-6 py-12 mt-16">
        <div className="mx-auto max-w-6xl flex flex-col gap-6 md:flex-row md:items-center md:justify-between text-sm text-[#334155]">
          <div className="flex items-center gap-3">
            <BeWorkLogo size="sm" />
            <span className="text-[#0f172a]">© {new Date().getFullYear()} BeWork</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="font-medium hover:text-[#0f172a]">Accueil</Link>
            <Link href="/blog" className="font-medium hover:text-[#0f172a]">Blog</Link>
            <Link href="/contact" className="font-medium hover:text-[#0f172a]">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
