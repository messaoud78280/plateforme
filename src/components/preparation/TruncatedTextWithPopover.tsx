"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type Props = {
  text: string;
  className?: string;
  /** Contenu riche ; défaut = texte complet. */
  popover?: ReactNode;
  popoverTitle?: string;
  /** Largeur max de la carte (px). */
  popoverMaxWidth?: number;
  /** Forcer l’affichage du popover même si non tronqué. */
  alwaysShowPopover?: boolean;
  as?: "span" | "div";
};

/**
 * Texte tronqué + carte de lecture au hover / focus / clic.
 * Mutualisé pour Gantt et tableaux planning.
 */
export function TruncatedTextWithPopover({
  text,
  className,
  popover,
  popoverTitle,
  popoverMaxWidth = 480,
  alwaysShowPopover = false,
  as: Tag = "span",
}: Props) {
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measure = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    setTruncated(el.scrollWidth > el.clientWidth + 1);
  }, []);

  useEffect(() => {
    measure();
    const el = triggerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, measure]);

  const clearClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const place = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const maxW = popoverMaxWidth;
    let left = r.left;
    if (left + maxW > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - maxW - 12);
    }
    let top = r.bottom + 6;
    if (top + 220 > window.innerHeight) {
      top = Math.max(12, r.top - 8);
    }
    setCoords({ top, left });
  };

  const show = () => {
    clearClose();
    if (!alwaysShowPopover && !truncated && !popover) return;
    place();
    setOpen(true);
  };

  const hide = () => {
    clearClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const canOpen = alwaysShowPopover || truncated || !!popover;

  return (
    <>
      <Tag
        ref={triggerRef as never}
        tabIndex={canOpen ? 0 : undefined}
        aria-describedby={open ? id : undefined}
        className={cn(
          "min-w-0 truncate outline-none transition-colors duration-150",
          canOpen && "cursor-default",
          className,
        )}
        onMouseEnter={() => canOpen && show()}
        onMouseLeave={hide}
        onFocus={() => canOpen && show()}
        onBlur={hide}
        onClick={(e) => {
          if (!canOpen) return;
          e.stopPropagation();
          if (open) setOpen(false);
          else show();
        }}
      >
        {text}
      </Tag>
      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            className="fixed z-[80] max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border border-[#1e3a5f]/15 bg-white p-3.5 shadow-[0_12px_40px_-12px_rgba(30,58,95,0.35)]"
            style={{
              top: coords.top,
              left: coords.left,
              width: popoverMaxWidth,
              maxWidth: `min(${popoverMaxWidth}px, calc(100vw - 24px))`,
            }}
            onMouseEnter={clearClose}
            onMouseLeave={hide}
          >
            {popoverTitle ? (
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {popoverTitle}
              </p>
            ) : null}
            {popover ?? (
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-800">
                {text}
              </p>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
