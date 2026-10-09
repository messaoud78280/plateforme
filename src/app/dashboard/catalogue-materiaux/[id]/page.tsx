import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { getCatalogMaterial } from "@/lib/catalog/service";
import { CatalogStudyPanel } from "@/components/catalog/CatalogStudyDialog";

export const dynamic = "force-dynamic";

export default async function CatalogueMateriauDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/catalogue-materiaux");
  }
  if (!isInternalPurchaseOrderActor(session.user)) redirect("/dashboard");
  assertDashboardHrefAllowed({
    href: "/dashboard/catalogue-materiaux",
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) redirect("/dashboard");

  const { id } = await params;
  const material = await getCatalogMaterial({ organizationId: orgId, id });
  if (!material) notFound();

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-4 sm:px-5">
      <Link
        href="/dashboard/catalogue-materiaux"
        className="text-xs font-semibold text-[#1e3a5f] hover:underline"
      >
        ← Catalogue Matériaux
      </Link>
      <div className="mt-3">
        <CatalogStudyPanel materialId={material.id} canWrite />
      </div>
    </div>
  );
}
