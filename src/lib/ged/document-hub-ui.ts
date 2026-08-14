/** Helpers UI GED V2 — sans Prisma (safe client). */

export type HubGroup =
  | "all"
  | "chantiers"
  | "administratif"
  | "commandes"
  | "fournisseurs"
  | "doe"
  | "photos";

export type HubView = "all" | "recent" | "favorites" | "missing" | "classify";

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
  { id: "all", label: "Tous types" },
  { id: "chantiers", label: "Chantiers" },
  { id: "administratif", label: "Administratif" },
  { id: "commandes", label: "Commandes" },
  { id: "fournisseurs", label: "Fournisseurs" },
  { id: "doe", label: "DOE" },
  { id: "photos", label: "Photos" },
];

export const HUB_VIEWS: { id: HubView; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "recent", label: "Récents" },
  { id: "favorites", label: "Favoris" },
  { id: "missing", label: "À récupérer" },
  { id: "classify", label: "À classer" },
];

/** Onglets type (filtres) selon le portail. */
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
      { id: "all", label: "Tous types" },
      { id: "commandes", label: "Commandes" },
      { id: "fournisseurs", label: "Livraisons" },
    ];
  }
  if (isClient) {
    return [
      { id: "all", label: "Tous types" },
      { id: "chantiers", label: "Chantiers" },
      { id: "commandes", label: "Commandes" },
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
    return HUB_VIEWS.filter((v) => v.id === "all" || v.id === "recent" || v.id === "favorites");
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
    case "CHANTIER":
      return "Voir le chantier";
    default:
      return null;
  }
}

export function hubEmptyCopy(opts: {
  group: HubGroup;
  view?: HubView;
  personType?: string | null;
  permissionProfile?: string | null;
  hostCompany?: string | null;
}): { title: string; body: string } {
  const isSupplier =
    opts.personType === "SUPPLIER" || opts.permissionProfile === "FOURNISSEUR";
  const isClient =
    opts.personType === "CLIENT_EXT" || opts.permissionProfile === "CLIENT";
  const host = opts.hostCompany?.trim() || "votre partenaire";

  if (opts.view === "favorites") {
    return {
      title: "Aucun favori",
      body: "Marquez d’une étoile les plans, CCTP ou contrats que vous consultez souvent.",
    };
  }
  if (opts.view === "missing") {
    return {
      title: "Rien à récupérer",
      body: "Les pièces encore manquantes (fiches techniques, attestations, PV) apparaîtront ici.",
    };
  }
  if (opts.view === "classify") {
    return {
      title: "Rien à classer",
      body: "Les documents sans chantier ou type suffisamment connu apparaîtront ici.",
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
    body: "Les documents ajoutés depuis vos chantiers et outils BeWork apparaîtront ici automatiquement.",
  };
}

export function provenanceSummary(it: {
  origin?: HubOrigin;
  originLabel?: string;
  projectTitle?: string | null;
  companyLabel?: string | null;
  contextLabel?: string | null;
  isExpectedMissing?: boolean;
}): string {
  if (it.isExpectedMissing) {
    return [it.projectTitle, it.companyLabel].filter(Boolean).join(" · ");
  }
  if (it.origin === "MESSAGERIE") {
    return [it.companyLabel || it.projectTitle, "Messagerie"].filter(Boolean).join(" · ");
  }
  if (it.origin === "COMMANDE") {
    const ref = (it.contextLabel ?? "").split(" · ")[0] || it.contextLabel;
    const cmd = ref ? `Commande ${ref.replace(/^Commande\s+/i, "")}` : "Commande";
    return [it.companyLabel, cmd].filter(Boolean).join(" · ");
  }
  if (it.origin === "DEVIS") {
    return ["Devis & Facturation", it.contextLabel].filter(Boolean).join(" · ");
  }
  if (it.origin === "DOE") {
    return [it.projectTitle, "DOE"].filter(Boolean).join(" · ");
  }
  if (it.origin === "FOURNISSEUR") {
    return [it.companyLabel, "Fournisseur", it.projectTitle].filter(Boolean).join(" · ");
  }
  if (it.origin === "FICHE_SUIVI") {
    return [it.projectTitle, "Fiche suivi", it.contextLabel].filter(Boolean).join(" · ");
  }
  return [it.projectTitle, it.originLabel || "Ajouté depuis le chantier"].filter(Boolean).join(" · ");
}

export function recentDayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDoc = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((startToday.getTime() - startDoc.getTime()) / 86400000);
  if (diff === 0) return "Aujourd’hui";
  if (diff === 1) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}
