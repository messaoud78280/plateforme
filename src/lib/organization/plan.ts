/**
 * Architecture Organisation multi-utilisateurs + socle SaaS multi-tenant.
 *
 * Dual-read : Project/Task accessibles via clientId (legacy) OU organizationId.
 * Facturation commerciale BTP (Commercial*) scopée par organizationId.
 * Facturation abonnement BeWork (User.Subscription / Payment) reste séparée — Phase 7 Stripe.
 */

export const ORGANIZATION_ARCHITECTURE = {
  status: "active" as const,
  featureFlag: "organizationMultiUser" as const,
  phases: [
    "Phase A — schéma Organization + Member ✅",
    "Phase B — backfill 1 org par CLIENT propriétaire ✅",
    "Phase C — invitations → OrganizationMember ✅",
    "Phase D — scoping listes + création projet/mission ✅",
    "Phase E — SaaS lifecycle (trial 14j, kind DEMO/STANDARD, tenant helpers) ✅ Phase 1",
  ],
  saas: {
    trialDays: 14,
    tenantHelpers: [
      "requireOrganizationContext",
      "assertOrgWritable",
      "assertSameOrganization",
      "createSaasWorkspace (préparé, non exposé publiquement)",
    ],
    securityBoundary:
      "Prisma + service role côté serveur. Signed URLs storage. Pas de confiance frontend.",
  },
  risks: [
    "Crédits encore sur User owner — mutualisation org en Phase 7+",
    "Certains domaines legacy (QuoteDocument, Message) encore scopés via project/clientId",
    "Staff BeWork (MANAGER/AGENCE) conserve une vue ops cross-tenant — hors parcours SaaS client",
  ],
  doNot: [
    "Supprimer clientId tant que dual-read n’est pas généralisé",
    "Fusionner des entreprises sans validation gérant",
    "Ouvrir l’inscription publique avant validation isolation Phase 1",
    "Copier les données SETRIM dans un nouvel espace client",
  ],
} as const;
