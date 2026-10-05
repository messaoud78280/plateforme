/**
 * Auth CREATE métré — pure, testable.
 *
 * Les comptes organisation BeWork ont souvent `role === "CLIENT"`
 * (ex. URBAN DIRECTION) tout en étant personType INTERNAL.
 * Ce rôle NextAuth ne doit JAMAIS bloquer seul le CREATE.
 * L'autorisation réelle = accès chantier (canModifyChantierProject).
 */

export function takeoffCreateCommitForbiddenReason(input: {
  /** Résultat de canModifyChantierProject / canAccessChantierProject. */
  hasProjectWriteAccess: boolean;
  /** role NextAuth — INFORMATIONAL only, never a hard ban alone. */
  role?: string | null;
}): { forbidden: boolean; reason: string | null; code: "FORBIDDEN" | null } {
  if (!input.hasProjectWriteAccess) {
    return {
      forbidden: true,
      reason: "Création du métré non autorisée",
      code: "FORBIDDEN",
    };
  }
  // Explicit: role CLIENT with write access is ALLOWED (CREATE ≠ staff-only MODIFY gate).
  void input.role;
  return { forbidden: false, reason: null, code: null };
}
