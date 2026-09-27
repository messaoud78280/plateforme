"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WORKSPACE_HOME } from "@/components/dashboard/WorkspaceBrandLink";

function pageTitle(pathname: string): string {
  if (pathname.endsWith("/devis/nouveau")) return "Nouveau devis";
  if (pathname.includes("/devis/import")) return "Importer un devis";
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

type Crumb = { label: string; href?: string };

function buildCrumbs(pathname: string, title: string): Crumb[] {
  const base: Crumb[] = [
    { label: "Espace de travail", href: WORKSPACE_HOME },
    { label: "Devis & Facturation", href: "/dashboard/devis-facturation" },
  ];
  if (pathname === "/dashboard/devis-facturation") {
    return [...base, { label: "Vue d’ensemble" }];
  }
  if (pathname.endsWith("/devis") || pathname.includes("/devis/")) {
    const crumbs: Crumb[] = [
      ...base,
      { label: "Devis", href: "/dashboard/devis-facturation/devis" },
    ];
    if (!pathname.endsWith("/devis")) crumbs.push({ label: title });
    return crumbs;
  }
  if (pathname.endsWith("/factures") || pathname.includes("/factures/")) {
    const crumbs: Crumb[] = [
      ...base,
      { label: "Factures", href: "/dashboard/devis-facturation/factures" },
    ];
    if (!pathname.endsWith("/factures")) crumbs.push({ label: title });
    return crumbs;
  }
  return [...base, { label: title }];
}

export function CommercialWorkspaceHeader() {
  const pathname = usePathname() ?? "";
  const title = pageTitle(pathname);
  const crumbs = buildCrumbs(pathname, title);
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
    !pathname.includes("/devis/import") &&
    !pathname.match(/\/devis\/[^/]+$/);
  const hideTitleRow = pathname === "/dashboard/devis-facturation";

  return (
    <header className="sticky top-0 z-30 border-b border-bework-navy/10 bg-[color-mix(in_srgb,var(--bw-soft-navy)_30%,rgba(255,255,255,0.9))] backdrop-blur-sm">
      <div className="flex min-h-12 flex-col justify-center gap-1 px-3 py-2 sm:px-5">
        <nav aria-label="Fil d'Ariane" className="text-[11px] text-slate-500">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <li key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
                  {i > 0 ? (
                    <span className="text-slate-300" aria-hidden>
                      ›
                    </span>
                  ) : null}
                  {c.href && !isLast ? (
                    <Link
                      href={c.href}
                      className="font-medium text-slate-500 transition-colors hover:text-bework-navy hover:underline"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span
                      className={isLast ? "font-medium text-slate-700" : undefined}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {c.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        {!hideTitleRow ? (
          <div className="flex items-center justify-between gap-3">
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
                <>
                  <Link
                    href="/dashboard/devis-facturation/devis/import"
                    className="rounded-lg border border-bework-navy/20 bg-white px-3 py-1.5 text-[13px] font-semibold text-bework-navy"
                  >
                    ↑ Importer
                  </Link>
                  <Link
                    href="/dashboard/devis-facturation/devis/nouveau"
                    className="btn-cc-primary rounded-lg px-3 py-1.5 text-[13px]"
                  >
                    + Nouveau devis
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
