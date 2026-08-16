/** Helpers UI GED V2 — sans Prisma (safe client). */

import {
  HUB_CATEGORY_DEFS,
  type HubCategoryId,
  type HubCategoryStat,
  type HubGroup,
  hubCategoryLabel,
} from "@/lib/ged/hub-categories";

export type { HubCategoryId, HubCategoryStat, HubGroup };
export { HUB_CATEGORY_DEFS, hubCategoryLabel };

export type HubView =
  | "all"
  | "recent"
  | "favorites"
  | "missing"
  | "classify"
  | "categories";

export type HubSort = "recent" | "oldest" | "name" | "type";

export type HubDocSource = "chantier" | "purchase_order" | "legacy";

export type HubOrigin =
  | "MESSAGERIE"
  | "COMMANDE"
  | "CHANTIER"
  | "FOURNISSEUR"
  | "DEVIS"
  | "DOE"
  | "FICHE_SUIVI"
  | "UPLOAD"
  | "BEWORK";

export type HubDocumentItem = {
  id: string;
  source: HubDocSource;
  title: string;
  typeLabel: string;
  group: HubGroup;
  projectId: string | null;
  projectTitle: string | null;
  contextLabel: string | null;
  visibility: string;
  authorName: string | null;
  createdAt: string;
  href: string;
  mimeHint: string | null;
  isCurrentVersion: boolean;
  isExpectedMissing?: boolean;
  origin?: HubOrigin;
  originLabel?: string;
  originHref?: string | null;
  originActionLabel?: string | null;
  isFavorite?: boolean;
  versionLabel?: string | null;
  indice?: string | null;
  companyLabel?: string | null;
  chantierFileId?: string | null;
};

const GROUP_DEFS: { id: HubGroup; label: string }[] = [
  { id: "all", label: "Tous" },
  ...HUB_CATEGORY_DEFS.map((c) => ({ id: c.id as HubGroup, label: c.label })),
];

export const HUB_VIEWS: { id: HubView; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "recent", label: "Récents" },
  { id: "favorites", label: "Favoris" },
  { id: "missing", label: "À récupérer" },
  { id: "categories", label: "Catégories" },
  { id: "classify", label: "À classer" },
];

/** Catégories visibles selon le portail (pas de doublon métier). */
export function hubGroupsForPersona(
  personType?: string | null,
  permissionProfile?: string | null,
): { id: HubGroup; label: string }[] {
  const isSupplier =
    personType === "SUPPLIER" || permissionProfile === "FOURNISSEUR";
  const isClient =
    personType === "CLIENT_EXT" || permissionProfile === "CLIENT";
  if (isSupplier) {
    return [
      { id: "all", label: "Tous" },
      { id: "commandes_bl", label: "Commandes & bons de livraison" },
      { id: "fiches_techniques", label: "Fiches techniques" },
      { id: "factures_situations", label: "Factures & situations" },
      { id: "fournisseurs", label: "Fournisseurs" },
    ];
  }
  if (isClient) {
    return [
      { id: "all", label: "Tous" },
      { id: "plans_techniques", label: "Plans & pièces techniques" },
      { id: "factures_situations", label: "Factures & situations" },
      { id: "comptes_rendus", label: "Comptes rendus" },
      { id: "photos", label: "Photos chantier" },
      { id: "doe", label: "DOE / fin de chantier" },
    ];
  }
  return GROUP_DEFS;
}

export function hubViewsForPersona(
  personType?: string | null,
  permissionProfile?: string | null,
): { id: HubView; label: string }[] {
  const isSupplier =
    personType === "SUPPLIER" || permissionProfile === "FOURNISSEUR";
  const isClient =
    personType === "CLIENT_EXT" || permissionProfile === "CLIENT";
  if (isSupplier || isClient) {
    return HUB_VIEWS.filter(
      (v) =>
        v.id === "all" ||
        v.id === "recent" ||
        v.id === "favorites" ||
        v.id === "categories",
    );
  }
  return HUB_VIEWS;
}

