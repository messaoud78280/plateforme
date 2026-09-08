import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { formatQuoteNumber } from "@/lib/commercial/quote-number";

type Tx = Prisma.TransactionClient;

export async function ensureCommercialOrgSettings(orgId: string) {
  return prisma.commercialOrgSettings.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId },
    update: {},
  });
}

export async function nextQuoteNumber(orgId: string, tx?: Tx): Promise<string> {
  const db = tx ?? prisma;
  const settings = await db.commercialOrgSettings.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId },
    update: {},
  });
  const year = new Date().getFullYear();
  let seq = settings.nextQuoteSeq;

  for (let attempt = 0; attempt < 1000; attempt++) {
    const candidate = formatQuoteNumber(settings.quotePrefix, seq, year);
    const existing = await db.commercialQuote.findFirst({
      where: { organizationId: orgId, number: candidate },
      select: { id: true },
    });
    if (!existing) {
      await db.commercialOrgSettings.update({
        where: { organizationId: orgId },
        data: { nextQuoteSeq: seq + 1 },
      });
      return candidate;
    }
    seq += 1;
  }
  throw new Error("Impossible d'allouer un numéro de devis unique");
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
  return formatQuoteNumber(settings.invoicePrefix, seq, year);
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
  return formatQuoteNumber(settings.amendmentPrefix, seq, year);
}

async function assertQuoteNumberAvailable(
  orgId: string,
  number: string,
  excludeQuoteId?: string,
) {
  const clash = await prisma.commercialQuote.findFirst({
    where: {
      organizationId: orgId,
      number,
      ...(excludeQuoteId ? { NOT: { id: excludeQuoteId } } : {}),
    },
    select: { id: true, number: true },
  });
  if (clash) {
    throw new Error(
      `La référence ${number} est déjà utilisée sur un autre devis de cette organisation`,
    );
  }
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
    quoteDocumentSettingsJson?: unknown;
    quotePrefix?: string;
    invoicePrefix?: string;
    amendmentPrefix?: string;
    creditPrefix?: string;
    nextQuoteSeq?: number;
  },
) {
  const current = await ensureCommercialOrgSettings(orgId);

  if (data.nextQuoteSeq !== undefined) {
    if (!Number.isInteger(data.nextQuoteSeq) || data.nextQuoteSeq < 1) {
      throw new Error("Le prochain numéro de devis doit être un entier ≥ 1");
    }
    const prefix = (data.quotePrefix ?? current.quotePrefix).trim() || "DEV";
    const year = new Date().getFullYear();
    const preview = formatQuoteNumber(prefix, data.nextQuoteSeq, year);
    await assertQuoteNumberAvailable(orgId, preview);
  }

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
      ...(data.quoteDocumentSettingsJson !== undefined
        ? {
            quoteDocumentSettingsJson:
              data.quoteDocumentSettingsJson === null
                ? Prisma.DbNull
                : (data.quoteDocumentSettingsJson as Prisma.InputJsonValue),
          }
        : {}),
      ...(data.quotePrefix !== undefined ? { quotePrefix: data.quotePrefix } : {}),
      ...(data.invoicePrefix !== undefined ? { invoicePrefix: data.invoicePrefix } : {}),
      ...(data.amendmentPrefix !== undefined ? { amendmentPrefix: data.amendmentPrefix } : {}),
      ...(data.creditPrefix !== undefined ? { creditPrefix: data.creditPrefix } : {}),
      ...(data.nextQuoteSeq !== undefined ? { nextQuoteSeq: data.nextQuoteSeq } : {}),
    },
  });
}

export { assertQuoteNumberAvailable };
