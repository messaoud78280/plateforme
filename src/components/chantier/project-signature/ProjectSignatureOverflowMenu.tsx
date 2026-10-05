"use client";

import Link from "next/link";
import { HeaderDropdown } from "@/components/ui/HeaderDropdown";
import { ProjectMessagerieLinks } from "@/components/messagerie/MessagerieContextLinks";
import { DeleteChantierButton } from "@/components/chantier/DeleteChantierButton";
import { cn } from "@/lib/cn";

export type ProjectSignatureOverflowMenuProps = {
  projectId: string;
  projectTitle: string;
  showATraiter?: boolean;
  showMessagerie?: boolean;
  missingCount?: number;
  canDelete?: boolean;
  isArchived?: boolean;
  /** Lien export PDF dossier (si disponible). */
  pdfExportHref?: string | null;
};

/**
 * Menu « … » de la fiche chantier (Project Signature).
 * Portal via HeaderDropdown — non clipé par overflow:hidden de .bw-psig.
 */
export function ProjectSignatureOverflowMenu({
  projectId,
  projectTitle,
  showATraiter = false,
  showMessagerie = false,
  missingCount = 0,
  canDelete = false,
  isArchived = false,
  pdfExportHref = null,
}: ProjectSignatureOverflowMenuProps) {
  const itemClass =
    "block w-full px-3.5 py-2 text-left text-sm text-slate-800 hover:bg-slate-50";

  return (
    <HeaderDropdown
      align="right"
      width={220}
      zIndex={80}
      panelClassName="rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
      panelId={`project-sig-overflow-${projectId}`}
      trigger={({ onClick, expanded, triggerRef }) => (
        <button
          ref={triggerRef}
          type="button"
          onClick={onClick}
          aria-haspopup="menu"
          aria-expanded={expanded}
          aria-controls={`project-sig-overflow-${projectId}`}
          aria-label="Autres actions chantier"
          className={cn(
            "bw-psig__overflow-trigger inline-flex min-h-[2.35rem] min-w-[2.35rem] items-center justify-center rounded-xl border border-[color:rgba(80,160,210,0.18)] bg-white/72 px-2 text-sm font-semibold tracking-widest text-[#173f73] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] transition",
            "hover:border-[color:rgba(31,182,213,0.28)] hover:bg-[rgba(238,246,252,0.95)]",
            expanded && "border-[color:rgba(31,182,213,0.35)] bg-[rgba(238,246,252,0.98)]",
          )}
        >
          •••
        </button>
      )}
    >
      {showATraiter ? (
        <Link href="/dashboard/a-traiter" role="menuitem" className={itemClass}>
          À traiter
        </Link>
      ) : null}
      {showMessagerie ? (
        <div className="border-b border-slate-100 px-2 py-2">
          <ProjectMessagerieLinks projectId={projectId} />
        </div>
      ) : null}
      {missingCount > 0 ? (
        <Link
          href={`/dashboard/projets/manquants?chantier=${encodeURIComponent(projectId)}`}
          role="menuitem"
          className="block px-3.5 py-2 text-sm text-red-700 hover:bg-red-50"
        >
          {missingCount} pièce{missingCount > 1 ? "s" : ""} manquante
          {missingCount > 1 ? "s" : ""}
        </Link>
      ) : null}
      {pdfExportHref ? (
        <a
          href={pdfExportHref}
          role="menuitem"
          className={itemClass}
          target="_blank"
          rel="noopener noreferrer"
        >
          Télécharger le dossier
        </a>
      ) : null}
      {canDelete ? (
        <>
          <div className="my-1 border-t border-slate-100" />
          {isArchived ? (
            <>
              <div className="px-1">
                <DeleteChantierButton
                  projectId={projectId}
                  projectTitle={projectTitle}
                  mode="restore"
                  label="Restaurer"
                  className="w-full px-2.5 py-2 text-left text-sm"
                />
              </div>
              <div className="px-1">
                <DeleteChantierButton
                  projectId={projectId}
                  projectTitle={projectTitle}
                  mode="hard-delete"
                  redirectTo="/dashboard/projets?statut=ARCHIVES"
                  label="Supprimer définitivement"
                  className="w-full px-2.5 py-2 text-left text-sm"
                />
              </div>
            </>
          ) : (
            <div className="px-1">
              <DeleteChantierButton
                projectId={projectId}
                projectTitle={projectTitle}
                mode="archive"
                redirectTo="/dashboard/projets"
                label="Supprimer le chantier"
                className="w-full px-2.5 py-2 text-left text-sm"
              />
            </div>
          )}
        </>
      ) : null}
    </HeaderDropdown>
  );
}
