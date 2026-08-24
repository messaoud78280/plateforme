/**
 * COMMERCIAL-WORKSPACE-2 — navigation sidebar (routes sources de vérité uniquement).
 */
import { canAccessDashboardHref } from "@/lib/equipe-acces/dashboard-policy";

export type CommercialNavLink = {
  href: string;
  label: string;
  exact?: boolean;
  /** Action rapide (préfixe +) */
  action?: boolean;
  /** Lien hors préfixe devis-facturation (Achats, GED, À facturer) */
  external?: boolean;
};

export type CommercialNavGroup = {
  id: string;
  label: string | null;
  links: CommercialNavLink[];
};

const BASE = "/dashboard/devis-facturation";

/** Achats : DIRECTION / ADMINISTRATIF (whitelist null). Conducteur : non. */
export function canShowCommercialPurchases(opts: {
  personType?: string | null;
  permissionProfile?: string | null;
}): boolean {
  return canAccessDashboardHref(
    "/dashboard/depenses",
    opts.personType,
    opts.permissionProfile,
  );
}

export function buildCommercialNav(opts: {
  personType?: string | null;
  permissionProfile?: string | null;
}): CommercialNavGroup[] {
  const showPurchases = canShowCommercialPurchases(opts);

  const groups: CommercialNavGroup[] = [
    {
      id: "accueil",
      label: null,
      links: [{ href: BASE, label: "Vue d’ensemble", exact: true }],
    },
    {
      id: "actions",
      label: "Actions",
      links: [
        {
          href: `${BASE}/devis/nouveau`,
          label: "Créer un devis",
          action: true,
        },
        {
          href: `${BASE}/devis/import`,
          label: "Importer un devis",
          action: true,
        },
        {
          href: `${BASE}/factures/preparer`,
          label: "Préparer une facture",
          action: true,
        },
        {
          href: `${BASE}/encaissements`,
          label: "Enregistrer un paiement",
          action: true,
        },
      ],
    },
    {
      id: "ventes",
      label: "Ventes",
      links: [
        { href: `${BASE}/devis`, label: "Devis" },
        { href: `${BASE}/situations`, label: "Situations" },
        { href: `${BASE}/factures`, label: "Factures" },
        { href: `${BASE}/avenants`, label: "Avenants" },
        { href: `${BASE}/encaissements`, label: "Encaissements" },
      ],
    },
    {
      id: "suivi",
      label: "Suivi",
      links: [
        {
          href: "/dashboard/facturation",
          label: "À facturer",
          external: true,
        },
        { href: `${BASE}/suivi/devis-a-relancer`, label: "Devis à relancer" },
        { href: `${BASE}/suivi/impayes`, label: "Factures impayées" },
        { href: `${BASE}/suivi/echeances`, label: "Échéances" },
      ],
    },
    {
      id: "referentiel",
      label: "Référentiel",
      links: [
        { href: `${BASE}/clients`, label: "Clients" },
        { href: `${BASE}/bibliotheque`, label: "Bibliothèque" },
        { href: `${BASE}/prix`, label: "Prix" },
        { href: `${BASE}/parametres`, label: "Textes & conditions" },
        {
          href: "/dashboard/documents?origin=DEVIS",
          label: "Documents commerciaux",
          external: true,
        },
      ],
    },
  ];

  if (showPurchases) {
    groups.push({
      id: "achats",
      label: "Achats",
      links: [
        {
          href: "/dashboard/depenses",
          label: "Factures fournisseurs",
          external: true,
        },
        {
          href: "/dashboard/fournisseurs",
          label: "Fournisseurs",
          external: true,
        },
      ],
    });
  }

  groups.push({
    id: "pilotage",
    label: "Pilotage",
    links: [
      { href: BASE, label: "Tableau de bord", exact: true },
      { href: `${BASE}/journal`, label: "Journal des ventes" },
    ],
  });

  return groups;
}

export function isCommercialNavActive(
  pathname: string,
  link: CommercialNavLink,
): boolean {
  if (link.exact) return pathname === link.href;
  if (link.href.includes("?")) {
    const base = link.href.split("?")[0]!;
    return pathname === base || pathname.startsWith(`${base}/`);
  }
  // COMMERCIAL-QUOTE-UI-3 / COMMERCIAL-INVOICE-FIX —
  // Les listes parentes ne doivent pas être « actives » sur les routes d’action.
  if (
    link.href.endsWith("/devis") &&
    !link.href.endsWith("/devis/nouveau") &&
    (pathname === `${link.href}/nouveau` || pathname.startsWith(`${link.href}/nouveau/`))
  ) {
    return false;
  }
  if (
    link.href.endsWith("/factures") &&
    !link.href.endsWith("/factures/preparer") &&
    (pathname === `${link.href}/preparer` || pathname.startsWith(`${link.href}/preparer/`))
  ) {
    return false;
  }
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}
