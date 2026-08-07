import { ImageResponse } from "next/og";
import { BEWORK_OG_CONTENT_TYPE, BEWORK_OG_SIZE, BeWorkOgLayout } from "@/lib/bework-og-layout";

export const alt =
  "BeWork — Plateformes internes intelligentes pour les entreprises du BTP";
export const size = BEWORK_OG_SIZE;
export const contentType = BEWORK_OG_CONTENT_TYPE;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <BeWorkOgLayout
        title="Plateformes internes avec IA pour le BTP"
        subtitle="Socle BeWork · modules adaptés · formation · évolution continue"
      />
    ),
    { ...size },
  );
}
