"use client";

import type { ChantierStatus } from "@prisma/client";
import { CHANTIER_STATUS_LABELS } from "@/lib/chantier-dossier/constants";
import { cn } from "@/lib/cn";

const STATUS_CLASS: Record<ChantierStatus, string> = {
  ETUDE: "bw-psig-status--etude",
  EN_ATTENTE: "bw-psig-status--attente",
  EN_COURS: "bw-psig-status--cours",
  RECEPTION: "bw-psig-status--reception",
  TERMINE: "bw-psig-status--termine",
};

/** Badge statut chantier — même composant liste + détail. */
export function ProjectStatusBadge({
  status,
  label,
  size = "sm",
  className,
}: {
  status: ChantierStatus;
  /** Override éventuel (sinon libellé BeWork). */
  label?: string | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const text = label?.trim() || CHANTIER_STATUS_LABELS[status] || status;
  return (
    <span
      className={cn(
        "bw-psig-status",
        STATUS_CLASS[status] ?? "bw-psig-status--etude",
        size === "md" && "bw-psig-status--md",
        className,
      )}
    >
      <span className="bw-psig-status__dot" aria-hidden />
      {text}
    </span>
  );
}
