/**
 * ECO-0 — garde d’environnement SETRIM (sans Prisma).
 * Ne jamais utiliser companyName comme clé d’identité.
 */
import { resolvePlatformKeyFromLoginIdentifier } from "@/lib/platform/config";

export const SETRIM_ECO_LOGIN_IDENTIFIERS = ["bework-demo", "setrim"] as const;

export const ECO0_MARK = "[ECO-0]";
export const ECO0_QUOTE_NUMBER = "DEV-ECO-2026-001";
export const ECO0_QUOTE_SUBJECT = `${ECO0_MARK} Marché étanchéité — Résidence Les Lilas`;

export const ECO0_PAY_REFS = {
  s1: "ECO-0-PAY-S1",
  s2: "ECO-0-PAY-S2",
} as const;

export type DemoIdentityInput = {
  loginIdentifier?: string | null;
  organizationId?: string | null;
  status?: string | null;
  companyName?: string | null;
};

export type EcoGuardResult =
  | { ok: true; loginIdentifier: string }
  | { ok: false; reason: string };

export function evaluateSetrimEcoGuard(input: DemoIdentityInput): EcoGuardResult {
  const login = input.loginIdentifier?.trim().toLowerCase() ?? "";
  if (!login) {
    return { ok: false, reason: "loginIdentifier manquant — identité démo incertaine" };
  }
  if (!(SETRIM_ECO_LOGIN_IDENTIFIERS as readonly string[]).includes(login)) {
    return {
      ok: false,
      reason: `loginIdentifier « ${login} » n’est pas la démo SETRIM`,
    };
  }
  if (resolvePlatformKeyFromLoginIdentifier(login) !== "setrim") {
    return { ok: false, reason: "platformKey ≠ setrim — refus" };
  }
  if (!input.organizationId?.trim()) {
    return {
      ok: false,
      reason: "organizationId manquant — ne jamais deviner un organizationId",
    };
  }
  if (input.status && input.status !== "ACTIVE") {
    return { ok: false, reason: `DemoEnvironment ${input.status} — seed refusé` };
  }
  return { ok: true, loginIdentifier: login };
}

export class EcoEnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EcoEnvironmentError";
  }
}
