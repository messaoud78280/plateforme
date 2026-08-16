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
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-bework-accent px-3 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(37,99,235,0.2)] transition-[background,box-shadow,transform] duration-150 hover:bg-[#1d4ed8] hover:shadow-[0_2px_8px_rgba(37,99,235,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bework-accent/35 active:scale-[0.98]"
      aria-label="Ouvrir Devis et Facturation dans un nouvel onglet"
    >
      <span className="hidden sm:inline">Devis & Facturation</span>
      <span className="sm:hidden">Devis</span>
      <span aria-hidden className="text-[11px] font-medium text-white/80">
        ↗
      </span>
    </a>
  );
}
