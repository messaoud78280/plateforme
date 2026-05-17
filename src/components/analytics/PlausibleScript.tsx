import Script from "next/script";
import { isPlausibleEnabled, PLAUSIBLE_INIT_INLINE, PLAUSIBLE_SCRIPT_SRC } from "@/lib/plausible";

/** Script Plausible du projet (URL personnalisée + init). */
export function PlausibleScript() {
  if (!isPlausibleEnabled()) return null;

  return (
    <>
      <Script async src={PLAUSIBLE_SCRIPT_SRC} strategy="afterInteractive" />
      <Script id="plausible-init" strategy="afterInteractive">
        {PLAUSIBLE_INIT_INLINE}
      </Script>
    </>
  );
}
