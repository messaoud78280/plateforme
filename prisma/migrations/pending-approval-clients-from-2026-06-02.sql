-- Inscriptions client en ligne à partir du 2026-06-02 (Europe/Paris) :
-- passage en attente de validation (sans toucher aux comptes gérant : contractStatus = SIGNED).
UPDATE "User"
SET
  "accountStatus" = 'PENDING_APPROVAL',
  "monthlyActionsTotal" = 0,
  "monthlyActionsUsed" = 0,
  "actionsResetAt" = NULL
WHERE "role" = 'CLIENT'
  AND "accountStatus" = 'APPROVED'
  AND "contractStatus" = 'PENDING'
  AND "createdAt" >= TIMESTAMPTZ '2026-06-02 00:00:00+02';
