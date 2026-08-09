"use client";

type Props = {
  count: number;
  canDelete?: boolean;
  onForward?: () => void;
  onImportant?: () => void;
  onDelete?: () => void;
  onCancel: () => void;
};

export function MessageSelectionBar({
  count,
  canDelete,
  onForward,
  onImportant,
  onDelete,
  onCancel,
}: Props) {
  if (count <= 0) return null;
  return (
    <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm">
      <span className="text-[13px] font-semibold text-[#1e3a5f]">
        {count} sélectionné{count > 1 ? "s" : ""}
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {onForward ? (
          <button
            type="button"
            className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12px] font-medium text-slate-800 hover:bg-slate-200"
            onClick={onForward}
          >
            Transférer
          </button>
        ) : null}
        {onImportant ? (
          <button
            type="button"
            className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12px] font-medium text-slate-800 hover:bg-slate-200"
            onClick={onImportant}
          >
            Important
          </button>
        ) : null}
        {canDelete && onDelete ? (
          <button
            type="button"
            className="rounded-lg bg-red-50 px-2.5 py-1.5 text-[12px] font-medium text-red-700 hover:bg-red-100"
            onClick={onDelete}
          >
            Supprimer
          </button>
        ) : null}
        <button
          type="button"
          className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
          onClick={onCancel}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
