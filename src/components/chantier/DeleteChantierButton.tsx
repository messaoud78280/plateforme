"use client";

import { useState } from "react";
import { ArchiveChantierModal } from "@/components/chantier/ArchiveChantierModal";
import { cn } from "@/lib/cn";

type Mode = "archive" | "restore" | "hard-delete";

type Props = {
  projectId: string;
  projectTitle: string;
  redirectTo?: string;
  label?: string;
  className?: string;
  /** archive (défaut) | restore | hard-delete */
  mode?: Mode;
  commercialLock?: boolean;
  commercialReasons?: string[];
};

/**
 * Action chantier — soft-archive par défaut (plus de DELETE brut via window.confirm).
 */
export function DeleteChantierButton({
  projectId,
  projectTitle,
  redirectTo,
  label,
  className = "",
  mode = "archive",
  commercialLock = false,
  commercialReasons = [],
}: Props) {
  const [open, setOpen] = useState(false);

  const defaultLabel =
    mode === "archive"
      ? "Supprimer le chantier"
      : mode === "restore"
        ? "Restaurer"
        : "Supprimer définitivement";

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          mode === "restore"
            ? "text-sm text-slate-800 hover:bg-slate-50"
            : "text-sm text-rose-700/90 hover:bg-rose-50",
          className,
        )}
      >
        {label ?? defaultLabel}
      </button>
      <ArchiveChantierModal
        projectId={projectId}
        projectTitle={projectTitle}
        mode={mode}
        open={open}
        onClose={() => setOpen(false)}
        redirectTo={redirectTo}
        commercialLock={commercialLock}
        commercialReasons={commercialReasons}
      />
    </>
  );
}
