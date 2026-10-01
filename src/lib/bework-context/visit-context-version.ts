/**
 * CTX-07 — Version de contexte VISIT dérivée (lecture seule, déterministe).
 *
 * bework_patch_v1 exige `origin.base_version` entier ≥ 1.
 * On calcule une empreinte SHA-256 du payload ChatGPT exposé, puis on encode
 * les 6 premiers octets en entier uint48 (∈ [1, 2^48−1]) — pas un parseInt(hex).
 */
import { createHash } from "node:crypto";

/** État métier vu par ChatGPT pour une visite (sous-ensemble versionné). */
export type VisitContextVersionInput = {
  id: string;
  subject: string;
  status: string;
  clientName: string;
  siteAddress: string;
  clientNeed: string | null;
  comments: string | null;
  measurements: Array<{
    id: string;
    zone: string | null;
    label: string;
    measureType: string | null;
    unit: string;
    lengthM: number | null;
    widthM: number | null;
    heightM: number | null;
    quantityValue: number | null;
    computedQuantity: number;
    lot: string | null;
    observation: string | null;
  }>;
  mediaRefs: Array<{
    id: string;
    name: string | null;
    kind: string | null;
    category: string | null;
    observation: string | null;
    hasUrl: boolean;
  }>;
};

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      out[key] = sortKeysDeep(obj[key]);
    }
    return out;
  }
  return value;
}

/**
 * JSON canonique : clés triées, collections métier triées par id.
 * Une lecture seule ne change jamais le résultat.
 */
export function canonicalizeVisitContextPayload(
  input: VisitContextVersionInput,
): string {
  const measurements = [...input.measurements]
    .map((m) => ({
      id: m.id,
      zone: m.zone ?? null,
      label: m.label,
      measure_type: m.measureType ?? null,
      unit: m.unit,
      length_m: m.lengthM,
      width_m: m.widthM,
      height_m: m.heightM,
      quantity_value: m.quantityValue,
      computed_quantity: m.computedQuantity,
      lot: m.lot ?? null,
      observation: m.observation ?? null,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const mediaRefs = [...input.mediaRefs]
    .map((m) => ({
      id: m.id,
      name: m.name ?? null,
      kind: m.kind ?? null,
      category: m.category ?? null,
      observation: m.observation ?? null,
      has_url: m.hasUrl,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const payload = {
    visit_id: input.id,
    subject: input.subject,
    status: input.status,
    client_name: input.clientName,
    site_address: input.siteAddress,
    client_need: input.clientNeed ?? null,
    comments: input.comments ?? null,
    measurements,
    media_refs: mediaRefs,
  };

  return JSON.stringify(sortKeysDeep(payload));
}

/**
 * Encode SHA-256 → entier positif compatible base_version (uint48).
 * N’utilise pas parseInt(hash) : lecture binaire big-endian des 6 premiers octets.
 */
export function digestToBaseVersion(digest: Buffer): number {
  let n = 0;
  for (let i = 0; i < 6; i++) {
    n = n * 256 + (digest[i] ?? 0);
  }
  return n === 0 ? 1 : n;
}

export function computeVisitContextVersion(
  input: VisitContextVersionInput,
): number {
  const canonical = canonicalizeVisitContextPayload(input);
  const digest = createHash("sha256").update(canonical, "utf8").digest();
  return digestToBaseVersion(digest);
}

/** Comparaison stale pour preview / futur commit VISIT. */
export function isVisitContextStale(input: {
  baseVersion: number;
  currentVersion: number;
}): boolean {
  return input.baseVersion !== input.currentVersion;
}
