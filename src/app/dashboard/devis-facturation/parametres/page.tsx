import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { ensureCommercialOrgSettings } from "@/lib/commercial/settings";
import { d } from "@/lib/commercial/decimal";
import { SettingsForm, type CommercialSettingsFormValues } from "@/components/commercial/SettingsForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ParametresCommerciauxPage() {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/parametres",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) notFound();

  const s = await ensureCommercialOrgSettings(orgId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Devis & Facturation · Référentiel"
        title="Paramètres"
        description="TVA, marges, préfixes, mentions et coordonnées bancaires — à valider avant engagement client."
      />
      <SettingsForm
        initial={{
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
          quoteDocumentSettingsJson:
            (s.quoteDocumentSettingsJson as CommercialSettingsFormValues["quoteDocumentSettingsJson"]) ??
            {},
          quotePrefix: s.quotePrefix,
          invoicePrefix: s.invoicePrefix,
          amendmentPrefix: s.amendmentPrefix,
          creditPrefix: s.creditPrefix,
        }}
      />
    </div>
  );
}
