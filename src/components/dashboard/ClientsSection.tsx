import Link from "next/link";

export interface ClientRow {
  id: string;
  name: string;
  email: string;
  projectsCount: number;
  tasksCount: number;
}

interface ClientsSectionProps {
  clients: ClientRow[];
}

export function ClientsSection({ clients }: ClientsSectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Vos clients</h2>
          <p className="mt-1 text-sm text-slate-500">
            Liste des clients ayant un compte sur la plateforme
          </p>
        </div>
        <Link
          href="/dashboard/clients"
          className="text-sm font-medium text-[#1d4ed8] hover:underline"
        >
          Voir tous les clients
        </Link>
      </div>

      {clients.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Aucun client pour le moment.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="pb-3 font-medium">Nom</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium text-center">Projets</th>
                <th className="pb-3 font-medium text-center">Tâches</th>
                <th className="pb-3 font-medium" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="py-3 font-medium text-slate-800">{client.name}</td>
                  <td className="py-3 text-slate-600">{client.email}</td>
                  <td className="py-3 text-center text-slate-600">
                    {client.projectsCount}
                  </td>
                  <td className="py-3 text-center text-slate-600">
                    {client.tasksCount}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Voir détail
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
