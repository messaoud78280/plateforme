/**
 * Empreinte stable d’un bework_technical_bundle_v1 (réutilise le hash prep).
 */
import { prepBundleFingerprint } from "@/lib/preparation/bundle/fingerprint";

export function technicalBundleFingerprint(
  canonical: Record<string, unknown>,
): string {
  return prepBundleFingerprint(canonical);
}
