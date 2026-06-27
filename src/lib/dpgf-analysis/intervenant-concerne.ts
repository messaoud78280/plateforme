import { isWhoDoesItLikelyMisassigned } from "./resolve-who-does-it";

/** Affiché lorsque l'intervenant n'a pas été renseigné explicitement. */
export const INTERVENANT_CONCERNE_DEFAULT = "À définir selon le marché";

export function formatLotDpgfDisplay(lot: string, lotNote?: string | null): string {
  const code = lot.trim();
  const note = lotNote?.trim();
  if (!code && !note) return "—";
  if (note) {
    if (/^lot\s/i.test(note)) return note;
    if (code && note.toLowerCase().includes(code.toLowerCase())) return note;
    return code ? `Lot ${code} — ${note}` : note;
  }
  return /^lot\s/i.test(code) ? code : `Lot ${code}`;
}

export function formatLotLieDisplay(lotNote?: string | null, linkedLots?: string | null, lot?: string): string {
  const linked = linkedLots?.trim();
  if (linked) return linked;
  const note = lotNote?.trim();
  if (note) return formatLotDpgfDisplay(lot ?? "", note);
  if (lot?.trim()) return formatLotDpgfDisplay(lot, null);
  return "—";
}

/** Valeur brute enregistrée (sans placeholder). */
export function readIntervenantConcerneRaw(
  intervenantConcerne: string | null | undefined,
  whoDoesItFallback?: string | null,
): string {
  const primary = String(intervenantConcerne ?? "").trim();
  if (primary) return primary;
  return String(whoDoesItFallback ?? "").trim();
}

/** Affichage fiche : jamais de déduction depuis le lot seul. */
export function displayIntervenantConcerne(
  intervenantConcerne: string | null | undefined,
  whoDoesItFallback: string | null | undefined,
  context: {
    linkedLots?: string;
    familyName?: string;
    lotLabel?: string;
  } = {},
): string {
  const raw = readIntervenantConcerneRaw(intervenantConcerne, whoDoesItFallback);
  if (!raw) return INTERVENANT_CONCERNE_DEFAULT;
  if (
    isWhoDoesItLikelyMisassigned(raw, context.linkedLots ?? "", context.familyName ?? "", context.lotLabel ?? "")
  ) {
    return INTERVENANT_CONCERNE_DEFAULT;
  }
  return raw;
}

export function isIntervenantExplicitlySet(
  intervenantConcerne: string | null | undefined,
  whoDoesItFallback: string | null | undefined,
  context: {
    linkedLots?: string;
    familyName?: string;
    lotLabel?: string;
  } = {},
): boolean {
  const raw = readIntervenantConcerneRaw(intervenantConcerne, whoDoesItFallback);
  if (!raw) return false;
  return !isWhoDoesItLikelyMisassigned(
    raw,
    context.linkedLots ?? "",
    context.familyName ?? "",
    context.lotLabel ?? "",
  );
}
