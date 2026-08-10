"use client";

import { useEffect, useRef } from "react";
import {
  Copy,
  Forward,
  Info,
  MoreHorizontal,
  Pin,
  Reply,
  SmilePlus,
  Star,
  Trash2,
  CheckSquare,
  Zap,
} from "lucide-react";

export type MessageMenuActionId =
  | "reply"
  | "react"
  | "bework"
  | "important"
  | "pin"
  | "forward"
  | "copy"
  | "infos"
  | "delete"
  | "select";

export type MessageMenuCapabilities = {
  reply?: boolean;
  react?: boolean;
  bework?: boolean;
  important?: boolean;
  pin?: boolean;
  forward?: boolean;
  copy?: boolean;
  infos?: boolean;
  delete?: boolean;
  select?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  anchor: { x: number; y: number } | null;
  capabilities: MessageMenuCapabilities;
  isImportant?: boolean;
  isPinned?: boolean;
  onAction: (id: MessageMenuActionId) => void;
};

const ITEMS: {
  id: MessageMenuActionId;
  label: string;
  icon: typeof Reply;
  danger?: boolean;
  sepBefore?: boolean;
}[] = [
  { id: "reply", label: "Répondre", icon: Reply },
  { id: "react", label: "Réagir", icon: SmilePlus },
  { id: "bework", label: "Action BeWork", icon: Zap },
  { id: "important", label: "Important", icon: Star },
  { id: "pin", label: "Épingler", icon: Pin },
  { id: "forward", label: "Transférer", icon: Forward },
  { id: "copy", label: "Copier", icon: Copy },
  { id: "infos", label: "Infos", icon: Info },
  { id: "delete", label: "Supprimer", icon: Trash2, danger: true, sepBefore: true },
  { id: "select", label: "Sélectionner des messages", icon: CheckSquare, sepBefore: true },
];

export function MessageContextMenu({
  open,
  onClose,
  anchor,
  capabilities,
  isImportant,
  isPinned,
  onAction,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, onClose]);

  if (!open || !anchor) return null;

  const visible = ITEMS.filter((it) => capabilities[it.id] !== false);

  const left = Math.min(anchor.x, typeof window !== "undefined" ? window.innerWidth - 260 : anchor.x);
  const top = Math.min(anchor.y, typeof window !== "undefined" ? window.innerHeight - 360 : anchor.y);

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-[80] w-[240px] overflow-hidden rounded-[var(--bw-radius-panel,1.125rem)] border border-slate-200/80 bg-white/95 py-1 shadow-[0_8px_28px_rgba(15,23,42,0.12)] backdrop-blur-sm animate-in fade-in zoom-in-95"
      style={{
        left,
        top,
        transition: "opacity 180ms cubic-bezier(0.25, 0.1, 0.25, 1)",
      }}
    >
      {visible.map((it) => {
        const Icon = it.icon;
        let label = it.label;
        if (it.id === "important") label = isImportant ? "Retirer Important" : "Important";
        if (it.id === "pin") label = isPinned ? "Désépingler" : "Épingler";
        return (
          <div key={it.id}>
            {it.sepBefore ? <div className="my-1 border-t border-slate-100" /> : null}
            <button
              type="button"
              role="menuitem"
              className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13.5px] transition-colors hover:bg-slate-50 ${
                it.danger ? "text-red-600" : "text-slate-800"
              }`}
              onClick={() => {
                onAction(it.id);
                onClose();
              }}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-70" strokeWidth={1.75} />
              <span className="flex-1">{label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

type TriggerProps = {
  onOpen: (anchor: { x: number; y: number }) => void;
  className?: string;
};

export function MessageMoreButton({ onOpen, className }: TriggerProps) {
  return (
    <button
      type="button"
      aria-label="Actions du message"
      className={`rounded-full p-1 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/5 focus:opacity-100 ${className ?? ""}`}
      onClick={(e) => {
        e.stopPropagation();
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        onOpen({ x: r.left, y: r.bottom + 4 });
      }}
    >
      <MoreHorizontal className="h-4 w-4" />
    </button>
  );
}

type QuickProps = {
  onReply?: () => void;
  onReact?: () => void;
  onMore: (anchor: { x: number; y: number }) => void;
};

/** Barre discrète : desktop hover uniquement — jamais permanente sur mobile. */
export function MessageQuickHoverBar({ onReply, onReact, onMore }: QuickProps) {
  return (
    <div className="absolute -top-3 right-1 z-10 hidden items-center gap-0.5 rounded-full border border-slate-200/80 bg-white/95 px-0.5 py-0.5 opacity-0 shadow-sm transition-opacity duration-150 md:flex md:group-hover:opacity-100">
      {onReact ? (
        <button
          type="button"
          aria-label="Réagir"
          className="min-h-8 min-w-8 rounded-full px-1.5 py-0.5 text-[13px] hover:bg-slate-50"
          onClick={(e) => {
            e.stopPropagation();
            onReact();
          }}
        >
          🙂
        </button>
      ) : null}
      {onReply ? (
        <button
          type="button"
          aria-label="Répondre"
          className="min-h-8 min-w-8 rounded-full px-1.5 py-0.5 text-[12px] text-slate-600 hover:bg-slate-50"
          onClick={(e) => {
            e.stopPropagation();
            onReply();
          }}
        >
          ↩
        </button>
      ) : null}
      <MessageMoreButton onOpen={onMore} className="!opacity-100" />
    </div>
  );
}
