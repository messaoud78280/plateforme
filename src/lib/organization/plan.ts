/**
 * Architecture proposée — Organisation multi-utilisateurs (P1 audit).
 *
 * Problème : le tenant = User CLIENT. Un collaborateur invité a son propre User.id
 * et ne voit pas les chantiers / missions de l’entreprise invitante.
 *
 * Cible (sans migration destructive immédiate) :
 *
 * 1. Organization { id, name, siret?, billing… }
 * 2. OrganizationMember { organizationId, userId, role: OWNER|ADMIN|MEMBER|VIEWER }
 * 3. Project.organizationId (+ conserver clientId legacy = owner User)
 * 4. Scoping API : where organizationId in memberships OR clientId = session.user.id
 *
 * Migration :
 * - Créer Organization depuis User CLIENT existants (1:1 au départ)
 * - Feature flag organizationMultiUser = false jusqu’à bascule
 * - Pas de suppression de clientId
 *
 * Ne pas implémenter le schéma tant que le hub GED / validation client n’est pas stabilisé en prod.
 */

export const ORGANIZATION_ARCHITECTURE = {
  status: "planned" as const,
  featureFlag: "organizationMultiUser" as const,
  phases: [
    "Phase A — schéma Organization + Member (nullable orgId sur Project/Task)",
    "Phase B — backfill 1 org par CLIENT propriétaire",
    "Phase C — invitations rattachées à OrganizationMember (plus de User isolé)",
    "Phase D — UI équipe + scoping access.ts centralisé",
  ],
  risks: [
    "Double facturation si crédits restent sur User au lieu d’Organization",
    "Fuite cross-tenant si un endpoint oublie le filtre org",
  ],
  doNot: [
    "Fusionner automatiquement les comptes existants sans validation gérant",
    "Supprimer clientId avant dual-read stabilisé",
  ],
} as const;
