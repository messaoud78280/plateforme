import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import {
  BLOG_ARTICLES,
  BLOG_SLUGS,
  type BlogArticle,
  type BlogBodyBlock,
  type BlogSlug,
} from "@/content/blog-articles";
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

const CALLOUT_STYLES: Record<NonNullable<Extract<BlogBodyBlock, { type: "callout" }>["variant"]>, string> = {
  info: "border-sky-200 bg-sky-50/80 text-sky-950",
  warning: "border-amber-300 bg-amber-50/90 text-amber-950",
  success: "border-emerald-300 bg-emerald-50/90 text-emerald-950",
  highlight: "border-[#1d4ed8]/40 bg-[#eff6ff] text-[#0f172a]",
};

const CALLOUT_TITLE_STYLES: Record<NonNullable<Extract<BlogBodyBlock, { type: "callout" }>["variant"]>, string> = {
  info: "text-sky-900",
  warning: "text-amber-900",
  success: "text-emerald-900",
  highlight: "text-[#1d4ed8]",
};

function DownloadGlyph({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
    </svg>
  );
}

/** Largeur de lecture confortable pour le texte (env. 70 caractères par ligne). */
const PROSE_WRAP = "mx-auto max-w-3xl";

function renderBlock(block: BlogBodyBlock, i: number) {
  switch (block.type) {
    case "h2":
      return (
        <div key={i} className={PROSE_WRAP}>
          <h2 className="mt-14 scroll-mt-24 text-2xl font-bold tracking-tight text-[#0f172a] md:mt-16 md:text-[2rem]">
            {block.content}
          </h2>
        </div>
      );
    case "h3":
      return (
        <div key={i} className={PROSE_WRAP}>
          <h3 className="mt-9 text-xl font-semibold tracking-tight text-[#0f172a] md:text-[1.4rem]">
            {block.content}
          </h3>
        </div>
      );
    case "p":
      return (
        <div key={i} className={PROSE_WRAP}>
          <p className="mt-4 text-[1.05rem] leading-[1.75] text-slate-800 md:text-[1.075rem]">
            {block.content}
          </p>
        </div>
      );
    case "tldr":
      return (
        <aside
          key={i}
          className={`${PROSE_WRAP} mt-10 rounded-2xl border border-[#1d4ed8]/30 bg-gradient-to-br from-[#eff6ff] via-white to-[#eff6ff] p-6 shadow-[0_10px_40px_-22px_rgba(29,78,216,0.45)] md:p-7`}
          aria-label={block.title ?? "L'essentiel"}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
            {block.title ?? "L'essentiel en 30 secondes"}
          </p>
          <ul className="mt-4 space-y-2.5">
            {block.points.map((point, j) => (
              <li key={j} className="flex gap-3 text-[0.97rem] leading-relaxed text-slate-800">
                <span aria-hidden className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </aside>
      );
    case "ul":
      return (
        <div key={i} className={PROSE_WRAP}>
          <ul className="mt-4 space-y-2.5">
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-3 text-[1.02rem] leading-relaxed text-slate-800">
                <span aria-hidden className="mt-2.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "table":
      return (
        <figure
          key={i}
          className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.2)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[0.93rem]">
              <thead className="bg-[#1d4ed8] text-white">
                <tr>
                  {block.headers.map((h, j) => (
                    <th
                      key={j}
                      scope="col"
                      className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide first:pl-6 last:pr-6"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-800">
                {block.rows.map((row, j) => (
                  <tr key={j} className="even:bg-slate-50/60">
                    {row.map((cell, k) => (
                      <td key={k} className="px-4 py-3.5 align-top leading-relaxed first:pl-6 last:pr-6">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption ? (
            <figcaption className="border-t border-slate-100 bg-slate-50/70 px-6 py-3 text-xs italic text-slate-600">
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    case "callout": {
      const variant = block.variant ?? "info";
      return (
        <aside
          key={i}
          className={`${PROSE_WRAP} mt-7 rounded-2xl border-l-4 ${CALLOUT_STYLES[variant]} px-5 py-4 md:px-6 md:py-5`}
          role="note"
        >
          {block.title ? (
            <p className={`text-xs font-bold uppercase tracking-[0.12em] ${CALLOUT_TITLE_STYLES[variant]}`}>
              {block.title}
            </p>
          ) : null}
          <p className="mt-1 text-[1rem] leading-relaxed">{block.content}</p>
        </aside>
      );
    }
    case "quote":
      return (
        <blockquote
          key={i}
          className={`${PROSE_WRAP} mt-8 border-l-4 border-[#1d4ed8] bg-slate-50/70 px-5 py-4 italic text-slate-700`}
        >
          <p>« {block.content} »</p>
          {block.cite ? <cite className="mt-2 block text-sm not-italic text-slate-500">— {block.cite}</cite> : null}
        </blockquote>
      );
    case "downloads":
      return (
        <section
          key={i}
          aria-label={block.title ?? "Téléchargements"}
          className="mt-14 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.25)] md:p-9"
        >
          {block.title ? (
            <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-[1.75rem]">{block.title}</h2>
          ) : null}
          {block.description ? (
            <p className="mt-3 max-w-3xl text-[0.98rem] leading-relaxed text-slate-600">{block.description}</p>
          ) : null}
          <div className="mt-8 space-y-10">
            {block.items.map((item, j) => {
              const isPdfPreview = item.preview === true && item.kind.toUpperCase() === "PDF";
              const previewHeight = item.previewHeight ?? 900;
              return (
                <article
                  key={j}
                  className="overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/40 shadow-sm ring-1 ring-slate-100/80"
                >
                  <header className="flex flex-col gap-5 border-b border-slate-200/80 bg-white px-6 py-6 md:flex-row md:items-start md:justify-between md:gap-8 md:px-8 md:py-7">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="inline-flex items-center rounded-full bg-[#1d4ed8] px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-white">
                          {item.kind}
                        </span>
                        {item.size ? (
                          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.size}</span>
                        ) : null}
                      </div>
                      <h3 className="mt-2.5 text-lg font-bold leading-snug tracking-tight text-[#0f172a] md:text-[1.3rem]">
                        {item.label}
                      </h3>
                      {item.description ? (
                        <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-[0.97rem]">{item.description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 md:shrink-0 md:flex-col md:items-stretch md:gap-2">
                      <a
                        href={item.href}
                        download={item.downloadAs}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e40af] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2"
                      >
                        <DownloadGlyph className="h-4 w-4" />
                        Télécharger
                      </a>
                      {isPdfPreview ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#1d4ed8]/50 hover:text-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2"
                        >
                          Plein écran
                        </a>
                      ) : null}
                    </div>
                  </header>
                  {isPdfPreview ? (
                    <div className="bg-slate-100 p-3 sm:p-4 md:p-5">
                      <iframe
                        src={`${item.href}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                        title={`Aperçu PDF — ${item.label}`}
                        loading="lazy"
                        className="block w-full rounded-xl border border-slate-200 bg-white shadow-sm"
                        style={{ height: `${previewHeight}px` }}
                      />
                      <p className="mt-3 px-1 text-center text-xs text-slate-500">
                        Aperçu intégré · faites défiler pour parcourir les pages, ou cliquez sur « Plein écran » pour ouvrir le PDF complet.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 bg-slate-50/70 px-6 py-6 md:px-8">
                      <span
                        aria-hidden
                        className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h10a2 2 0 002-2V9l-5-6H8a2 2 0 00-2 2v13a2 2 0 002 2z" />
                          <path strokeLinecap="round" d="M13 4v7h7" />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.5 14.25l1.75 2.5 1.75-2.5M14.5 14.25l1.75 2.5 1.75-2.5"
                          />
                        </svg>
                      </span>
                      <p className="text-sm leading-relaxed text-slate-600">
                        Fichier Excel — aperçu non disponible directement dans le navigateur.{" "}
                        <span className="font-semibold text-slate-800">
                          Téléchargez le fichier pour l'ouvrir dans Excel, Numbers ou Google Sheets.
                        </span>
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      );
    case "faq":
      return (
        <section key={i} aria-label={block.title ?? "FAQ"} className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
            {block.title ?? "Foire aux questions"}
          </h2>
          <ul className="mt-6 space-y-3">
            {block.items.map((q, j) => (
              <li
                key={j}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100/80"
              >
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-base font-semibold text-[#0f172a] [&::-webkit-details-marker]:hidden">
                    <span>{q.question}</span>
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-180"
                      aria-hidden
                    >
                      ▾
                    </span>
                  </summary>
                  <div className="border-t border-slate-100 px-5 py-4 text-[0.98rem] leading-relaxed text-slate-700">
                    {q.answer}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      );
    default:
      return null;
  }
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
    "@type": ["BlogPosting", "Article"],
    headline: article.title,
    description: article.description,
    inLanguage: "fr-FR",
    url: pageUrl,
    datePublished: article.publishedTime,
    dateModified,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    author: { "@type": "Organization", name: "BeWork", url: SITE_URL },
    publisher: { "@type": "Organization", name: "BeWork", url: SITE_URL },
    image: [ogImageDefault],
    ...(article.articleSection ? { articleSection: article.articleSection } : {}),
    keywords: article.keywords.join(", "),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
      { "@type": "ListItem", position: 3, name: article.title, item: pageUrl },
    ],
  };

  const faqBlock = article.body.find((b): b is Extract<BlogBodyBlock, { type: "faq" }> => b.type === "faq");
  const faqLd = faqBlock
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqBlock.items.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: { "@type": "Answer", text: q.answer },
        })),
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9]">
      <MarketingSiteHeader plainBg />

      <main className="px-4 py-10 sm:px-6 md:py-16 lg:px-8">
        <article
          className="mx-auto max-w-5xl"
          itemScope
          itemType="https://schema.org/BlogPosting"
        >
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
          />
          {faqLd ? (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
            />
          ) : null}

          <div className="mx-auto max-w-3xl">
            <nav aria-label="Fil d'Ariane" className="text-sm text-slate-500">
              <Link href="/" className="hover:text-[#1d4ed8] hover:underline">
                Accueil
              </Link>
              <span aria-hidden className="mx-2">/</span>
              <Link href="/blog" className="hover:text-[#1d4ed8] hover:underline">
                Blog
              </Link>
              <span aria-hidden className="mx-2">/</span>
              <span className="text-slate-700">{article.articleSection ?? "Article"}</span>
            </nav>

            <header className="mt-6">
              {article.articleSection ? (
                <p className="inline-flex items-center rounded-full bg-[#1d4ed8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1d4ed8]">
                  {article.articleSection}
                </p>
              ) : null}
              <h1
                className="font-heading mt-4 text-balance text-[clamp(1.95rem,4.2vw,3rem)] font-bold leading-[1.12] tracking-tight text-[#0f172a]"
                itemProp="headline"
              >
                {article.title}
              </h1>
              <p className="mt-5 text-base leading-relaxed text-slate-600 md:text-lg">
                {article.description}
              </p>
              <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1d4ed8] text-[0.65rem] font-bold text-white" aria-hidden>
                    BW
                  </span>
                  <span className="font-semibold text-slate-700">BeWork</span>
                </span>
                <span aria-hidden>·</span>
                <time dateTime={article.publishedTime} itemProp="datePublished">
                  Publié le{" "}
                  {new Date(article.publishedTime).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                {article.modifiedTime && article.modifiedTime !== article.publishedTime ? (
                  <>
                    <span aria-hidden>·</span>
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
            </header>
          </div>

          <div className="mt-2" itemProp="articleBody">
            {article.body.map((block, i) => renderBlock(block, i))}
          </div>

          <section
            aria-label="Découvrir BeWork"
            className="mx-auto mt-20 max-w-4xl overflow-hidden rounded-3xl border border-[#1d4ed8]/25 bg-gradient-to-br from-[#eff6ff] via-white to-[#eff6ff] p-7 shadow-[0_18px_50px_-25px_rgba(29,78,216,0.4)] md:p-10"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1d4ed8]">
              Pas le temps de tout piloter vous-même ?
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#0f172a] md:text-[1.75rem]">
              On tient le bureau. Vous tenez le chantier.
            </h2>
            <p className="mt-4 max-w-2xl text-[1rem] leading-relaxed text-slate-700 md:text-[1.05rem]">
              BeWork prend en charge le recalage de planning, le chiffrage des scénarios et la rédaction des notes
              d&apos;impact CCAG. Vous gardez la décision et le pilotage terrain — c&apos;est votre métier. Nous vous
              rendons le temps de la prendre.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e40af] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2"
              >
                Qualifier mon besoin
              </Link>
              <Link
                href="/tarifs"
                className="inline-flex items-center justify-center rounded-lg border-2 border-[#1d4ed8] bg-white px-5 py-3 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#eff6ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2"
              >
                Voir les forfaits
              </Link>
              <Link
                href="/ressources"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#1d4ed8]/40 hover:text-[#1d4ed8]"
              >
                Autres ressources
              </Link>
            </div>
          </section>

          <p className="mt-12 text-center text-sm text-slate-500">
            <Link href="/blog" className="font-medium text-[#1d4ed8] hover:underline">
              ← Retour à tous les articles du blog
            </Link>
          </p>
        </article>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
