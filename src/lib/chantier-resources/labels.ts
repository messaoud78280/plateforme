import type {
  SiteResourceAliasKind,
  SiteResourceConfidence,
  SiteResourceExtractedFrom,
  SiteResourceGroupingProposalStatus,
  SiteResourceGroupingProposalType,
  SiteResourceLinkRole,
  SiteResourceStatus,
  SiteResourceType,
} from "@prisma/client";

export const SITE_RESOURCE_TYPE_LABELS: Record<SiteResourceType, string> = {
  materiaux: "Matériaux",
  consommables: "Consommables",
  location_engin: "Locations engins",
  location_outillage: "Locations outillage",
  equipements: "Équipements",
  services: "Services",
};

export const SITE_RESOURCE_STATUS_LABELS: Record<SiteResourceStatus, string> = {
  brouillon: "Brouillon",
  a_verifier: "À vérifier",
  valide: "Validé",
  archive: "Archivé",
  fusionne: "Fusionné",
};

export const SITE_RESOURCE_CONFIDENCE_LABELS: Record<SiteResourceConfidence, string> = {
  faible: "Faible",
  moyen: "Moyen",
  eleve: "Élevé",
};

export const SITE_RESOURCE_ALIAS_KIND_LABELS: Record<SiteResourceAliasKind, string> = {
  synonyme: "Synonyme",
  extraction_ouvrage: "Extraction ouvrage",
  fournisseur: "Fournisseur",
  orthographe: "Orthographe",
  ancien_libelle: "Ancien libellé",
  court: "Libellé court",
  variante_libelle: "Variante libellé",
};

export const SITE_RESOURCE_LINK_ROLE_LABELS: Record<SiteResourceLinkRole, string> = {
  materiau_principal: "Matériau principal",
  fourniture: "Fourniture",
  consommable: "Consommable",
  location: "Location",
  equipement: "Équipement",
  service: "Service",
  autre: "Autre",
};

export const SITE_RESOURCE_EXTRACTED_FROM_LABELS: Record<SiteResourceExtractedFrom, string> = {
  title: "Titre ouvrage",
  includedItems: "Compris / fournitures",
  fullDescription: "Désignation complète",
  manuel: "Manuel",
};

export const GROUPING_PROPOSAL_TYPE_LABELS: Record<SiteResourceGroupingProposalType, string> = {
  merge_as_alias: "Regrouper (alias)",
  create_variant: "Créer variante",
  new_resource: "Nouvelle ressource",
  keep_separate: "À vérifier",
  ignore: "Ignorer",
};

export const GROUPING_PROPOSAL_STATUS_LABELS: Record<SiteResourceGroupingProposalStatus, string> = {
  pending: "En attente",
  approved: "Validé",
  rejected: "Rejeté",
};
