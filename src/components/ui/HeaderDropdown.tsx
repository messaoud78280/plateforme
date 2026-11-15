"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

export type HeaderDropdownTriggerProps = {
  onClick: () => void;
  expanded: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

type HeaderDropdownProps = {
  trigger: (props: HeaderDropdownTriggerProps) => ReactNode;
  children: ReactNode;
  panelClassName?: string;
  align?: "left" | "right";
  width?: number;
  panelId?: string;
  /** Défaut 9999 (header). Préférer ~50–100 pour menus de page (sous modales z-80+). */
  zIndex?: number;
};

/**
 * Dropdown générique via portal (document.body).
 * Évite le clipping par overflow-hidden / stacking contexts parents.
 */
export function HeaderDropdown({
  trigger,
  children,
  panelClassName = "rounded-xl surface-metallic-light py-2 shadow-lg ring-1 ring-slate-200/80",
  align = "right",
  width = 288,
  panelId,
  zIndex = 9999,
}: HeaderDropdownProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let left = align === "right" ? rect.right - width : rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

    const panelH = panelRef.current?.offsetHeight ?? 0;
    const estimatedH = panelH > 0 ? panelH : 220;
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    let top = rect.bottom + gap;
    if (spaceBelow < estimatedH && spaceAbove > spaceBelow) {
      top = Math.max(8, rect.top - estimatedH - gap);
    } else {
      // Garde le bas du menu dans le viewport si possible
      top = Math.min(top, Math.max(8, window.innerHeight - estimatedH - 8));
    }

    setPosition({ top, left });
  }, [align, width]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition, children]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onMouse(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target))
        return;
      setOpen(false);
    }
    function onPanelClick(e: MouseEvent) {
      const el = e.target as HTMLElement | null;
      // Fermer après action (lien ou bouton) — pas si clic sur le panneau vide
      if (el?.closest?.("a[href], button, [data-dropdown-close], [role='menuitem']")) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onMouse);
    const panel = panelRef.current;
    panel?.addEventListener("click", onPanelClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onMouse);
      panel?.removeEventListener("click", onPanelClick);
    };
  }, [open]);

  const toggle = () => setOpen((v) => !v);

  return (
    <>
      {trigger({ onClick: toggle, expanded: open, triggerRef })}
      {mounted &&
        open &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="menu"
            className={panelClassName}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width,
              zIndex,
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
