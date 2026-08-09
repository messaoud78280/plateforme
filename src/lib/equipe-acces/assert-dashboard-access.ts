import { redirect } from "next/navigation";
import { isHrefAllowedForPersona } from "@/lib/equipe-acces/nav-by-persona";

/**
 * Garde serveur — sidebar ≠ sécurité.
 * Applique la whitelist persona (FOURNISSEUR, CLIENT, CONDUCTEUR, …).
 * DIRECTION / ADMINISTRATIF / DEFAULT_INTERNAL : pas de filtre (allowed = null).
 */
export function assertDashboardHrefAllowed(opts: {
  href: string;
  personType?: string | null;
  permissionProfile?: string | null;
}): void {
  if (
    !isHrefAllowedForPersona(opts.href, opts.personType, opts.permissionProfile)
  ) {
    redirect("/dashboard");
  }
}
