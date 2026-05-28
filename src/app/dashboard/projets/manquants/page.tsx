import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BackLink } from "@/components/ui/BackLink";
import {
  CHANTIER_FILE_STATUS_COLORS,
  CHANTIER_FILE_STATUS_LABELS,
  CHANTIER_MISSING_STATUSES,
} from "@/lib/chantier-dossier/constants";
import { isChantierStaff } from "@/lib/chantier-dossier/access";

export default async function ChantierManquantsPage({
  searchParams,
}: {
  searchParams: Promise<{ chantier?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/projets/manquants");

  const params = await searchParams;
  const chantierId = params.chantier?.trim() || null;

  const staff = isChantierStaff(session.user.role);
  const whereProject = staff
    ? session.user.role === "AGENT"
      ? { assignedToId: session.user.id }
      : {}
    : { clientId: session.user.id };

  const files = await prisma.chantierFile.findMany({
    where: {
      status: { in: CHANTIER_MISSING_STATUSES },
      project: { ...whereProject, ...(chantierId ? { id: chantierId } : {}) },
    },
    include: {
      project: { select: { id: true, title: true, siteCity: true } },
      folder: { select: { code: true, label: true } },
      client: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard/projets">Retour aux chantiers</BackLink>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pièces à récupérer (manquantes / à relancer)</h1>
        <p className="mt-1 text-slate-600">
          Vue de suivi pour récupérer les documents chantier — devis, assurances ST, BL, DOE…
          {chantierId ? " (filtré sur un chantier)" : ""}
        </p>
      </div>

      {files.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          Aucune pièce à récupérer pour le moment.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Chantier</th>
                <th className="px-4 py-3">Rubrique</th>
                <th className="px-4 py-3">Pièce</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{f.project.title}</p>
                    {f.project.siteCity ? (
                      <p className="text-xs text-slate-500">{f.project.siteCity}</p>
                    ) : null}
                    {staff ? <p className="text-xs text-slate-500">{f.client.name}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <span className="font-mono text-xs text-[#1d4ed8]">{f.folder.code}</span> {f.folder.label}
                  </td>
                  <td className="px-4 py-3 text-slate-800">{f.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CHANTIER_FILE_STATUS_COLORS[f.status]}`}
                    >
                      {CHANTIER_FILE_STATUS_LABELS[f.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/projets/${f.project.id}#dossier-chantier`}
                      className="font-medium text-[#1d4ed8] hover:underline"
                    >
                      Ouvrir le dossier →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
