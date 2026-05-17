import Link from "next/link";
import type { ComponentProps } from "react";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import { CALENDLY_APPEL_DECOUVERTE_URL } from "@/lib/site";

export type CalendlyBookingLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  /** Contexte pour Plausible (`data-plausible-location`). */
  trackLocation?: string;
};

/** Lien vers la page Calendly « appel découverte » (nouvel onglet). */
export function CalendlyBookingLink({ trackLocation = "calendly", ...props }: CalendlyBookingLinkProps) {
  return (
    <Link
      href={CALENDLY_APPEL_DECOUVERTE_URL}
      target="_blank"
      rel="noopener noreferrer"
      {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_RENDEZ_VOUS, trackLocation)}
      {...props}
    />
  );
}
