import { AssistantTravauxGeoLanding } from "@/components/seo/AssistantTravauxGeoLanding";
import { hreflangAssistantTravauxCluster } from "@/lib/assistant-travaux-geo";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/assistant-travaux-luxembourg";

export const metadata = landingPageMetadataFromPath(PAGE_PATH, {
  hreflangLanguages: hreflangAssistantTravauxCluster(),
});

export default function Page() {
  return <AssistantTravauxGeoLanding geoKey="luxembourg" />;
}
