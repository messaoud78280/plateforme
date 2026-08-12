/**
 * Construit l’entrée PDF à partir d’une VERSION précise (pas « la courante »).
 * Snapshots contractuels de la version en priorité.
 */
import { d } from "@/lib/commercial/decimal";
import type { QuotePdfInput, QuotePdfSnapshot } from "@/lib/commercial/pdf-quote";
import { parsePaymentSchedule } from "@/lib/commercial/payment-schedule";

export type QuotePdfVersionSource = {
  id: string;
  versionNumber: number;
  clientSnapshotJson: unknown;
  issuerSnapshotJson: unknown;
  paymentTerms: string | null;
  paymentScheduleJson?: unknown;
  clientNotes: string | null;
  totalSellHt: unknown;
  totalVat: unknown;
  totalTtc: unknown;
  sections: Array<{ id: string; title: string; sortOrder: number }>;
  lines: Array<{
    sectionId: string | null;
    kind: string;
    reference: string | null;
    designation: string;
    description?: string | null;
    quantity: unknown;
    unit: string;
    unitSellHt: unknown;
    vatRate: unknown;
    lineSellHt: unknown;
    isOptional: boolean;
    sortOrder: number;
  }>;
};

export type QuotePdfHeaderSource = {
  number: string;
  subject: string;
  status: string;
  issueDate: Date;
  validityDate?: Date | null;
  paymentTerms?: string | null;
  paymentScheduleJson?: unknown;
  clientNotes?: string | null;
  siteAddressSnapshot?: string | null;
  clientSnapshotJson?: unknown;
  issuerSnapshotJson?: unknown;
  currency: string;
  projectTitle?: string | null;
};

function asSnapshot(raw: unknown): QuotePdfSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as QuotePdfSnapshot;
}

function mapLine(l: QuotePdfVersionSource["lines"][number]) {
  return {
    kind: l.kind,
    reference: l.reference,
    designation: l.designation,
    description: l.description ?? null,
    quantity: d(l.quantity),
    unit: l.unit,
    unitSellHt: d(l.unitSellHt),
    vatRate: d(l.vatRate),
    lineSellHt: d(l.lineSellHt),
    isOptional: l.isOptional,
  };
}

export function buildQuotePdfInputFromVersion(opts: {
  quote: QuotePdfHeaderSource;
  version: QuotePdfVersionSource;
  statusForPdf?: string;
  quoteMentions?: string | null;
  legalMentions?: string | null;
}): QuotePdfInput {
  const { quote, version } = opts;
  const sections = [...version.sections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({
      title: s.title,
      lines: version.lines
        .filter((l) => l.sectionId === s.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(mapLine),
    }));

  const orphanLines = version.lines
    .filter((l) => !l.sectionId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (orphanLines.length) {
    sections.push({
      title: "Divers",
      lines: orphanLines.map(mapLine),
    });
  }

  const schedule =
    parsePaymentSchedule(version.paymentScheduleJson) ??
    parsePaymentSchedule(quote.paymentScheduleJson);

  return {
    number: quote.number,
    subject: quote.subject,
    status: opts.statusForPdf ?? quote.status,
    issueDate: quote.issueDate,
    validityDate: quote.validityDate ?? null,
    paymentTerms: version.paymentTerms ?? quote.paymentTerms ?? null,
    paymentSchedule: schedule,
    clientNotes: version.clientNotes ?? quote.clientNotes ?? null,
    siteAddressSnapshot: quote.siteAddressSnapshot ?? null,
    projectTitle: quote.projectTitle ?? null,
    versionNumber: version.versionNumber,
    issuer: asSnapshot(version.issuerSnapshotJson) ?? asSnapshot(quote.issuerSnapshotJson),
    client: asSnapshot(version.clientSnapshotJson) ?? asSnapshot(quote.clientSnapshotJson),
    currency: quote.currency,
    quoteMentions: opts.quoteMentions ?? null,
    legalMentions: opts.legalMentions ?? null,
    totals: {
      totalSellHt: d(version.totalSellHt),
      totalVat: d(version.totalVat),
      totalTtc: d(version.totalTtc),
    },
    sections,
  };
}
