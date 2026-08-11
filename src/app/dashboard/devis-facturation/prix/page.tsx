import { PageHeader } from "@/components/ui/PageHeader";
import { PrixPageClient } from "@/components/commercial/PrixPageClient";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import {
  listEquipmentResources,
  listLaborResources,
  listMaterials,
} from "@/lib/commercial/library";

export const dynamic = "force-dynamic";

export default async function PrixPage() {
  const session = await requireCommercialSession("/dashboard/devis-facturation/prix");
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;

  const [materials, labor, equipment] = await Promise.all([
    listMaterials(orgId),
    listLaborResources(orgId),
    listEquipmentResources(orgId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Devis & Facturation · Référentiel"
        title="Prix"
        description="Matériaux, main-d’œuvre et matériel — historique et coûts de base."
      />
      <PrixPageClient
        materials={materials}
        labor={labor}
        equipment={equipment}
      />
    </div>
  );
}
