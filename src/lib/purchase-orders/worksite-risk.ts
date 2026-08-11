/**
 * COMMANDES-V2D — risque chantier déterministe.
 * N'affirme un risque que si une date d'intervention / besoin est fournie.
 * Sans « besoin pour » en base : interventionStartAt doit être passé explicitement.
 */
export type WorksiteRiskLevel = "none" | "a_verifier" | "risque";

export type PurchaseOrderWorksiteRisk = {
  level: WorksiteRiskLevel;
  /** Court, affichable */
  label: string | null;
  /** Explicable — jamais inventé */
  reason: string | null;
};

export type PurchaseOrderWorksiteRiskInput = {
  /** Date livraison de foi (confirmée sinon demandée) */
  deliveryAt: Date | string | null;
  /** Début intervention / besoin chantier — UNIQUEMENT si connu réellement */
  interventionStartAt?: Date | string | null;
  remainingQty: number;
  fullyReceived: boolean;
  projectId?: string | null;
};

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Compare livraison et intervention uniquement si les deux dates sont connues.
 * Sans interventionStartAt → aucun « Bloque le chantier » inventé.
 */
export function evaluatePurchaseOrderWorksiteRisk(
  input: PurchaseOrderWorksiteRiskInput,
): PurchaseOrderWorksiteRisk {
  const delivery = toDate(input.deliveryAt);
  const intervention = toDate(input.interventionStartAt ?? null);

  if (input.fullyReceived || input.remainingQty <= 0) {
    return { level: "none", label: null, reason: null };
  }

  if (delivery && intervention) {
    if (delivery.getTime() > intervention.getTime()) {
      return {
        level: "risque",
        label: "Risque chantier",
        reason:
          "Livraison prévue après le début de l'intervention liée — à confirmer avant exécution.",
      };
    }
    if (
      !input.fullyReceived &&
      input.remainingQty > 0 &&
      intervention.getTime() - Date.now() < 48 * 3600000 &&
      intervention.getTime() > Date.now()
    ) {
      return {
        level: "a_verifier",
        label: "À vérifier avant intervention",
        reason: `${Math.round(input.remainingQty)} unité(s) restent à recevoir avant l'intervention.`,
      };
    }
    return { level: "none", label: null, reason: null };
  }

  // Pas de lien intervention démontrable — ne pas inventer un blocage chantier
  if (input.projectId && input.remainingQty > 0 && delivery && delivery.getTime() < Date.now()) {
    return {
      level: "a_verifier",
      label: "À vérifier avant intervention",
      reason: "Livraison en retard — vérifier l'impact chantier (lien intervention non démontré).",
    };
  }

  return { level: "none", label: null, reason: null };
}
