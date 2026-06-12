"use client";

import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";

export function StickyCtaMobile() {
  return (
    <div
      className="surface-metallic-sticky-bar fixed bottom-0 left-0 right-0 z-30 px-4 py-3 md:hidden"
      role="banner"
      aria-label="Appel à l'action"
    >
      <CalendlyBookingLink
        trackLocation="tarifs-sticky-mobile"
        className="flex w-full items-center justify-center rounded-lg bg-[#1d4ed8] px-6 py-3.5 text-center text-base font-semibold text-white shadow-md transition hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2"
        aria-label="Réserver un appel avec BeWork"
      >
        Réserver un appel
      </CalendlyBookingLink>
    </div>
  );
}
