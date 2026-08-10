import { ImageResponse } from "next/og";
import { BEWORK_OG_CONTENT_TYPE, BEWORK_OG_SIZE, BeWorkOgLayout } from "@/lib/bework-og-layout";
import { BEWORK_BRAND_SIGNATURE, BEWORK_TECH_AROUND_YOU } from "@/lib/seo-keywords";

export const alt = `BeWork — ${BEWORK_BRAND_SIGNATURE}`;
export const size = BEWORK_OG_SIZE;
export const contentType = BEWORK_OG_CONTENT_TYPE;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <BeWorkOgLayout
        title={BEWORK_BRAND_SIGNATURE}
        subtitle={BEWORK_TECH_AROUND_YOU}
      />
    ),
    { ...size },
  );
}
