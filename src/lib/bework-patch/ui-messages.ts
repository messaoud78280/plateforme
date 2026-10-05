/**
 * CTX-05 — Libellés métier et messages utilisateur (couche UI).
 * Les codes techniques restent côté API ; l’UI les traduit.
 */
import type { BeworkPatchSection } from "@/lib/bework-patch/types";

export const SECTION_METIER_LABEL: Record<BeworkPatchSection, string> = {
  TAKEOFF: "Métré / quantitatif",
  QUOTE: "Devis",
  PLANNING: "Planning chantier",
  VISIT: "Visite & relevés",
  FOLLOW_UP: "Suivi de chantier",
  REPORT: "Compte rendu",
  NOTICE: "Notice explicative",
};

export function sectionMetierLabel(section: BeworkPatchSection): string {
  return SECTION_METIER_LABEL[section];
}

export type UserFacingError = {
  title: string;
  message: string;
  action: "reanalyze" | "retry_paste" | "refresh" | "close" | null;
  actionLabel: string | null;
};

/**
 * Mapping code technique → message métier.
 * Si message serveur déjà clair (français métier), on le conserve.
 */
export function mapPatchErrorToUser(input: {
  code?: string | null;
  serverMessage?: string | null;
  section?: BeworkPatchSection;
}): UserFacingError {
  const code = (input.code ?? "").toUpperCase();
  const server = (input.serverMessage ?? "").trim();
  const sectionLabel = input.section
    ? sectionMetierLabel(input.section)
    : "cette section";

  // Si le serveur a déjà un message métier (sans jargon), le réutiliser.
  const serverIsTechnical =
    !server ||
    /fingerprint|base_version|eligibility|subgraph|DIRECT_ONLY|SAFE_PARTIAL|FULL_SYNC|INVALID_JSON|UNKNOWN_OPERATION/i.test(
      server,
    ) ||
    /^[A-Z0-9_]+$/.test(server);

  switch (code) {
    case "VERSION_CONFLICT":
      return {
        title: "Les données ont changé",
        message:
          !serverIsTechnical && server
            ? server
            : `Cette section (${sectionLabel}) a été modifiée depuis la création de cette proposition. Analysez de nouveau les modifications avant de les appliquer.`,
        action: "reanalyze",
        actionLabel: "Analyser de nouveau",
      };
    case "PREVIEW_STALE":
      return {
        title: "La situation a changé",
        message:
          !serverIsTechnical && server
            ? server
            : "Les données liées ont évolué depuis l’analyse. Une nouvelle analyse est nécessaire avant d’appliquer les modifications.",
        action: "reanalyze",
        actionLabel: "Relancer l’analyse",
      };
    case "DUPLICATE_PATCH":
      return {
        title: "Modifications déjà appliquées",
        message:
          !serverIsTechnical && server
            ? server
            : "Cette proposition a déjà été enregistrée.",
        action: "refresh",
        actionLabel: "Voir les données à jour",
      };
    case "TARGET_NOT_FOUND":
    case "PROJECT_MISMATCH":
    case "ORGANIZATION_MISMATCH":
      return {
        title: "Impossible d’appliquer",
        message:
          !serverIsTechnical && server
            ? server
            : "Le bloc utilisé ne correspond plus à la section actuellement ouverte.",
        action: "retry_paste",
        actionLabel: "Coller un autre bloc",
      };
    case "OPERATION_NOT_ALLOWED_FOR_SECTION":
    case "SCHEDULE_RECOMPUTE_FAILED":
    case "UNSUPPORTED":
    case "INVALID_FIELD":
    case "EMPTY_OPERATIONS":
      return {
        title: "Modifications non applicables automatiquement",
        message:
          !serverIsTechnical && server
            ? server
            : "Cette proposition contient une modification que BeWork ne peut pas encore appliquer automatiquement. Aucune modification n’a été effectuée.",
        action: "retry_paste",
        actionLabel: "Modifier le bloc",
      };
    case "PROTECTED_ENTITY":
      return {
        title: "Élément protégé",
        message:
          !serverIsTechnical && server
            ? server
            : "Certaines données liées sont protégées et ne peuvent pas être modifiées automatiquement.",
        action: "close",
        actionLabel: "Fermer",
      };
    case "PROTECTED_SOURCE_CONFLICT":
      return {
        title: "Donnée protégée",
        message:
          !serverIsTechnical && server
            ? server
            : "Cette valeur a été saisie ou validée par l'utilisateur. Une hypothèse ou une donnée non confirmée ne peut pas la remplacer automatiquement.",
        action: "retry_paste",
        actionLabel: "Modifier le bloc",
      };
    case "INVALID_JSON":
    case "INVALID_PATCH_TYPE":
    case "UNSUPPORTED_SCHEMA_VERSION":
    case "INVALID_PATCH_ID":
    case "UNKNOWN_OPERATION":
    case "INVALID_TARGET":
      return {
        title: "Bloc non reconnu",
        message:
          "Le bloc collé n’est pas reconnu par BeWork. Vérifiez que vous avez copié l’intégralité du bloc fourni par ChatGPT.",
        action: "retry_paste",
        actionLabel: "Corriger le bloc",
      };
    default:
      if (!serverIsTechnical && server) {
        return {
          title: "Impossible d’appliquer les modifications",
          message: server,
          action: "retry_paste",
          actionLabel: "Réessayer",
        };
      }
      return {
        title: "Impossible d’appliquer les modifications",
        message:
          "Impossible d’appliquer les modifications pour le moment. Aucune modification n’a été enregistrée.",
        action: "retry_paste",
        actionLabel: "Réessayer",
      };
  }
}

/** Traduit un mode de sync technique en phrase métier. */
export function syncModeUserHint(mode: string): string {
  switch (mode) {
    case "FULL_SYNC":
      return "Les éléments liés pourront être mis à jour avec cette modification.";
    case "SAFE_PARTIAL_SYNC":
      return "Certaines conséquences nécessiteront une validation séparée. Les éléments protégés restent intacts.";
    case "QUOTE_ONLY":
      return "Seules les données du devis seront mises à jour.";
    case "PLANNING_ONLY":
      return "Seules les données du planning chantier seront mises à jour.";
    case "VISIT_ONLY":
      return "Seules les informations de la visite seront mises à jour.";
    case "FOLLOW_UP_ONLY":
      return "Seules les informations du suivi de chantier seront mises à jour.";
    case "REPORT_ONLY":
      return "Seules les informations du compte rendu seront mises à jour.";
    case "NOTICE_ONLY":
      return "Seules les informations de la notice explicative seront mises à jour.";
    default:
      return "Les modifications seront enregistrées en une seule opération.";
  }
}

export function fieldMetierLabel(field: string): string {
  const map: Record<string, string> = {
    title: "Titre",
    quick_notes: "Notes rapides",
    summary: "Résumé",
    additional_notes: "Notes complémentaires",
    notes: "Notes",
    subject: "Objet",
    client_need: "Besoin client",
    comments: "Commentaires",
    duration_days: "Durée",
    name: "Intitulé",
    description: "Description",
    lot: "Lot",
    quantity: "Quantité",
    unit_price_ht: "Prix unitaire HT",
    value: "Valeur",
    designation: "Désignation",
    meta: "Informations",
    line: "Ajout de ligne",
    declared_quantity: "Quantité",
  };
  return map[field] ?? field.replace(/_/g, " ");
}
