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
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link
        href="/dashboard/catalogue-materiaux"
        className="text-xs font-semibold text-[#1e3a5f] hover:underline"
      >
        ← Catalogue Matériaux
      </Link>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {material.family}
      </p>
      <h1 className="mt-1 text-xl font-bold text-[#1e3a5f]">
        {material.designation}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Unité {material.unit} · statut {material.status} ·{" "}
        {material.productCount} produit(s) · {material.offerCount} offre(s)
      </p>
      {material.description ? (
        <p className="mt-4 text-sm leading-relaxed text-slate-700">
          {material.description}
        </p>
      ) : (
        <p className="mt-4 text-sm italic text-slate-400">
          Aucune description technique.
        </p>
      )}

      <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5">
        <p className="text-sm font-semibold text-slate-800">
          Fiche 3 colonnes (produits, fournisseurs, prix)
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Disponible en Phase 2 — même disposition que l’Étude
          d’approvisionnement, sans quantités chantier.
        </p>
      </div>

      {material.products.length > 0 ? (
        <ul className="mt-6 space-y-2">
          {material.products.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <p className="text-sm font-semibold text-slate-900">{p.label}</p>
              <p className="text-xs text-slate-500">
                {[p.manufacturer, p.manufacturerRef, p.gtin]
                  .filter(Boolean)
                  .join(" · ") || "Sans référence fabricant"}
                {" · "}
                {p.offerCount} offre(s)
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
