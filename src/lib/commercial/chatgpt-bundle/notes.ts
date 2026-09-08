import type { BeworkQuoteBundleV1 } from "@/lib/commercial/chatgpt-bundle/types";
import { calculateLine, roundMoney } from "@/lib/commercial/money";

export function clientDisplayName(bundle: BeworkQuoteBundleV1): string {
  const parts = [bundle.client.firstName, bundle.client.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return bundle.client.company?.trim() || "Client à préciser";
}

export function primaryEmail(bundle: BeworkQuoteBundleV1): string | null {
  return (
    bundle.client.emails.find((e) => e.role === "primary")?.email ??
    bundle.client.emails[0]?.email ??
    null
  );
}

export function buildClientNotesFromBundle(bundle: BeworkQuoteBundleV1): string {
  const parts: string[] = [];
  if (bundle.quote.description) {
    parts.push(bundle.quote.description.trim());
  }
  const advice = bundle.clientAdvice.filter((b) => b.visibility === "client");
  if (advice.length) {
    parts.push("=== Notre préconisation ===");
    for (const a of advice) {
      parts.push(a.title ? `${a.title}\n${a.content}` : a.content);
    }
  }
  if (bundle.workStages.length) {
    parts.push("=== Déroulement prévisionnel des travaux ===");
    for (const s of bundle.workStages) {
      parts.push(
        `${String(s.order).padStart(2, "0")}. ${s.title}${
          s.description ? `\n${s.description}` : ""
        }`,
      );
    }
  }
  const reserves = bundle.reservations.filter((b) => b.visibility === "client");
  if (reserves.length) {
    parts.push("=== Réserves ===");
    for (const r of reserves) {
      parts.push(r.content);
    }
  }
  return parts.join("\n\n").trim();
}

export function buildInternalNotesFromBundle(
  bundle: BeworkQuoteBundleV1,
  fingerprint: string,
  batchId: string,
): string {
  const parts: string[] = [];
  parts.push(`Import ChatGPT (${bundle.format})`);
  parts.push(`chatgptBundleHash:${fingerprint}`);
  parts.push(`chatgptImportBatch:${batchId}`);
  if (bundle.mediaManifest.length) {
    parts.push(
      `<!--bework_media_manifest-->${JSON.stringify(bundle.mediaManifest)}<!--/bework_media_manifest-->`,
    );
  }
  const notes = bundle.internalNotes.filter((b) => b.visibility === "internal");
  if (notes.length) {
    parts.push("=== Notes internes ===");
    for (const n of notes) {
      parts.push(n.title ? `${n.title}\n${n.content}` : n.content);
    }
  }
  if (bundle.warnings.length) {
    parts.push("=== À vérifier avant envoi ===");
    for (const w of bundle.warnings) {
      parts.push(`⚠ ${w}`);
    }
  }
  if (bundle.quote.vatRequiresConfirmation && bundle.quote.vatSuggestedRate != null) {
    parts.push(
      `⚠ TVA proposée ${bundle.quote.vatSuggestedRate} % — à confirmer (suggestion ChatGPT, pas une validation juridique).`,
    );
  }
  return parts.join("\n\n").trim();
}

export function computeBundleTotals(bundle: BeworkQuoteBundleV1): {
  lineCount: number;
  totalHt: number;
  totalVat: number;
  totalTtc: number;
} {
  let lineCount = 0;
  let totalHt = 0;
  let totalVat = 0;
  const defaultVat = bundle.quote.vatSuggestedRate ?? 20;
  for (const sec of bundle.sections) {
    for (const item of sec.items) {
      lineCount += 1;
      const calc = calculateLine({
        kind: "WORK",
        quantity: item.quantity,
        unitCostHt: 0,
        unitSellHt: item.unitPriceHt,
        discountPercent: item.discountPercent ?? 0,
        vatRate: item.vatRate ?? defaultVat,
      });
      totalHt += calc.lineSellHt;
      totalVat += calc.lineVat;
    }
  }
  totalHt = roundMoney(totalHt, 2);
  totalVat = roundMoney(totalVat, 2);
  return { lineCount, totalHt, totalVat, totalTtc: roundMoney(totalHt + totalVat, 2) };
}

export function mergeNotes(existing: string | null | undefined, incoming: string): string {
  const a = (existing ?? "").trim();
  const b = incoming.trim();
  if (!a) return b;
  if (!b) return a;
  if (a.includes(b.slice(0, Math.min(80, b.length)))) return a;
  return `${a}\n\n---\n\n${b}`;
}
