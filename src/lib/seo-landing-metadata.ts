import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

const defaultOgImage = absoluteUrl("/opengraph-image");

/**
 * Métadonnées homogènes pour les pages vitrine / SEO : canonical, OG, Twitter.
 * Utilise `title.absolute` pour éviter le double suffixe « | BeWork » du layout racine.
 * Pour les expressions cibles (partenaire administratif externalisé, etc.), réutiliser `@/lib/seo-keywords`.
 */
export function landingPageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  /** Hreflang cluster (ex. fr-FR / fr-BE …) ; sinon `fr` + x-default = canonical. */
  hreflangLanguages?: Record<string, string>;
}): Metadata {
  const url = absoluteUrl(opts.path);
  const langMap = opts.hreflangLanguages ?? { fr: url, "x-default": url };

  return {
    title: { absolute: opts.title },
    description: opts.description,
    ...(opts.keywords?.length ? { keywords: opts.keywords } : {}),
    alternates: { canonical: url, languages: langMap },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url,
      siteName: "BeWork",
      title: opts.title,
      description: opts.description,
      images: [{ url: defaultOgImage, width: 1200, height: 630, alt: opts.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      ...(process.env.NEXT_PUBLIC_TWITTER_SITE?.trim()
        ? { site: process.env.NEXT_PUBLIC_TWITTER_SITE.trim() }
        : {}),
      ...(process.env.NEXT_PUBLIC_TWITTER_CREATOR?.trim()
        ? { creator: process.env.NEXT_PUBLIC_TWITTER_CREATOR.trim() }
        : {}),
    },
  };
}
