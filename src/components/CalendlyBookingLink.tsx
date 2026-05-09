import Link from "next/link";
import type { ComponentProps } from "react";
import { CALENDLY_APPEL_DECOUVERTE_URL } from "@/lib/site";

export type CalendlyBookingLinkProps = Omit<ComponentProps<typeof Link>, "href">;

/** Lien vers la page Calendly « appel découverte » (nouvel onglet). */
export function CalendlyBookingLink(props: CalendlyBookingLinkProps) {
  return <Link href={CALENDLY_APPEL_DECOUVERTE_URL} target="_blank" rel="noopener noreferrer" {...props} />;
}
