import { redirect } from "next/navigation";
import { canAccessDashboardHref } from "@/lib/equipe-acces/dashboard-policy";

/**
 * Garde serveur — sidebar ≠ sécurité.
 * Politique unique : `canAccessDashboardHref` (whitelist + extras sidebar).
 */
export function assertDashboardHrefAllowed(opts: {
  href: string;
  personType?: string | null;
  permissionProfile?: string | null;
}): void {
  if (
    !canAccessDashboardHref(opts.href, opts.personType, opts.permissionProfile)
  ) {
    redirect("/dashboard");
  }
}
