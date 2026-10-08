/**
 * Date limite de commande — uniquement si délai fournisseur réel connu.
 * Jamais de délai inventé.
 */

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addCalendarDays(d: Date, days: number): Date {
  const out = new Date(d.getTime());
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

/**
 * @returns null si neededAt ou leadTimeDays manquant / invalide
 */
export function computeOrderDeadline(input: {
  neededAt: Date | null | undefined;
  /** Jours calendaires — uniquement si saisi / confirmé (jamais inventé) */
  supplierLeadTimeDays: number | null | undefined;
}): Date | null {
  if (!input.neededAt) return null;
  const lead = input.supplierLeadTimeDays;
  if (lead == null || !Number.isFinite(lead) || lead < 0) return null;
  const need = startOfUtcDay(input.neededAt);
  const days = Math.ceil(lead);
  return addCalendarDays(need, -days);
}
