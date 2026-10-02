/**
 * Signature visuelle métier BeWork — palette + résolution depuis ProjectScope.
 * Réutilisable : header chantier, planning, métré, devis, suivi, documents.
 * UI uniquement — aucune écriture métier.
 */

import {
  getBeWorkFamilyLabel,
  isKnownFamilyCode,
  suggestFamilyCodeFromWorkItem,
  normalizeBeWorkMatchString,
} from "@/lib/bework-devis-family-codes";

export type CraftSignatureTone = {
  /** Clé stable (code famille ou alias ASS). */
  key: string;
  /** Libellé court affiché. */
  label: string;
  /** Accent pastel premium (segments, pastilles). */
  accent: string;
  /** Fond translucide chips. */
  soft: string;
  /** Bordure chip. */
  border: string;
};

/** Palette globale stable — tons pastel / premium, pas d’aplats. */
export const CRAFT_SIGNATURE_PALETTE: Record<string, Omit<CraftSignatureTone, "key">> = {
  TER: {
    label: "Terrassement",
    accent: "#D97757",
    soft: "rgba(217, 119, 87, 0.12)",
    border: "rgba(217, 119, 87, 0.28)",
  },
  MAC: {
    label: "Maçonnerie",
    accent: "#C45C4A",
    soft: "rgba(196, 92, 74, 0.11)",
    border: "rgba(196, 92, 74, 0.26)",
  },
  FON: {
    label: "Fondations",
    accent: "#B45309",
    soft: "rgba(180, 83, 9, 0.10)",
    border: "rgba(180, 83, 9, 0.24)",
  },
  ELE: {
    label: "Électricité",
    accent: "#7C5CFC",
    soft: "rgba(124, 92, 252, 0.11)",
    border: "rgba(124, 92, 252, 0.26)",
  },
  PLO: {
    label: "Plomberie",
    accent: "#1FB6D5",
    soft: "rgba(31, 182, 213, 0.12)",
    border: "rgba(31, 182, 213, 0.28)",
  },
  VRD: {
    label: "VRD",
    accent: "#0E7490",
    soft: "rgba(14, 116, 144, 0.11)",
    border: "rgba(14, 116, 144, 0.26)",
  },
  ASS: {
    label: "Assainissement",
    accent: "#14B8A6",
    soft: "rgba(20, 184, 166, 0.12)",
    border: "rgba(20, 184, 166, 0.28)",
  },
  ESP: {
    label: "Aménagement extérieur",
    accent: "#4F9D6E",
    soft: "rgba(79, 157, 110, 0.12)",
    border: "rgba(79, 157, 110, 0.26)",
  },
  PEI: {
    label: "Peinture",
    accent: "#A78BFA",
    soft: "rgba(167, 139, 250, 0.12)",
    border: "rgba(167, 139, 250, 0.28)",
  },
  COU: {
    label: "Couverture",
    accent: "#173F73",
    soft: "rgba(23, 63, 115, 0.10)",
    border: "rgba(23, 63, 115, 0.24)",
  },
  ETA: {
    label: "Étanchéité",
    accent: "#2563EB",
    soft: "rgba(37, 99, 235, 0.10)",
    border: "rgba(37, 99, 235, 0.24)",
  },
  MEX: {
    label: "Menuiseries",
    accent: "#0D9488",
    soft: "rgba(13, 148, 136, 0.11)",
    border: "rgba(13, 148, 136, 0.26)",
  },
  PLA: {
    label: "Isolation",
    accent: "#64748B",
    soft: "rgba(100, 116, 139, 0.12)",
    border: "rgba(100, 116, 139, 0.24)",
  },
  CHF: {
    label: "Chauffage",
    accent: "#E11D48",
    soft: "rgba(225, 29, 72, 0.09)",
    border: "rgba(225, 29, 72, 0.22)",
  },
  DEM: {
    label: "Démolition",
    accent: "#78716C",
    soft: "rgba(120, 113, 108, 0.12)",
    border: "rgba(120, 113, 108, 0.24)",
  },
  DIV: {
    label: "Divers",
    accent: "#64748B",
    soft: "rgba(100, 116, 139, 0.10)",
    border: "rgba(100, 116, 139, 0.22)",
  },
};

