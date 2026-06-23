import { ImageResponse } from "next/og";
import { BLOG_ARTICLES, type BlogSlug } from "@/content/blog-articles";
import { BEWORK_OG_CONTENT_TYPE, BEWORK_OG_SIZE, BeWorkOgLayout } from "@/lib/bework-og-layout";

export const size = BEWORK_OG_SIZE;
export const contentType = BEWORK_OG_CONTENT_TYPE;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return Object.keys(BLOG_ARTICLES).map((slug) => ({ slug }));
}

export default async function BlogOpenGraphImage({ params }: Props) {
  const { slug } = await params;
  const article = BLOG_ARTICLES[slug as BlogSlug];
  const title = article?.title ?? "Blog BeWork — administratif BTP";
  const section = article?.articleSection;

  return new ImageResponse(
    (
      <BeWorkOgLayout
        kicker={section ? `Blog BeWork · ${section}` : "Blog BeWork"}
        title={title}
        subtitle="Assistance technique et administrative BTP — bework.fr"
      />
    ),
    { ...size },
  );
}
