"use client";

import Link from "next/link";
import { DeleteClientButton } from "@/components/clients/DeleteClientButton";
import { ClientApprovalActions } from "@/components/clients/ClientApprovalActions";
import { Badge } from "@/components/ui/Badge";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableTd,
  DataTableTh,
} from "@/components/ui/DataTable";

export type ClientRow = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  projectsCount: number;
  tasksCount: number;
  monthlyActionsTotal: number;
  monthlyActionsUsed: number;
  accountStatus: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
};

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  return (
    <DataTable minWidth="780px">
      <DataTableHead>
        <DataTableTh>Client</DataTableTh>
        <DataTableTh>Statut compte</DataTableTh>
        <DataTableTh>Email</DataTableTh>
        <DataTableTh align="center">Projets</DataTableTh>
        <DataTableTh align="center">Tâches</DataTableTh>
        <DataTableTh align="center">Quota crédits</DataTableTh>
        <DataTableTh align="right">Actions</DataTableTh>
      </DataTableHead>
      <DataTableBody>
        {clients.map((client) => {
          const total = client.monthlyActionsTotal;
          const used = client.monthlyActionsUsed;
          const remaining = Math.max(0, total - used);
          return (
            <DataTableRow key={client.id}>
              <DataTableTd>
                <span className="font-semibold text-bework-ink">{client.name}</span>
                {client.company ? (
                  <span className="ml-2 text-bework-muted">— {client.company}</span>
                ) : null}
              </DataTableTd>
              <DataTableTd>
                {client.accountStatus === "PENDING_APPROVAL" ? (
                  <Badge tone="watch">En attente</Badge>
                ) : client.accountStatus === "REJECTED" ? (
                  <Badge tone="critical">Refusé</Badge>
                ) : (
                  <Badge tone="ok">Validé</Badge>
                )}
              </DataTableTd>
              <DataTableTd className="text-bework-muted">{client.email}</DataTableTd>
              <DataTableTd align="center" className="font-technical">
                {client.projectsCount}
              </DataTableTd>
              <DataTableTd align="center" className="font-technical">
                {client.tasksCount}
              </DataTableTd>
              <DataTableTd align="center" className="text-xs">
                {total > 0 ? (
                  <span className="font-technical">
                    {used} / {total}{" "}
                    <span className="text-bework-muted">(reste {remaining})</span>
                  </span>
                ) : (
                  "—"
                )}
              </DataTableTd>
              <DataTableTd align="right">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <ClientApprovalActions
                    clientId={client.id}
                    clientName={client.name}
                    accountStatus={client.accountStatus}
                  />
                  <Link href={`/dashboard/clients/${client.id}`} className="btn-cc-secondary !py-1 !text-xs">
                    Voir détail
                  </Link>
                  <DeleteClientButton
                    clientId={client.id}
                    clientName={client.name}
                    projectsCount={client.projectsCount}
                    tasksCount={client.tasksCount}
                  />
                </div>
              </DataTableTd>
            </DataTableRow>
          );
        })}
      </DataTableBody>
    </DataTable>
  );
}
