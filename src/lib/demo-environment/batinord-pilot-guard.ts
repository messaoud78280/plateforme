/**
 * ONBOARDING-1 — garde BATINORD (sans Prisma).
 * Ne jamais deviner un organizationId. Ne jamais accepter SETRIM.
 */
import { resolvePlatformKeyFromLoginIdentifier } from "@/lib/platform/config";

export const BATINORD_LOGIN_IDENTIFIER = "batinord";
export const BATINORD_COMPANY_NAME = "BATINORD";
export const SETRIM_LOGIN_IDENTIFIERS = ["bework-demo", "setrim"] as const;

export const ONB1_MARK = "[ONBOARDING-1]";
export const ONB1_QUOTE_NUMBER = "DEV-BAT-2026-001";
export const ONB1_QUOTE_SUBJECT = `${ONB1_MARK} Marché étanchéité — Résidence Parc Central`;
export const ONB1_PO_NUMBER = "BC-BAT-2026-001";
export const ONB1_PO_SUBJECT = `${ONB1_MARK} Fourniture matériaux — Résidence Parc Central`;
export const ONB1_SUPPLIER_INVOICE = "FAC-BAT-2026-001";

export type BatinordIdentityInput = {
  loginIdentifier?: string | null;
  organizationId?: string | null;
  status?: string | null;
  companyName?: string | null;
};

export type BatinordGuardResult =
  | { ok: true; loginIdentifier: string }
  | { ok: false; reason: string };

export function evaluateBatinordPilotGuard(input: BatinordIdentityInput): BatinordGuardResult {
  const login = input.loginIdentifier?.trim().toLowerCase() ?? "";
  if (!login) {
    return { ok: false, reason: "loginIdentifier manquant — identité incertaine" };
  }
  if ((SETRIM_LOGIN_IDENTIFIERS as readonly string[]).includes(login)) {
    return { ok: false, reason: "loginIdentifier SETRIM — seed BATINORD refusé" };
  }
  if (login !== BATINORD_LOGIN_IDENTIFIER) {
    return {
      ok: false,
      reason: `loginIdentifier « ${login} » n’est pas BATINORD`,
    };
  }
  const platform = resolvePlatformKeyFromLoginIdentifier(login);
  if (platform === "setrim") {
    return { ok: false, reason: "platformKey setrim — BATINORD doit rester hors SETRIM" };
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

export class BatinordEnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BatinordEnvironmentError";
  }
}
