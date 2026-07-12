"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type ModalSize = "sm" | "md" | "lg" | "xl";

const sizeClass: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

/** Modale Command Center — overlay + panneau centré, Escape + backdrop. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6 sm:px-6" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[color:var(--cc-ink)]/40 backdrop-blur-[2px]"
        onClick={() => dismissible && onClose()}
        aria-label="Fermer"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "cc-modal-title" : undefined}
        className={cn(
          "relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[var(--cc-radius-lg)] border border-[color:var(--cc-chrome-border)] bg-white shadow-[var(--cc-shadow-hover)]",
          sizeClass[size],
          className,
        )}
      >
        {(title || description) && (
          <div className="shrink-0 border-b border-bework-navy/10 bg-gradient-to-r from-bework-navy/[0.04] via-transparent to-transparent px-5 py-4 sm:px-6">
            {title ? (
              <h2 id="cc-modal-title" className="font-heading text-lg font-bold tracking-tight text-bework-ink">
                {title}
              </h2>
            ) : null}
            {description ? <p className="mt-1 text-sm text-bework-muted">{description}</p> : null}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-[color:var(--cc-chrome-border)] bg-[color:var(--cc-chrome)]/60 px-5 py-3 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
