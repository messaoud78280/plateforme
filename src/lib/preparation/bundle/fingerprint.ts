import { createHash } from "node:crypto";

function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.keys(v as Record<string, unknown>)
        .sort()
        .map((k) => [k, canonical((v as Record<string, unknown>)[k])]),
    );
  }
  return v;
}

/** Empreinte stable d'un bundle (ordre des clés indifférent). */
export function prepBundleFingerprint(bundle: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(canonical(bundle))).digest("hex").slice(0, 32);
}
