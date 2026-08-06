"use client";

import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { CTA_PRIMARY } from "@/components/marketing/marketingCtaStyles";

export function StickyCtaMobile() {
  return (
    <div
      className="surface-metallic-sticky-bar fixed bottom-0 left-0 right-0 z-30 px-4 py-3 md:hidden"
      role="banner"
      aria-label="Appel à l'action"
    >
      <CalendlyBookingLink
        trackLocation="tarifs-sticky-mobile"
        className={`${CTA_PRIMARY} w-full`}
        aria-label="Demander une démonstration BeWork"
      >
        Demander une démo
      </CalendlyBookingLink>
    </div>
  );
}
