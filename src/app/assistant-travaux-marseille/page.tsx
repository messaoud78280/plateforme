import { AssistantTravauxVilleLanding } from "@/components/seo/AssistantTravauxVilleLanding";
import { ASSISTANT_TRAVAUX_VILLE_PATHS } from "@/lib/assistant-travaux-villes";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

export const metadata = landingPageMetadataFromPath(ASSISTANT_TRAVAUX_VILLE_PATHS.marseille);

export default function Page() {
  return <AssistantTravauxVilleLanding villeKey="marseille" />;
}
