import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  daysRemainingInTrial,
  effectiveSaasStatus,
  SAAS_TRIAL_DAYS,
} from "@/lib/organization/lifecycle";
import {
  scoreOrganizationActivation,
  activationBandLabel,
  formatRelativeActivity,
} from "@/lib/platform-admin/metrics";
import { OrgAdminActions } from "@/components/platform-admin/OrgAdminActions";

export default async function AdminOrgDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      kind: true,
      siret: true,
      saasStatus: true,
      trialStartedAt: true,
      trialEndsAt: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          lastLoginAt: true,
          secteurActivite: true,
          service: true,
          accountStatus: true,
        },
      },
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          role: true,
          status: true,
          user: {
            select: {
              name: true,
              email: true,
              permissionProfile: true,
              accessStatus: true,
            },
          },
        },
      },
    },
  });

  if (!org) notFound();

  const activation = await scoreOrganizationActivation(org.id);
  const status = effectiveSaasStatus(org);
  const days = daysRemainingInTrial(org);

  const audit = await prisma.platformAdminAuditEvent.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      action: true,
      context: true,
      createdAt: true,
      actor: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/organisations" className="text-[13px] text-bework-accent hover:underline">
          ← Entreprises
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-bework-navy">
          {org.name}
        </h2>
        <p className="mt-1 text-[13px] text-slate-500">
          {org.kind === "DEMO" ? "Environnement DEMO" : "Organisation STANDARD"}
          {org.siret ? ` · SIRET ${org.siret}` : ""}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Statut", value: status },
          {
            label: "Création",
            value: org.createdAt.toLocaleDateString("fr-FR"),
          },
          {
            label: "Fin essai",
            value: org.trialEndsAt
              ? org.trialEndsAt.toLocaleDateString("fr-FR")
              : "—",
          },
          {
            label: "Jours restants",
            value: days != null ? String(days) : "—",
          },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-bework-navy/10 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {k.label}
            </p>
            <p className="mt-1 text-[15px] font-semibold text-bework-ink">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-sm">
          <h3 className="text-[15px] font-semibold text-bework-navy">Fiche SaaS</h3>
          <dl className="space-y-2 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Owner</dt>
              <dd className="text-right font-medium">
                {org.owner.name}
                <br />
                <span className="text-[12px] font-normal text-slate-500">{org.owner.email}</span>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Compte owner</dt>
              <dd className="font-medium">{org.owner.accountStatus}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Corps de métier</dt>
              <dd className="text-right font-medium">{org.owner.secteurActivite ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Taille</dt>
              <dd className="font-medium">{org.owner.service ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Dernière activité</dt>
              <dd className="font-medium">{formatRelativeActivity(org.owner.lastLoginAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Activation</dt>
              <dd className="text-right font-medium">
                {activation.percent} % — {activationBandLabel(activation.band)}
              </dd>
            </div>
          </dl>
          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
            {[
              ["Utilisateurs", activation.counts.members],
              ["Clients", activation.counts.clients],
              ["Chantiers", activation.counts.projects],
              ["Devis", activation.counts.quotes],
              ["Documents", activation.counts.documents],
              ["Commandes", activation.counts.purchaseOrders],
            ].map(([l, v]) => (
              <div key={String(l)} className="rounded-xl bg-slate-50 px-2 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">{l}</p>
                <p className="text-[16px] font-semibold tabular-nums">{v as number}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            Volumes uniquement — aucun contenu devis / document / message exposé ici.
          </p>
        </div>

        <OrgAdminActions
          organizationId={org.id}
          organizationName={org.name}
          status={status}
        />
      </div>

      <div className="rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-sm">
        <h3 className="text-[15px] font-semibold text-bework-navy">Utilisateurs</h3>
        <ul className="mt-3 divide-y divide-slate-100">
          {org.members.map((m) => (
            <li key={m.user.email} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
              <div>
                <p className="font-semibold">{m.user.name}</p>
                <p className="text-slate-500">{m.user.email}</p>
              </div>
              <div className="text-right text-[12px] text-slate-600">
                <p>
                  {m.role}
                  {m.user.permissionProfile ? ` · ${m.user.permissionProfile}` : ""}
                </p>
                <p>
                  {m.status} / {m.user.accessStatus}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-sm">
        <h3 className="text-[15px] font-semibold text-bework-navy">Historique admin</h3>
        <ul className="mt-3 space-y-2 text-[13px]">
          {audit.length === 0 ? (
            <li className="text-slate-500">Aucune action journalisée.</li>
          ) : (
            audit.map((e) => (
              <li key={e.id} className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="font-medium">
                  {e.createdAt.toLocaleString("fr-FR")} — {e.action}
                </p>
                <p className="text-[12px] text-slate-500">
                  {e.actor.name} · {e.context ?? "—"}
                </p>
              </li>
            ))
          )}
        </ul>
      </div>

      {status === "TRIAL" && days != null ? (
        <p className="text-[12px] text-slate-500">
          Essai J{SAAS_TRIAL_DAYS - days} / {SAAS_TRIAL_DAYS}
        </p>
      ) : null}
    </div>
  );
}
