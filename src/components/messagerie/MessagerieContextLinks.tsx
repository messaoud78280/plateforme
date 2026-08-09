"use client";

import Link from "next/link";
import {
  projectClientHref,
  projectSupplierHref,
  projectTeamHref,
  resolveConversationHref,
} from "@/lib/messagerie/resolve-conversation";

const btn =
  "inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1e3a5f] shadow-sm hover:bg-slate-50";

/** Raccourcis Messagerie depuis un chantier. */
export function ProjectMessagerieLinks({ projectId }: { projectId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={projectTeamHref(projectId)} className={btn}>
        Message équipe
      </Link>
      <Link href={projectClientHref(projectId)} className={btn}>
        Message client
      </Link>
      <Link href={projectSupplierHref(projectId)} className={btn}>
        Message fournisseur
      </Link>
    </div>
  );
}

/** Raccourci depuis une commande / livraison. */
export function PurchaseOrderMessagerieLink({
  projectId,
  supplierName,
}: {
  projectId: string | null | undefined;
  supplierName?: string | null;
}) {
  const href = resolveConversationHref({
    kind: "purchase_order",
    projectId,
    supplierName,
  });
  const label = supplierName
    ? `Message ${supplierName}`
    : "Contacter le fournisseur";
  return (
    <Link href={href} className={btn}>
      {label}
    </Link>
  );
}

/** Raccourci depuis une fiche de suivi. */
export function FollowUpMessagerieLink({
  projectId,
}: {
  projectId: string | null | undefined;
}) {
  return (
    <Link
      href={resolveConversationHref({ kind: "follow_up", projectId })}
      className={btn}
    >
      Message équipe
    </Link>
  );
}