export function originActionLabel(origin?: HubOrigin | null): string | null {
  switch (origin) {
    case "MESSAGERIE":
      return "Voir la conversation";
    case "COMMANDE":
      return "Voir la commande";
    case "DEVIS":
      return "Voir le devis";
    case "FICHE_SUIVI":
      return "Voir la fiche";
    case "DOE":
      return "Voir le DOE";
    case "FOURNISSEUR":
      return "Voir le fournisseur";
    case "CHANTIER":
      return "Voir le chantier";
    default:
      return null;
  }
}

/** Types documentaires humains — jamais « Chantiers » (un chantier n’est pas un type). */
export const HUB_DOC_TYPES: { id: string; label: string }[] = [
  { id: "", label: "Tous" },
  { id: "DEVIS", label: "Devis" },
  { id: "FACTURE", label: "Facture" },
  { id: "SITUATION", label: "Situation" },
  { id: "BON_COMMANDE", label: "Bon de commande" },
  { id: "BON_LIVRAISON", label: "Bon de livraison" },
  { id: "PLAN", label: "Plan" },
  { id: "FICHE_TECHNIQUE", label: "Fiche technique" },
  { id: "DOE", label: "DOE" },
  { id: "PHOTO", label: "Photo" },
  { id: "ATTESTATION", label: "Attestation" },
  { id: "CONTRAT", label: "Contrat" },
  { id: "COMPTE_RENDU", label: "Compte rendu" },
];

export const DOC_TYPE_ALIASES: Record<string, string[]> = {
  DEVIS: ["DEVIS", "DEVIS_FOURNISSEUR"],
  BON_LIVRAISON: ["BON_LIVRAISON", "BL"],
  BON_COMMANDE: ["BON_COMMANDE", "BC"],
  PHOTO: ["PHOTO"],
};

export const HUB_ORIGIN_FILTERS: { id: HubOrigin; label: string }[] = [
  { id: "MESSAGERIE", label: "Messagerie" },
  { id: "COMMANDE", label: "Commande" },
  { id: "DEVIS", label: "Devis & Facturation" },
  { id: "DOE", label: "DOE" },
  { id: "CHANTIER", label: "Chantier" },
  { id: "FOURNISSEUR", label: "Fournisseur" },
  { id: "UPLOAD", label: "Dépôt manuel" },
];

export const HUB_DATE_FILTERS: { id: string; label: string }[] = [
  { id: "", label: "Toutes" },
  { id: "30", label: "30 derniers jours" },
  { id: "year", label: "Cette année" },
];

export function visibleHubViews(
  views: { id: HubView; label: string }[],
  classifyCount: number,
): { id: HubView; label: string }[] {
  return views
    .filter((v) => v.id !== "classify" || classifyCount > 0)
    .map((v) =>
      v.id === "classify" ? { ...v, label: `À classer · ${classifyCount}` } : v,
    );
}