const FALLBACK: Omit<CraftSignatureTone, "key"> = CRAFT_SIGNATURE_PALETTE.DIV!;

/** Libellés courts préférés (header) vs labels lexique longs. */
const SHORT_LABEL_BY_FAMILY: Record<string, string> = {
  TER: "Terrassement",
  MAC: "Maçonnerie",
  ELE: "Électricité",
  PLO: "Plomberie",
  VRD: "VRD",
  ASS: "Assainissement",
  ESP: "Aménagement extérieur",
  PEI: "Peinture",
  COU: "Couverture",
  FON: "Fondations",
  ETA: "Étanchéité",
  MEN: "Menuiseries",
  MEX: "Menuiseries",
  ISO: "Isolation",
  PLA: "Isolation",
  CHF: "Chauffage",
  DEM: "Démolition",
  ECH: "Échafaudages",
  DAL: "Dallage",
  ADM: "Études",
};

export type ProjectScopeCraftInput = {
  code: string;
  name: string;
  status?: string | null;
  description?: string | null;
  referenceQuoteId?: string | null;
};

/** Lot issu d’une section devis — ne pas dériver un métier depuis le libellé. */
export function isLotScopeForSignature(scope: ProjectScopeCraftInput): boolean {
  const desc = scope.description?.trim() ?? "";
  if (/Lot créé depuis le devis/i.test(desc) && /section\s+«/i.test(desc)) {
    return true;
  }
  const name = scope.name?.trim() ?? "";
  if (/^Lot\s+\d+/i.test(name)) return true;
  const code = scope.code?.trim().toUpperCase() ?? "";
  if (/^L\d{1,3}$/.test(code) && /^Lot\b/i.test(name)) return true;
  return false;
}

function toneForKey(key: string, labelOverride?: string): CraftSignatureTone {
  const base = CRAFT_SIGNATURE_PALETTE[key] ?? FALLBACK;
  const label =
    labelOverride?.trim() ||
    SHORT_LABEL_BY_FAMILY[key] ||
    base.label ||
    getBeWorkFamilyLabel(key) ||
    key;
  return {
    key,
    label,
    accent: base.accent,
    soft: base.soft,
    border: base.border,
  };
}

/**
 * Résout une clé craft depuis un scope (code / nom structurés).
 * Alias ASS si le libellé pointe clairement vers l’assainissement.
 */
export function resolveCraftKeyFromScope(scope: ProjectScopeCraftInput): string {
  const code = scope.code?.trim().toUpperCase() ?? "";
  const name = scope.name?.trim() ?? "";
  const hay = normalizeBeWorkMatchString(`${code} ${name}`);

  if (/\bassainissement\b|\begout\b|\bfosse\b|\bepuration\b/.test(hay)) {
    return "ASS";
  }

  // Alias métier fréquents (libellés scope) avant classification générique.
  if (/\bcourants?\s+forts?\b|\belectricit/.test(hay)) return "ELE";
  if (/\bplomber/.test(hay)) return "PLO";
  if (/\bterrass/.test(hay)) return "TER";
  if (/\bmaconner|\bmaçonner|\bgros\s+oeuvre|\bgros\s+œuvre/.test(hay)) return "MAC";
  if (/\bpeinture|\benduit\b/.test(hay)) return "PEI";
  if (/\bcouvertur|\btoiture/.test(hay)) return "COU";
  if (/\bespaces?\s+verts?|\bamenagement\s+exterieur|\baménagement\s+extérieur/.test(hay)) {
    return "ESP";
  }

  if (code && isKnownFamilyCode(code) && code.length <= 4) {
    return code;
  }

  // Codes type L01 / TER-01 → tenter préfixe famille
  const prefix = code.match(/^([A-Z]{3})(?:[-_]|$)/);
  if (prefix?.[1] && isKnownFamilyCode(prefix[1])) {
    return prefix[1];
  }

  const suggested = suggestFamilyCodeFromWorkItem({
    lot: name || code,
    title: name || code,
    itemType: "ouvrage_technique",
  });
  if (suggested) return suggested;

  if (name) {
    // Afficher le nom du scope comme craft « divers » nommé
    return `CUSTOM:${normalizeBeWorkMatchString(name).slice(0, 32)}`;
  }
  return "DIV";
}

