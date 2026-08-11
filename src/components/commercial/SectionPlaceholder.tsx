import { PageHeader } from "@/components/ui/PageHeader";
import { requireCommercialSession } from "@/lib/commercial/access";

export async function SectionPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  await requireCommercialSession();
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Devis & Facturation · Référentiel" title={title} description={description} />
      <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
        Section partielle / en construction — le backend existe ; l’UI s’enrichit progressivement.
      </p>
    </div>
  );
}
