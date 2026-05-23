import Link from "next/link";
import type { ComponentProps } from "react";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

export type CalendlyBookingLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  /** Contexte pour Plausible (`data-plausible-location`). */
  trackLocation?: string;
};

/** Lien vers le formulaire de contact (page /contact). */
export function CalendlyBookingLink({ trackLocation = "contact-form", ...props }: CalendlyBookingLinkProps) {
  return (
    <Link
      href="/contact#formulaire"
      {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_RENDEZ_VOUS, trackLocation)}
      {...props}
    />
  );
}
