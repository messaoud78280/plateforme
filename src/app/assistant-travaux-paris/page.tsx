import { AssistantTravauxVilleLanding } from "@/components/seo/AssistantTravauxVilleLanding";
import { ASSISTANT_TRAVAUX_VILLE_PATHS } from "@/lib/assistant-travaux-villes";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = ASSISTANT_TRAVAUX_VILLE_PATHS.paris;

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

export default function Page() {
  return <AssistantTravauxVilleLanding villeKey="paris" />;
}
