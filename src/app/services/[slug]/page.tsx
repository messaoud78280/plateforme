import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageBody } from "@/components/marketing/ServicePageBody";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { SERVICE_PAGES, SERVICE_PAGE_ORDER, isServicePageSlug, servicePagePath } from "@/content/service-pages";
import { absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SERVICE_PAGE_ORDER.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isServicePageSlug(slug)) return {};
  const d = SERVICE_PAGES[slug];
  const url = absoluteUrl(servicePagePath(slug));
  return {
    title: { absolute: d.metaTitle },
    description: d.metaDescription,
    alternates: { canonical: url, languages: { fr: url, "x-default": url } },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url,
      siteName: "BeWork",
      title: d.metaTitle,
      description: d.metaDescription,
      images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: d.h1 }],
    },
    twitter: {
      card: "summary_large_image",
      title: d.metaTitle,
      description: d.metaDescription,
    },
  };
}

function faqJsonLd(faq: { q: string; a: string }[], pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
    url: pageUrl,
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  if (!isServicePageSlug(slug)) notFound();
  const d = SERVICE_PAGES[slug];
  const path = servicePagePath(slug);
  const pageUrl = absoluteUrl(path);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(d.faq, pageUrl)) }}
      />
      <SeoLandingPage
        description={d.metaDescription}
        h1={d.h1}
        intro={d.intro}
        breadcrumbItems={[
          { name: "Accueil", href: "/" },
          { name: "Services", href: "/services" },
          { name: d.h1, href: path },
        ]}
      >
        <ServicePageBody definition={d} />
      </SeoLandingPage>
    </>
  );
}
