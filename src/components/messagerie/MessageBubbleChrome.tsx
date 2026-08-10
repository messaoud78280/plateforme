"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import {
  MessageContextMenu,
  MessageQuickHoverBar,
  type MessageMenuActionId,
  type MessageMenuCapabilities,
} from "@/components/messagerie/MessageContextMenu";
import {
  MessageReactionChips,
  MessageReactionPicker,
} from "@/components/messagerie/MessageReactionBar";
import type { MessageReactionsMap } from "@/lib/messagerie/message-reactions";

type Props = {
  messageId: string;
  isMe: boolean;
  capabilities: MessageMenuCapabilities;
  isImportant: boolean;
  isPinned: boolean;
  selectionMode: boolean;
  selected: boolean;
  highlighted?: boolean;
  reactions?: MessageReactionsMap;
  myUserId: string;
  reactionNames?: Record<string, string>;
  onToggleSelect: () => void;
  onAction: (id: MessageMenuActionId) => void;
  onReact: (emoji: string | null) => void;
  children: React.ReactNode;
  /** Contenu sous la bulle (chips réactions déjà inclus si reactions fourni) */
  footer?: React.ReactNode;
};

export function MessageBubbleChrome({
  messageId,
  isMe,
  capabilities,
  isImportant,
  isPinned,
  selectionMode,
  selected,
  highlighted,
  reactions,
  myUserId,
  reactionNames,
  onToggleSelect,
  onAction,
  onReact,
  children,
  footer,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [reactOpen, setReactOpen] = useState(false);
  const [reactAnchor, setReactAnchor] = useState<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const openMenuAt = useCallback((pos: { x: number; y: number }) => {
    setAnchor(pos);
    setMenuOpen(true);
  }, []);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Mobile : fermer menus/réactions au scroll
  useEffect(() => {
    if (!menuOpen && !reactOpen) return;
    const close = () => {
      setMenuOpen(false);
      setReactOpen(false);
      setAnchor(null);
      setReactAnchor(null);
    };
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [menuOpen, reactOpen]);

  return (
    <div
      data-message-id={messageId}
      className={`group relative flex w-full gap-2 ${isMe ? "flex-row-reverse" : ""} ${
        highlighted ? "rounded-lg ring-2 ring-[#1e3a5f]/40 ring-offset-2" : ""
      }`}
      onContextMenu={(e) => {
        if (selectionMode) return;
        e.preventDefault();
        openMenuAt({ x: e.clientX, y: e.clientY });
      }}
      onTouchStart={(e) => {
        if (selectionMode) return;
        longPressFired.current = false;
        const t = e.touches[0];
        if (!t) return;
        longPressTimer.current = setTimeout(() => {
          longPressFired.current = true;
          openMenuAt({ x: t.clientX, y: t.clientY });
        }, 480);
      }}
      onTouchMove={clearLongPress}
      onTouchEnd={(e) => {
        clearLongPress();
        if (longPressFired.current) {
          e.preventDefault();
        }
      }}
      onClick={() => {
        if (selectionMode) onToggleSelect();
      }}
    >
      {selectionMode ? (
        <button
          type="button"
          aria-label={selected ? "Désélectionner" : "Sélectionner"}
          className={`mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
            selected
              ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
              : "border-slate-300 bg-white text-transparent"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
        >
          ✓
        </button>
      ) : null}

      <div className={`relative min-w-0 max-w-full ${isMe ? "items-end" : "items-start"}`}>
        {!selectionMode ? (
          <MessageQuickHoverBar
            onReply={
              capabilities.reply !== false
                ? () => onAction("reply")
                : undefined
            }
            onReact={
              capabilities.react !== false
                ? () => {
                    setReactAnchor({
                      x: window.innerWidth / 2 - 100,
                      y: window.innerHeight / 2,
                    });
                    setReactOpen(true);
                  }
                : undefined
            }
            onMore={openMenuAt}
          />
        ) : null}

        <div className="relative">
          {(isImportant || isPinned) && (
            <span
              className={`absolute -top-1 ${isMe ? "-left-1" : "-right-1"} z-[1] flex gap-0.5`}
              title={
                [isImportant ? "Important (personnel)" : "", isPinned ? "Épinglé (personnel)" : ""]
                  .filter(Boolean)
                  .join(" · ")
              }
            >
              {isImportant ? (
                <Star className="h-3 w-3 fill-amber-400 text-amber-500" strokeWidth={1.5} />
              ) : null}
              {isPinned ? (
                <span className="text-[10px] leading-none text-[#1e3a5f]">📌</span>
              ) : null}
            </span>
          )}
          {children}
        </div>

        {reactions ? (
          <MessageReactionChips
            reactions={reactions}
            myUserId={myUserId}
            nameById={reactionNames}
            onToggleMine={(emoji) => {
              const mine = reactions[myUserId];
              onReact(mine === emoji ? null : emoji);
            }}
          />
        ) : null}
        {footer}
      </div>

      <MessageContextMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchor={anchor}
        capabilities={capabilities}
        isImportant={isImportant}
        isPinned={isPinned}
        onAction={(id) => {
          if (id === "react") {
            setReactAnchor(anchor);
            setReactOpen(true);
            return;
          }
          onAction(id);
        }}
      />

      <MessageReactionPicker
        open={reactOpen}
        anchor={reactAnchor}
        onClose={() => setReactOpen(false)}
        onPick={(emoji) => onReact(emoji)}
      />
    </div>
  );
}
