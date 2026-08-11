import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export async function ensureCommercialOrgSettings(orgId: string) {
  return prisma.commercialOrgSettings.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId },
    update: {},
  });
}

function padSeq(n: number): string {
  return String(n).padStart(4, "0");
}

export async function nextQuoteNumber(orgId: string, tx?: Tx): Promise<string> {
  const db = tx ?? prisma;
  const settings = await db.commercialOrgSettings.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId },
    update: {},
  });
  const seq = settings.nextQuoteSeq;
  await db.commercialOrgSettings.update({
    where: { organizationId: orgId },
    data: { nextQuoteSeq: seq + 1 },
  });
  const year = new Date().getFullYear();
  return `${settings.quotePrefix}-${year}-${padSeq(seq)}`;
}

export async function nextInvoiceNumber(orgId: string, tx?: Tx): Promise<string> {
  const db = tx ?? prisma;
  const settings = await db.commercialOrgSettings.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId },
    update: {},
  });
  const seq = settings.nextInvoiceSeq;
  await db.commercialOrgSettings.update({
    where: { organizationId: orgId },
    data: { nextInvoiceSeq: seq + 1 },
  });
  const year = new Date().getFullYear();
  return `${settings.invoicePrefix}-${year}-${padSeq(seq)}`;
}

export async function nextAmendmentNumber(orgId: string, tx?: Tx): Promise<string> {
  const db = tx ?? prisma;
  const settings = await db.commercialOrgSettings.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId },
    update: {},
  });
  const seq = settings.nextAmendmentSeq;
  await db.commercialOrgSettings.update({
    where: { organizationId: orgId },
    data: { nextAmendmentSeq: seq + 1 },
  });
  const year = new Date().getFullYear();
  return `${settings.amendmentPrefix}-${year}-${padSeq(seq)}`;
}

export async function updateCommercialOrgSettings(
  orgId: string,
  data: {
    defaultVatRate?: number;
    defaultCurrency?: string;
    targetMarginPercent?: number | null;
    minMarginPercent?: number | null;
    defaultPaymentTerms?: string | null;
    defaultValidityDays?: number | null;
    defaultDepositPercent?: number | null;
    workDayHours?: number;
    bankIban?: string | null;
    bankBic?: string | null;
    bankName?: string | null;
    insuranceMentions?: string | null;
    legalMentions?: string | null;
    quoteMentions?: string | null;
    invoiceMentions?: string | null;
    accentColor?: string | null;
    quotePrefix?: string;
    invoicePrefix?: string;
    amendmentPrefix?: string;
    creditPrefix?: string;
  },
) {
  await ensureCommercialOrgSettings(orgId);
  return prisma.commercialOrgSettings.update({
    where: { organizationId: orgId },
    data: {
      ...(data.defaultVatRate !== undefined ? { defaultVatRate: data.defaultVatRate } : {}),
      ...(data.defaultCurrency !== undefined ? { defaultCurrency: data.defaultCurrency } : {}),
      ...(data.targetMarginPercent !== undefined
        ? { targetMarginPercent: data.targetMarginPercent }
        : {}),
      ...(data.minMarginPercent !== undefined
        ? { minMarginPercent: data.minMarginPercent }
        : {}),
      ...(data.defaultPaymentTerms !== undefined
        ? { defaultPaymentTerms: data.defaultPaymentTerms }
        : {}),
      ...(data.defaultValidityDays !== undefined
        ? { defaultValidityDays: data.defaultValidityDays }
        : {}),
      ...(data.defaultDepositPercent !== undefined
        ? { defaultDepositPercent: data.defaultDepositPercent }
        : {}),
      ...(data.workDayHours !== undefined ? { workDayHours: data.workDayHours } : {}),
      ...(data.bankIban !== undefined ? { bankIban: data.bankIban } : {}),
      ...(data.bankBic !== undefined ? { bankBic: data.bankBic } : {}),
      ...(data.bankName !== undefined ? { bankName: data.bankName } : {}),
      ...(data.insuranceMentions !== undefined
        ? { insuranceMentions: data.insuranceMentions }
        : {}),
      ...(data.legalMentions !== undefined ? { legalMentions: data.legalMentions } : {}),
      ...(data.quoteMentions !== undefined ? { quoteMentions: data.quoteMentions } : {}),
      ...(data.invoiceMentions !== undefined
        ? { invoiceMentions: data.invoiceMentions }
        : {}),
      ...(data.accentColor !== undefined ? { accentColor: data.accentColor } : {}),
      ...(data.quotePrefix !== undefined ? { quotePrefix: data.quotePrefix } : {}),
      ...(data.invoicePrefix !== undefined ? { invoicePrefix: data.invoicePrefix } : {}),
      ...(data.amendmentPrefix !== undefined ? { amendmentPrefix: data.amendmentPrefix } : {}),
      ...(data.creditPrefix !== undefined ? { creditPrefix: data.creditPrefix } : {}),
    },
  });
}
