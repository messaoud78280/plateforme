import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { listCatalogMaterials } from "@/lib/catalog/service";
import { CatalogMateriauxClient } from "@/components/catalog/CatalogMateriauxClient";

export const dynamic = "force-dynamic";

export default async function CatalogueMateriauxPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; family?: string }>;
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

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const family = typeof sp.family === "string" ? sp.family : "";

  const result = await listCatalogMaterials({
    organizationId: orgId,
    q: q || null,
    family: family || null,
    page: 1,
    pageSize: 24,
  });

  return (
    <CatalogMateriauxClient
      initialItems={result.items}
      initialTotal={result.total}
      initialFamilies={result.families}
      initialQ={q}
      initialFamily={family}
      canWrite={true}
    />
  );
}