export function hubItemMatchesQuery(it: HubDocumentItem, query: string): boolean {
  const tokens = query
    .split(/\s+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 2)
    .slice(0, 6);
  if (tokens.length === 0) return true;
  const blob = [
    it.title,
    it.typeLabel,
    it.projectTitle,
    it.companyLabel,
    it.contextLabel,
    it.originLabel,
    it.origin,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return tokens.every((t) => blob.includes(t));
}

export function formatGedShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function documentTypeMatches(it: HubDocumentItem, docType: string): boolean {
  if (!docType) return true;
  const aliases = DOC_TYPE_ALIASES[docType] ?? [docType];
  const typeBlob = `${it.typeLabel} ${it.contextLabel ?? ""}`.toUpperCase();
  const label = HUB_DOC_TYPES.find((t) => t.id === docType)?.label;
  if (label && it.typeLabel === label) return true;
  return aliases.some((a) => typeBlob.includes(a));
}

export function hubEmptyCopy(opts: {
  group: HubGroup;
  view?: HubView;
  personType?: string | null;
  permissionProfile?: string | null;
  hostCompany?: string | null;
  search?: string | null;
  hasFilters?: boolean;
}): { title: string; body: string; action?: "clear-search" | "clear-filters" | "add" } {
  const q = (opts.search ?? "").trim();
  if (q) {
    return {
      title: "Aucun résultat",
      body: "Aucun document ne correspond à votre recherche.",
      action: "clear-search",
    };
  }
  if (opts.hasFilters) {
    return {
      title: "Aucun résultat",
      body: "Aucun document ne correspond à ces filtres.",
      action: "clear-filters",
    };
  }

  const isSupplier =
    opts.personType === "SUPPLIER" || opts.permissionProfile === "FOURNISSEUR";
  const isClient =
    opts.personType === "CLIENT_EXT" || opts.permissionProfile === "CLIENT";
  const host = opts.hostCompany?.trim() || "votre partenaire";

  if (opts.view === "favorites") {
    return {
      title: "Aucun favori",
      body: "Ajoutez une étoile aux documents que vous consultez souvent.",
    };
  }
  if (opts.view === "missing") {
    return {
      title: "Aucun document à récupérer",
      body: "Tous les documents attendus sont disponibles.",
    };
  }
  if (opts.view === "classify") {
    return {
      title: "Rien à classer",
      body: "Ces documents ont besoin d’une catégorie — aucun pour l’instant.",
    };
  }
  if (opts.view === "categories" && opts.group === "all") {
    return {
      title: "Aucune catégorie",
      body: "Les documents classés par type métier apparaîtront ici dès qu’ils sont disponibles.",
    };
  }

  if (isSupplier) {
    return {
      title: "Aucun document",
      body: `Les documents liés à vos commandes apparaîtront ici lorsque ${host} les partagera.`,
    };
  }
  if (isClient) {
    return {
      title: "Aucun document",
      body: `Les documents que ${host} partage avec vous apparaîtront ici.`,
    };
  }

  return {
    title: "Aucun document",
    body: "Ajoutez votre premier document.",
    action: "add",
  };
}

function commandeRef(contextLabel?: string | null): string | null {
  const raw = (contextLabel ?? "").split(" · ")[0]?.trim() || "";
  if (!raw) return null;
  return raw.replace(/^Commande\s+/i, "").trim() || null;
}

export function sourceLineForDocument(it: {
  origin?: HubOrigin;
  originLabel?: string;
  contextLabel?: string | null;
}): string {
  if (it.origin === "COMMANDE") {
    const ref = commandeRef(it.contextLabel);
    return ref ? `Commande ${ref}` : "Commande";
  }
  if (it.origin === "MESSAGERIE") return "Messagerie";
  if (it.origin === "DEVIS") return "Devis & Facturation";
  if (it.origin === "DOE") return "DOE";
  if (it.origin === "FOURNISSEUR") return "Fournisseur";
  if (it.origin === "UPLOAD") return "Dépôt manuel";
  if (it.origin === "FICHE_SUIVI") return "Fiche suivi";
  if (it.origin === "CHANTIER") return "Ajouté depuis le chantier";
  return it.originLabel || "";
}

export function documentResultLines(
  it: {
    origin?: HubOrigin;
    originLabel?: string;
    projectTitle?: string | null;
    companyLabel?: string | null;
    contextLabel?: string | null;
    typeLabel?: string;
    isExpectedMissing?: boolean;
    createdAt?: string;
  },
  opts?: { hideProject?: boolean },
): { typeLine: string; placeLine: string; sourceLine: string } {
  const typeLine = it.isExpectedMissing ? "À récupérer" : it.typeLabel || "Document";
  const place = [
    opts?.hideProject ? null : it.projectTitle,
    it.companyLabel,
  ].filter((s) => Boolean(s && s.trim()));
  const placeLine = place.join(" · ");
  const src = sourceLineForDocument(it);
  const date = it.createdAt ? formatGedShortDate(it.createdAt) : "";
  const sourceLine = [src, date].filter(Boolean).join(" · ");
  return { typeLine, placeLine, sourceLine };
}

export function provenanceSummary(it: {
  origin?: HubOrigin;
  originLabel?: string;
  projectTitle?: string | null;
  companyLabel?: string | null;
  contextLabel?: string | null;
  isExpectedMissing?: boolean;
  createdAt?: string;
}): string {
  const { placeLine, sourceLine } = documentResultLines(it);
  return [placeLine, sourceLine].filter(Boolean).join(" · ");
}

export function recentDayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDoc = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((startToday.getTime() - startDoc.getTime()) / 86400000);
  if (diff === 0) return "Aujourd’hui";
  if (diff === 1) return "Hier";
  if (diff >= 2 && diff <= 6) return "Cette semaine";
  return "Plus ancien";
}
