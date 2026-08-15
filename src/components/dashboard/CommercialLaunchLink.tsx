import { canAccessCommercialModule } from "@/lib/commercial/access";
import { canAccessDashboardHref } from "@/lib/equipe-acces/dashboard-policy";

export function CommercialLaunchLink({
  personType,
  permissionProfile,
}: {
  personType?: string | null;
  permissionProfile?: string | null;
}) {
  if (
    !canAccessCommercialModule({ id: "header", personType, permissionProfile }) ||
    !canAccessDashboardHref(
      "/dashboard/devis-facturation",
      personType,
      permissionProfile,
    )
  ) {
    return null;
  }

  return (
    <a
      href="/dashboard/devis-facturation"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] font-semibold text-[#1e3a5f] transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/30"
      aria-label="Ouvrir Devis et Facturation dans un nouvel onglet"
    >
      <span className="hidden sm:inline">Devis & Facturation</span>
      <span className="sm:hidden">Devis</span>
      <span aria-hidden className="text-[11px] font-medium text-slate-400">
        ↗
      </span>
    </a>
  );
}
