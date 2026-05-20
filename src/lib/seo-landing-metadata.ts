import type { Metadata } from "next";
import {
  SEO_OG_ALTERNATE_LOCALES,
  SEO_OG_LOCALE_PRIMARY,
  hreflangFrancophonieLanguages,
} from "@/lib/seo-francophonie";
import { getPublicPageSeo } from "@/lib/seo-public-pages";
import { SEO_PUBLIC_ROBOTS } from "@/lib/seo-search-engines";
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
  const langMap = opts.hreflangLanguages ?? hreflangFrancophonieLanguages(opts.path);

  return {
    title: { absolute: opts.title },
    description: opts.description,
    ...(opts.keywords?.length ? { keywords: opts.keywords } : {}),
    alternates: { canonical: url, languages: langMap },
    robots: SEO_PUBLIC_ROBOTS,
    openGraph: {
      type: "website",
      locale: SEO_OG_LOCALE_PRIMARY,
      alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
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

/** Métadonnées vitrine depuis le registre central (`seo-public-pages.ts`). */
export function landingPageMetadataFromPath(
  path: string,
  extra?: Pick<Parameters<typeof landingPageMetadata>[0], "hreflangLanguages" | "keywords">
): Metadata {
  const seo = getPublicPageSeo(path);
  if (!seo) {
    throw new Error(`Missing public page SEO config for path: ${path}`);
  }
  return landingPageMetadata({
    title: seo.title,
    description: seo.description,
    path,
    keywords: extra?.keywords ?? seo.keywords,
    hreflangLanguages: extra?.hreflangLanguages ?? seo.hreflangLanguages,
  });
}
