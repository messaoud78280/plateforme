/** Helpers UI GED-V2A.3 — sans Prisma (safe client). */

export type HubGroup =
  | "all"
  | "chantiers"
  | "administratif"
  | "commandes"
  | "fournisseurs"
  | "doe"
  | "photos";

export type HubSort = "recent" | "oldest" | "name" | "type";

export type HubDocSource = "chantier" | "purchase_order" | "legacy";

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
  /** Pièce attendue sans fichier réel — ne pas proposer « Ouvrir ». */
  isExpectedMissing?: boolean;
};

const GROUP_DEFS: { id: HubGroup; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "chantiers", label: "Chantiers" },
  { id: "administratif", label: "Administratif" },
  { id: "commandes", label: "Commandes" },
  { id: "fournisseurs", label: "Fournisseurs" },
  { id: "doe", label: "DOE" },
  { id: "photos", label: "Photos" },
];

/** Onglets hub selon le portail (interne vs client vs fournisseur). */
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
      { id: "commandes", label: "Commandes" },
      { id: "fournisseurs", label: "Livraisons" },
    ];
  }
  if (isClient) {
    return [
      { id: "all", label: "Tous" },
      { id: "chantiers", label: "Chantiers" },
      { id: "commandes", label: "Commandes" },
    ];
  }
  return GROUP_DEFS;
}

export function hubEmptyCopy(opts: {
  group: HubGroup;
  personType?: string | null;
  permissionProfile?: string | null;
  hostCompany?: string | null;
}): { title: string; body: string } {
  const isSupplier =
    opts.personType === "SUPPLIER" || opts.permissionProfile === "FOURNISSEUR";
  const isClient =
    opts.personType === "CLIENT_EXT" || opts.permissionProfile === "CLIENT";
  const host = opts.hostCompany?.trim() || "votre partenaire";

  if (isSupplier) {
    return {
      title: "Aucun document partagé pour le moment.",
      body: `Les documents liés à vos commandes apparaîtront ici lorsque ${host} les partagera.`,
    };
  }
  if (isClient) {
    return {
      title: "Aucun document partagé pour le moment.",
      body: `Les documents que ${host} partage avec vous apparaîtront ici.`,
    };
  }

  switch (opts.group) {
    case "doe":
      return { title: "Aucun document DOE.", body: "Ajoutez un document DOE ou modifiez les filtres." };
    case "commandes":
      return {
        title: "Aucun document lié aux commandes.",
        body: "Les BL et pièces de commande apparaîtront ici.",
      };
    case "photos":
      return { title: "Aucune photo documentaire.", body: "Ajoutez une photo depuis un chantier." };
    case "administratif":
      return {
        title: "Aucun document administratif.",
        body: "Contrats, CCTP et pièces admin apparaîtront ici.",
      };
    case "fournisseurs":
      return {
        title: "Aucun document fournisseur.",
        body: "BL, fiches techniques et pièces fournisseur.",
      };
    case "chantiers":
      return {
        title: "Aucun document chantier.",
        body: "Plans, photos et pièces de chantier.",
      };
    default:
      return {
        title: "Aucun document ici.",
        body: "Ajoutez votre premier document ou modifiez les filtres.",
      };
  }
}
