import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  ensureCommercialOrgSettings,
  updateCommercialOrgSettings,
} from "@/lib/commercial/settings";
import { d } from "@/lib/commercial/decimal";

function serializeSettings(s: Awaited<ReturnType<typeof ensureCommercialOrgSettings>>) {
  return {
    id: s.id,
    organizationId: s.organizationId,
    defaultVatRate: d(s.defaultVatRate),
    defaultCurrency: s.defaultCurrency,
    targetMarginPercent: s.targetMarginPercent != null ? d(s.targetMarginPercent) : null,
    minMarginPercent: s.minMarginPercent != null ? d(s.minMarginPercent) : null,
    defaultPaymentTerms: s.defaultPaymentTerms,
    defaultValidityDays: s.defaultValidityDays,
    defaultDepositPercent:
      s.defaultDepositPercent != null ? d(s.defaultDepositPercent) : null,
    workDayHours: d(s.workDayHours),
    bankIban: s.bankIban,
    bankBic: s.bankBic,
    bankName: s.bankName,
    insuranceMentions: s.insuranceMentions,
    legalMentions: s.legalMentions,
    quoteMentions: s.quoteMentions,
    invoiceMentions: s.invoiceMentions,
    accentColor: s.accentColor,
    quoteDocumentSettingsJson: s.quoteDocumentSettingsJson ?? {},
    quotePrefix: s.quotePrefix,
    invoicePrefix: s.invoicePrefix,
    amendmentPrefix: s.amendmentPrefix,
    creditPrefix: s.creditPrefix,
  };
}

export async function GET() {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const settings = await ensureCommercialOrgSettings(auth.orgId);
  return NextResponse.json({ settings: serializeSettings(settings) });
}

export async function PATCH(req: Request) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const numOrNull = (v: unknown): number | null | undefined => {
    if (v === undefined) return undefined;
    if (v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const strOrNull = (v: unknown): string | null | undefined => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
  };
  const strRequired = (v: unknown): string | undefined => {
    if (v === undefined) return undefined;
    return String(v).trim();
  };

  try {
    const settings = await updateCommercialOrgSettings(auth.orgId, {
      defaultVatRate:
        body.defaultVatRate !== undefined ? Number(body.defaultVatRate) : undefined,
      defaultCurrency: strRequired(body.defaultCurrency),
      targetMarginPercent: numOrNull(body.targetMarginPercent),
      minMarginPercent: numOrNull(body.minMarginPercent),
      defaultPaymentTerms: strOrNull(body.defaultPaymentTerms),
      defaultValidityDays:
        body.defaultValidityDays !== undefined
          ? body.defaultValidityDays === null || body.defaultValidityDays === ""
            ? null
            : Number(body.defaultValidityDays)
          : undefined,
      defaultDepositPercent: numOrNull(body.defaultDepositPercent),
      workDayHours:
        body.workDayHours !== undefined ? Number(body.workDayHours) : undefined,
      bankIban: strOrNull(body.bankIban),
      bankBic: strOrNull(body.bankBic),
      bankName: strOrNull(body.bankName),
      insuranceMentions: strOrNull(body.insuranceMentions),
      legalMentions: strOrNull(body.legalMentions),
      quoteMentions: strOrNull(body.quoteMentions),
      invoiceMentions: strOrNull(body.invoiceMentions),
      accentColor: strOrNull(body.accentColor),
      quoteDocumentSettingsJson:
        body.quoteDocumentSettingsJson !== undefined
          ? body.quoteDocumentSettingsJson
          : undefined,
      quotePrefix: strRequired(body.quotePrefix),
      invoicePrefix: strRequired(body.invoicePrefix),
      amendmentPrefix: strRequired(body.amendmentPrefix),
      creditPrefix: strRequired(body.creditPrefix),
    });
    return NextResponse.json({ settings: serializeSettings(settings) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur paramètres" },
      { status: 400 },
    );
  }
}
