"use client";

import { useEffect, useId, useRef } from "react";
import { AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  quoteNumber: string;
  clientLabel: string;
  pending?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Modale de confirmation — suppression devis (charte BeWork). */
export function DeleteQuoteDialog({
  open,
  quoteNumber,
  clientLabel,
  pending = false,
  error = null,
  onCancel,
  onConfirm,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => cancelRef.current?.focus(), 0);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) {
        e.preventDefault();
        onCancel();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-bework-navy/10 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.18)]"
      >
        <div className="px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 id={titleId} className="text-[16px] font-semibold text-bework-navy">
                Supprimer ce devis ?
              </h3>
              <p id={descId} className="mt-2 text-[13.5px] leading-relaxed text-bework-muted">
                Vous êtes sur le point de supprimer le devis{" "}
                <span className="font-semibold text-bework-ink">{quoteNumber}</span>
                {clientLabel ? (
                  <>
                    {" "}
                    de <span className="font-semibold text-bework-ink">{clientLabel}</span>
                  </>
                ) : null}
                .
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-bework-muted">
                Cette action supprimera définitivement ce devis. Le numéro ne pourra pas être
                réutilisé.
              </p>
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700"
            >
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 border-t border-bework-navy/8 bg-slate-50/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            ref={cancelRef}
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="rounded-xl px-4 py-2.5 text-[13.5px] font-medium text-bework-muted transition hover:bg-white hover:text-bework-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bework-navy disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="rounded-xl border border-red-200 bg-red-600 px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60"
          >
            {pending ? "Suppression…" : "Supprimer le devis"}
          </button>
        </div>
      </div>
    </div>
  );
}
