"use client";

type Props = {
  open: boolean;
  isMine: boolean;
  pending?: boolean;
  error?: string | null;
  /** Multi-sélection : forcer « pour moi » uniquement */
  forceMeOnly?: boolean;
  count?: number;
  onCancel: () => void;
  onDeleteMe: () => void;
  onDeleteEveryone?: () => void;
};

export function MessageDeleteDialog({
  open,
  isMine,
  pending,
  error,
  forceMeOnly,
  count = 1,
  onCancel,
  onDeleteMe,
  onDeleteEveryone,
}: Props) {
  if (!open) return null;

  const showEveryone = isMine && !forceMeOnly && onDeleteEveryone;
  const plural = count > 1;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-[1px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="msg-delete-title"
        className="w-full max-w-sm overflow-hidden rounded-[var(--bw-radius-panel,1.125rem)] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.16)]"
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 id="msg-delete-title" className="text-[15px] font-semibold text-[#1e3a5f]">
            {plural ? `Supprimer ${count} messages ?` : "Supprimer le message ?"}
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
            {forceMeOnly
              ? "Les messages disparaîtront pour vous uniquement. Les autres participants continueront à les voir."
              : showEveryone
                ? "Choisissez la portée de la suppression. Aucun fichier n’est purgé automatiquement."
                : "Le message disparaîtra pour vous uniquement. Les autres participants continueront à le voir."}
          </p>
        </div>
        {error ? (
          <p className="mx-5 mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 px-5 py-4">
          <button
            type="button"
            disabled={pending}
            onClick={onDeleteMe}
            className="rounded-[var(--bw-radius-control,0.625rem)] bg-[#1e3a5f] px-3.5 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-[#162d4a] disabled:opacity-60"
          >
            {pending ? "Suppression…" : "Supprimer pour moi"}
          </button>
          {showEveryone ? (
            <button
              type="button"
              disabled={pending}
              onClick={onDeleteEveryone}
              className="rounded-[var(--bw-radius-control,0.625rem)] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13.5px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
            >
              Supprimer pour tous
            </button>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="rounded-[var(--bw-radius-control,0.625rem)] px-3.5 py-2.5 text-[13.5px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
