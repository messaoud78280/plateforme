const AUTH_ONLY_RELATIONS = new Set(["accounts", "sessions"]);

const BLOCKER_LABELS: Record<string, string> = {
  organizationsOwned: "organisation",
  organizationMemberships: "appartenance à une organisation",
  projects: "chantier",
  tasks: "mission",
  documents: "document",
  chantierFiles: "pièce chantier",
  commercialQuotesCreated: "devis commercial",
  commercialInvoicesCreated: "facture commerciale",
  commercialProgressStatementsCreated: "situation de travaux",
  purchaseOrdersRequested: "bon de commande",
  siteVisitsCreated: "visite chantier",
  followUpSheetsOwned: "fiche de suivi",
  reportsAuthored: "rapport",
};

export type ClientDeletionBlocker = {
  relation: string;
  label: string;
  count: number;
};

/**
 * Une suppression physique n'est autorisée que pour un compte vierge.
 * Les relations NextAuth sont exclues : elles n'ont pas de valeur métier
 * et doivent disparaître avec le compte.
 */
export function clientDeletionBlockersFromCounts(
  counts: Record<string, number>,
  options?: { hasFollowUpAlertSettings?: boolean },
): ClientDeletionBlocker[] {
  const blockers = Object.entries(counts)
    .filter(
      ([relation, count]) =>
        !AUTH_ONLY_RELATIONS.has(relation) &&
        Number.isFinite(count) &&
        count > 0,
    )
    .map(([relation, count]) => ({
      relation,
      label: BLOCKER_LABELS[relation] ?? "historique métier",
      count,
    }));

  if (options?.hasFollowUpAlertSettings) {
    blockers.push({
      relation: "followUpAlertSettings",
      label: "paramétrage de suivi",
      count: 1,
    });
  }

  return blockers.sort((a, b) => a.label.localeCompare(b.label));
}
