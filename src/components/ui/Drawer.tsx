"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type DrawerSide = "right" | "left";

/** Panneau latéral Command Center — création / édition sans quitter la liste. */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
  widthClass = "max-w-md",
  dismissible = true,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: DrawerSide;
  widthClass?: string;
  dismissible?: boolean;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismissible, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[color:var(--cc-ink)]/40 backdrop-blur-[2px]"
        onClick={() => dismissible && onClose()}
        aria-label="Fermer"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "cc-drawer-title" : undefined}
        className={cn(
          "absolute inset-y-0 flex w-full flex-col border-[color:var(--cc-chrome-border)] bg-white shadow-[var(--cc-shadow-hover)]",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          widthClass,
          className,
        )}
      >
        {(title || description) && (
          <div className="shrink-0 border-b border-bework-navy/10 px-5 py-4">
            {title ? (
              <h2 id="cc-drawer-title" className="font-heading text-lg font-bold tracking-tight text-bework-ink">
                {title}
              </h2>
            ) : null}
            {description ? <p className="mt-1 text-sm text-bework-muted">{description}</p> : null}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-[color:var(--cc-chrome-border)] bg-[color:var(--cc-chrome)]/60 px-5 py-3">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>,
    document.body,
  );
}
