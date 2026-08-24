import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireCommercialSession } from "@/lib/commercial/access";
import { ImportQuoteWizard } from "@/components/commercial/ImportQuoteWizard";

export const dynamic = "force-dynamic";

export default async function ImportDevisPage() {
  await requireCommercialSession("/dashboard/devis-facturation/devis/import");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Devis & Facturation"
          title="Importer un devis"
          description="Transformez un PDF, Excel ou CSV en devis BeWork éditable — sans ressaisie."
        />
        <Link
          href="/dashboard/devis-facturation/devis"
          className="text-[13px] font-semibold text-bework-accent hover:underline"
        >
          ← Retour aux devis
        </Link>
      </div>
      <ImportQuoteWizard />
    </div>
  );
}
