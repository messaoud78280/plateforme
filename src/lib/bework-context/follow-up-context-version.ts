/**
 * CTX-02C — Version FOLLOW_UP déterministe (sans migration).
 *
 * Le contexte ChatGPT n’expose que des champs parent FollowUpSheet
 * (title, status, notes, prep_schedule_plan_id). Une empreinte sur cet
 * état évite la collision d’une seconde wall-clock (updatedAt epoch)
 * et reste fiable tant que le commit ne touche que ce sous-ensemble.
 */
import { createHash } from "node:crypto";
import { digestToBaseVersion } from "@/lib/bework-context/visit-context-version";

export type FollowUpContextVersionInput = {
  id: string;
  title: string;
  status: string;
  notes: string | null;
  prepSchedulePlanId: string | null;
};

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
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

export function canonicalizeFollowUpContextPayload(
  input: FollowUpContextVersionInput,
): string {
  const payload = {
    follow_up_id: input.id,
    title: input.title,
    status: input.status,
    notes: input.notes ?? null,
    prep_schedule_plan_id: input.prepSchedulePlanId ?? null,
  };
  return JSON.stringify(sortKeysDeep(payload));
}

export function computeFollowUpContextVersion(
  input: FollowUpContextVersionInput,
): number {
  const canonical = canonicalizeFollowUpContextPayload(input);
  const digest = createHash("sha256").update(canonical, "utf8").digest();
  return digestToBaseVersion(digest);
}