export function craftToneFromKey(key: string, scopeName?: string): CraftSignatureTone {
  if (key.startsWith("CUSTOM:")) {
    const label = scopeName?.trim() || "Lot";
    return {
      key,
      label,
      accent: FALLBACK.accent,
      soft: FALLBACK.soft,
      border: FALLBACK.border,
    };
  }
  return toneForKey(key);
}

/**
 * Domaines métier du chantier (scopes non-lot).
 * Les scopes LOT (issus de sections devis) sont exclus — voir resolveLotsFromScopes.
 */
export function resolveCraftsFromScopes(
  scopes: ProjectScopeCraftInput[],
): CraftSignatureTone[] {
  const seen = new Set<string>();
  const out: CraftSignatureTone[] = [];

  for (const scope of scopes) {
    if (scope.status && scope.status !== "ACTIVE") continue;
    if (isLotScopeForSignature(scope)) continue;
    const key = resolveCraftKeyFromScope(scope);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(craftToneFromKey(key, scope.name));
  }

  return out.sort(
    (a, b) =>
      craftSortRank(a.key) - craftSortRank(b.key) ||
      a.label.localeCompare(b.label, "fr"),
  );
}

/**
 * Lots du chantier (scopes issus de sections devis / libellés Lot NN).
 * Affichés tels quels — jamais remappés en « Démolition » via mot-clé.
 */
export function resolveLotsFromScopes(
  scopes: ProjectScopeCraftInput[],
): CraftSignatureTone[] {
  const seen = new Set<string>();
  const out: CraftSignatureTone[] = [];

  for (const scope of scopes) {
    if (scope.status && scope.status !== "ACTIVE") continue;
    if (!isLotScopeForSignature(scope)) continue;
    const key = `LOT:${scope.code || normalizeBeWorkMatchString(scope.name).slice(0, 24)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      key,
      label: scope.name.trim() || scope.code,
      accent: FALLBACK.accent,
      soft: FALLBACK.soft,
      border: FALLBACK.border,
    });
  }

  return out;
}

/**
 * Signature affichable : métiers d’abord, puis lots si aucun métier
 * (évite une barre vide sur chantiers 100 % lots devis).
 */
export function resolveSignatureDomainsFromScopes(
  scopes: ProjectScopeCraftInput[],
): { crafts: CraftSignatureTone[]; lots: CraftSignatureTone[]; display: CraftSignatureTone[] } {
  const crafts = resolveCraftsFromScopes(scopes);
  const lots = resolveLotsFromScopes(scopes);
  const display = crafts.length > 0 ? [...crafts, ...lots] : lots;
  return { crafts, lots, display };
}

const CRAFT_SORT_ORDER = [
  "TER",
  "FON",
  "DAL",
  "MAC",
  "DEM",
  "ECH",
  "VRD",
  "ASS",
  "COU",
  "ETA",
  "MEX",
  "MEN",
  "PLA",
  "ISO",
  "ELE",
  "PLO",
  "CHF",
  "PEI",
  "ESP",
  "ADM",
  "DIV",
] as const;

function craftSortRank(key: string): number {
  if (key.startsWith("CUSTOM:")) return 900;
  const idx = (CRAFT_SORT_ORDER as readonly string[]).indexOf(key);
  return idx >= 0 ? idx : 800;
}

/** Identifiant technique court pour la signature (pas un numéro métier inventé). */
export function projectSignatureRef(projectId: string): string {
  return projectId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
}

/**
 * Alias design system — source unique pour badges / barre / chips.
 * Préférer ce nom dans les nouveaux modules (métré, devis, planning…).
 */
export const tradeVisualConfig = CRAFT_SIGNATURE_PALETTE;
