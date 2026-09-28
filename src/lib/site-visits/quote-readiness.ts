/**
 * Complétude minimale pour passer une visite en « prêt à chiffrer ».
 * Photos et contact sur place ne sont pas exigés.
 */

const GENERIC_NEED =
  /^(compte rendu de visite|visite|relev[ée]|autre)$/i;

export type VisitQuoteReadinessInput = {
  clientName?: string | null;
  clientNeed?: string | null;
  subject?: string | null;
  siteAddress?: string | null;
  fieldNotes?: string | null;
  measurementCount?: number;
  comments?: string | null;
  hasConstraints?: boolean;
};

export type VisitQuoteReadiness = {
  ready: boolean;
  missing: string[];
  done: number;
  total: number;
};

function filled(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function hasNeed(input: VisitQuoteReadinessInput): boolean {
  if (filled(input.clientNeed)) return true;
  const subject = input.subject?.trim() ?? "";
  if (!subject) return false;
  return !GENERIC_NEED.test(subject);
}

export function assessVisitQuoteReadiness(
  input: VisitQuoteReadinessInput,
): VisitQuoteReadiness {
  const checks: Array<{ ok: boolean; label: string }> = [
    { ok: filled(input.clientName), label: "client manquant" },
    { ok: hasNeed(input), label: "besoin client manquant" },
    { ok: filled(input.siteAddress), label: "adresse chantier manquante" },
    {
      ok: filled(input.fieldNotes) || (input.measurementCount ?? 0) > 0,
      label: "relevés ou notes terrain manquants",
    },
    {
      ok: filled(input.comments) || Boolean(input.hasConstraints),
      label: "observations ou contraintes manquantes",
    },
  ];
  const missing = checks.filter((c) => !c.ok).map((c) => c.label);
  return {
    ready: missing.length === 0,
    missing,
    done: checks.length - missing.length,
    total: checks.length,
  };
}

export function isVisitReadyToQuote(input: VisitQuoteReadinessInput): boolean {
  return assessVisitQuoteReadiness(input).ready;
}
