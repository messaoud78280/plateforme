/**
 * Architecture Organisation multi-utilisateurs (P1 audit) — déployée.
 *
 * Dual-read : Project/Task accessibles via clientId (legacy) OU organizationId.
 * Facturation reste sur User propriétaire (ownerUserId).
 */

export const ORGANIZATION_ARCHITECTURE = {
  status: "active" as const,
  featureFlag: "organizationMultiUser" as const,
  phases: [
    "Phase A — schéma Organization + Member ✅",
    "Phase B — backfill 1 org par CLIENT propriétaire ✅",
    "Phase C — invitations → OrganizationMember ✅",
    "Phase D — scoping listes + création projet/mission ✅",
  ],
  risks: [
    "Crédits toujours sur User owner — pas encore mutualisés au niveau Organization",
    "Endpoints non migrés peuvent encore filtrer seulement clientId",
  ],
  doNot: [
    "Supprimer clientId tant que dual-read n’est pas généralisé",
    "Fusionner des entreprises sans validation gérant",
  ],
} as const;
