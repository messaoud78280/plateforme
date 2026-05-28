"use client";

import Link from "next/link";
import { DeleteClientButton } from "@/components/clients/DeleteClientButton";

export type ClientRow = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  projectsCount: number;
  tasksCount: number;
  monthlyActionsTotal: number;
  monthlyActionsUsed: number;
};

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl surface-metallic-light shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#c8cdd6] bg-[#f8f9fb] text-black">
            <th className="px-6 py-4 font-semibold">Client</th>
            <th className="px-6 py-4 font-semibold">Email</th>
            <th className="px-6 py-4 font-semibold text-center">Projets</th>
            <th className="px-6 py-4 font-semibold text-center">Tâches</th>
            <th className="px-6 py-4 font-semibold text-center">Quota crédits (utilisés / total)</th>
            <th className="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => {
            const total = client.monthlyActionsTotal;
            const used = client.monthlyActionsUsed;
            const remaining = Math.max(0, total - used);
            return (
              <tr
                key={client.id}
                className="border-b border-[#e0e4ea] transition hover:bg-[#f8f9fb]"
              >
                <td className="px-6 py-4">
                  <span className="font-medium text-black">{client.name}</span>
                  {client.company ? (
                    <span className="ml-2 text-black">— {client.company}</span>
                  ) : null}
                </td>
                <td className="px-6 py-4 text-black">{client.email}</td>
                <td className="px-6 py-4 text-center text-black">{client.projectsCount}</td>
                <td className="px-6 py-4 text-center text-black">{client.tasksCount}</td>
                <td className="px-6 py-4 text-center text-black">
                  {total > 0 ? (
                    <span>
                      {used} / {total}{" "}
                      <span className="text-black">(reste {remaining})</span>
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Voir détail
                    </Link>
                    <DeleteClientButton
                      clientId={client.id}
                      clientName={client.name}
                      projectsCount={client.projectsCount}
                      tasksCount={client.tasksCount}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
