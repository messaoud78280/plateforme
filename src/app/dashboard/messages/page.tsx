import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouvelle",
  CONFIRME: "Confirmé",
  ANNULE: "Annulé",
};

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const isAgence = session.user?.role === "AGENCE" || session.user?.role === "MANAGER";
  let contactRequests: { id: string; structure: string; contactName: string; email: string; rdvDate: Date | null; rdvTime: string | null; status: string; createdAt: Date }[] = [];

  if (isAgence) {
    try {
      contactRequests = await prisma.contactRequest.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          structure: true,
          contactName: true,
          email: true,
          rdvDate: true,
          rdvTime: true,
          status: true,
          createdAt: true,
        },
      });
    } catch {
      // Table absente ou erreur
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Messages</h1>
        <p className="mt-1 text-[#334155]">
          {isAgence
            ? "Échangez avec vos clients et consultez les demandes de contact et RDV."
            : "Échangez avec l'agence via les projets."}
        </p>
      </div>

      {isAgence && contactRequests.length >= 0 && (
        <section className="rounded-xl border border-[#c8cdd6] bg-white shadow-sm">
          <h2 className="border-b border-[#e0e4ea] px-6 py-4 text-lg font-semibold text-[#0f172a]">
            Demandes de contact et RDV
          </h2>
          {contactRequests.length === 0 ? (
            <p className="px-6 py-8 text-sm text-[#64748b]">
              Aucune demande pour le moment. Les demandes envoyées depuis la page Contact apparaîtront ici.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb] text-[#334155]">
                    <th className="px-6 py-3 text-left font-medium">Structure / Contact</th>
                    <th className="px-6 py-3 text-left font-medium">Email</th>
                    <th className="px-6 py-3 text-left font-medium">Créneau demandé</th>
                    <th className="px-6 py-3 text-left font-medium">Statut</th>
                    <th className="px-6 py-3 text-left font-medium">Reçu le</th>
                    <th className="px-6 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {contactRequests.map((r) => {
                    const rdvLabel =
                      r.rdvDate && r.rdvTime
                        ? `${new Date(r.rdvDate).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} à ${r.rdvTime.replace(":", "h")}`
                        : r.rdvDate
                          ? new Date(r.rdvDate).toLocaleDateString("fr-FR")
                          : "—";
                    return (
                      <tr key={r.id} className="border-b border-[#e0e4ea] hover:bg-[#f8f9fb]">
                        <td className="px-6 py-3">
                          <span className="font-medium text-[#0f172a]">{r.structure}</span>
                          <br />
                          <span className="text-[#64748b]">{r.contactName}</span>
                        </td>
                        <td className="px-6 py-3">
                          <a href={`mailto:${r.email}`} className="text-[#1d4ed8] hover:underline">
                            {r.email}
                          </a>
                        </td>
                        <td className="px-6 py-3 text-[#334155]">{rdvLabel}</td>
                        <td className="px-6 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              r.status === "CONFIRME"
                                ? "bg-green-100 text-green-800"
                                : r.status === "ANNULE"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-[#64748b]">
                          {new Date(r.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Link
                            href={`/dashboard/messages/demandes/${r.id}`}
                            className="text-[#1d4ed8] hover:underline"
                          >
                            Voir détail
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <div className="rounded-xl border border-dashed border-[#c8cdd6] bg-white p-12 text-center">
        <p className="text-[#334155]">
          Sélectionnez un projet pour voir les messages d&apos;échange avec les clients.
        </p>
        <Link
          href="/dashboard/projets"
          className="mt-4 inline-block rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]"
        >
          Voir les projets
        </Link>
      </div>
    </div>
  );
}
