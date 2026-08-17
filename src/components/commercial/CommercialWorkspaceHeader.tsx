"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function pageTitle(pathname: string): string {
  if (pathname.endsWith("/devis/nouveau")) return "Nouveau devis";
  if (pathname.includes("/devis/") && pathname !== "/dashboard/devis-facturation/devis") {
    return "Devis";
  }
  if (pathname.includes("/factures/preparer")) return "Préparer une facture";
  if (pathname.includes("/factures/")) return "Facture";
  if (pathname.includes("/situations/")) return "Situation";
  if (pathname.includes("/clients/")) return "Client";
  if (pathname.endsWith("/devis")) return "Devis";
  if (pathname.endsWith("/factures")) return "Factures";
  if (pathname.endsWith("/encaissements")) return "Encaissements";
  if (pathname.endsWith("/situations")) return "Situations";
  if (pathname.endsWith("/avenants")) return "Avenants";
  if (pathname.endsWith("/bibliotheque")) return "Bibliothèque";
  if (pathname.endsWith("/prix")) return "Prix";
  if (pathname.endsWith("/parametres")) return "Textes & conditions";
  if (pathname.endsWith("/clients")) return "Clients";
  if (pathname.endsWith("/journal")) return "Journal des ventes";
  if (pathname.includes("/suivi/devis-a-relancer")) return "Devis à relancer";
  if (pathname.includes("/suivi/impayes")) return "Factures impayées";
  if (pathname.includes("/suivi/echeances")) return "Échéances";
  if (pathname === "/dashboard/devis-facturation") return "Vue d’ensemble";
  return "Devis & Facturation";
}

export function CommercialWorkspaceHeader() {
  const pathname = usePathname() ?? "";
  if (pathname === "/dashboard/devis-facturation") {
    return null;
  }
  const title = pageTitle(pathname);
  const isFacturesArea =
    pathname.endsWith("/factures") ||
    pathname.includes("/factures/preparer") ||
    pathname.includes("/encaissements") ||
    pathname.includes("/suivi/impayes");
  const showPrepareInvoice =
    pathname.endsWith("/factures") || pathname.includes("/encaissements");
  const showNewQuote =
    !isFacturesArea &&
    !pathname.includes("/devis/nouveau") &&
    !pathname.match(/\/devis\/[^/]+$/);

  return (
    <header className="sticky top-0 z-30 border-b border-bework-navy/10 bg-[color-mix(in_srgb,var(--bw-soft-navy)_30%,rgba(255,255,255,0.9))] backdrop-blur-sm">
      <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2 sm:px-5">
        <h1 className="truncate text-[15px] font-semibold tracking-tight text-bework-navy-deep">
          {title}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          {showPrepareInvoice ? (
            <Link
              href="/dashboard/devis-facturation/factures/preparer"
              className="btn-cc-primary rounded-lg px-3 py-1.5 text-[13px]"
            >
              + Préparer une facture
            </Link>
          ) : null}
          {showNewQuote ? (
            <Link
              href="/dashboard/devis-facturation/devis/nouveau"
              className="btn-cc-primary rounded-lg px-3 py-1.5 text-[13px]"
            >
              + Nouveau devis
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
