import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  isSupplierPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/purchase-orders/status";

export const dynamic = "force-dynamic";

export default async function LivraisonsFournisseurPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/livraisons");
  if (!isSupplierPurchaseOrderActor(session.user)) redirect("/dashboard/commandes");

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { externalOrganizationId: true },
  });
  if (!orgId || !u?.externalOrganizationId) redirect("/dashboard");

  const orders = await prisma.purchaseOrder.findMany({
    where: {
      organizationId: orgId,
      externalOrganizationId: u.externalOrganizationId,
      sharedWithSupplier: true,
      OR: [
        { requestedDeliveryAt: { not: null } },
        { confirmedDeliveryAt: { not: null } },
      ],
      status: { notIn: ["ANNULEE"] },
    },
    select: {
      id: true,
      number: true,
      subject: true,
      status: true,
      requestedDeliveryAt: true,
      confirmedDeliveryAt: true,
      proposedDeliveryStatus: true,
      organization: { select: { name: true } },
      project: { select: { title: true } },
      lines: {
        take: 3,
        orderBy: { sortOrder: "asc" },
        select: { designation: true, quantity: true, unit: true, receivedQty: true },
      },
    },
    orderBy: [{ confirmedDeliveryAt: "asc" }, { requestedDeliveryAt: "asc" }],
    take: 80,
  });

  const now = Date.now();
  const aConfirmer = orders.filter((o) =>
    ["A_CONFIRMER", "ENVOYEE_FOURNISSEUR"].includes(o.status),
  );
  const confirmees = orders.filter(
    (o) =>
      ["CONFIRMEE", "LIVRAISON_PROGRAMMEE", "PARTIELLEMENT_RECUE"].includes(o.status) &&
      o.status !== "RECUE",
  );
  const passees = orders.filter((o) => o.status === "RECUE" || o.status === "CLOTUREE");

  function Card({
    o,
  }: {
    o: (typeof orders)[number];
  }) {
    const when = o.confirmedDeliveryAt ?? o.requestedDeliveryAt;
    const line = o.lines[0];
    return (
      <li className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {when
            ? new Date(when).toLocaleString("fr-FR", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </p>
        <p className="mt-1 font-semibold text-slate-900">{o.organization.name}</p>
        {o.project?.title ? (
          <p className="text-sm text-slate-700">{o.project.title}</p>
        ) : null}
        <p className="mt-1 text-sm text-slate-600">
          {o.number}
          {line
            ? ` · ${Number(line.receivedQty)} / ${Number(line.quantity)} ${line.unit} ${line.designation}`
            : ` · ${o.subject}`}
        </p>
        {(() => {
          const rem = o.lines.reduce(
            (s, l) => s + Math.max(0, Number(l.quantity) - Number(l.receivedQty)),
            0,
          );
          return rem > 0 && o.status === "PARTIELLEMENT_RECUE" ? (
            <p className="mt-1 text-xs font-semibold text-amber-800">{rem} restant à livrer</p>
          ) : null;
        })()}
        <p className="mt-2 text-xs font-bold uppercase text-[#1e3a5f]">
          {PURCHASE_ORDER_STATUS_LABELS[o.status] ?? o.status}
        </p>
        <Link
          href={`/dashboard/commandes/${o.id}`}
          className="mt-3 inline-block text-xs font-semibold text-[#1d4ed8]"
        >
          Voir la commande →
        </Link>
      </li>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">Accueil</BackLink>
      <PageHeader
        eyebrow="Espace fournisseur"
        title="Livraisons"
        description="Uniquement vos créneaux partagés — pas l’agenda interne de l’entreprise."
      />

      {orders.length === 0 ? (
        <EmptyState
          title="Aucune livraison"
          description="Les commandes partagées avec une date de livraison apparaîtront ici."
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900">
              À confirmer
            </h2>
            {aConfirmer.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Rien en attente.</p>
            ) : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {aConfirmer.map((o) => (
                  <Card key={o.id} o={o} />
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-900">
              Confirmées
            </h2>
            {confirmees.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Aucune livraison confirmée à venir.</p>
            ) : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {confirmees.map((o) => (
                  <Card key={o.id} o={o} />
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Passées</h2>
            {passees.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">—</p>
            ) : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {passees.map((o) => (
                  <Card key={o.id} o={o} />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
