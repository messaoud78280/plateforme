import { ImageResponse } from "next/og";
import { BEWORK_OG_CONTENT_TYPE, BEWORK_OG_SIZE, BeWorkOgLayout } from "@/lib/bework-og-layout";

export const alt =
  "BeWork — Assistance technique et administrative BTP pour chantiers, appels d'offres et marchés publics";
export const size = BEWORK_OG_SIZE;
export const contentType = BEWORK_OG_CONTENT_TYPE;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <BeWorkOgLayout
        title="Assistants travaux augmentés par l'IA"
        subtitle="Analyse DCE · appels d'offres · Chorus Pro · DOE · suivi chantier — validation chez vous"
      />
    ),
    { ...size },
  );
}
