"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getQuoteActionsForStatus,
  type QuoteActionDef,
  type QuoteActionId,
} from "@/lib/commercial/quote-actions";

export function QuoteStatusActions({
  status,
  canEdit,
  hasAcceptedPdf,
  hasProject,
  busy,
  onAction,
}: {
  status: string;
  canEdit: boolean;
  hasAcceptedPdf: boolean;
  hasProject: boolean;
  busy: boolean;
  onAction: (action: QuoteActionDef) => void;
}) {
  const { primary, secondary } = getQuoteActionsForStatus({
    status,
    canEdit,
    hasAcceptedPdf,
    hasProject,
  });
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const btn = btnRef.current;
    if (btn) {
      const r = btn.getBoundingClientRect();
      const width = 200;
      setPos({
        top: r.bottom + 6,
        left: Math.min(Math.max(8, r.right - width), window.innerWidth - width - 8),
      });
    }
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  function run(action: QuoteActionDef) {
    setOpen(false);
    onAction(action);
  }

  const menuItems = secondary.filter((a) => {
    if (a.id === "price_check" && !["DRAFT", "TO_VALIDATE", "VALIDATED", "SENT", "VIEWED"].includes(status)) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {primary ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(primary)}
          className={
            primary.id === "accept"
              ? "rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
              : "rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
          }
        >
          {busy && (primary.id === "accept" || primary.toStatus) ? "…" : primary.label}
        </button>
      ) : null}

      {menuItems.length > 0 ? (
        <>
          <button
            ref={btnRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Autres actions"
            disabled={busy}
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            •••
          </button>
          {open && pos && typeof document !== "undefined"
            ? createPortal(
                <div
                  ref={menuRef}
                  role="menu"
                  style={{ top: pos.top, left: pos.left }}
                  className="fixed z-[100] min-w-[12rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                >
                  {menuItems.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      role="menuitem"
                      disabled={busy}
                      onClick={() => run(a)}
                      className={
                        a.destructive
                          ? "block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                          : "block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                      }
                    >
                      {a.label}
                    </button>
                  ))}
                </div>,
                document.body,
              )
            : null}
        </>
      ) : null}
    </div>
  );
}

export type { QuoteActionId, QuoteActionDef };
