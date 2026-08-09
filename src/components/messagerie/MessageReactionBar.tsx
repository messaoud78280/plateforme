"use client";

import {
  MESSAGE_REACTION_EMOJIS,
  aggregateReactions,
  type MessageReactionsMap,
} from "@/lib/messagerie/message-reactions";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
  anchor?: { x: number; y: number } | null;
};

export function MessageReactionPicker({ open, onClose, onPick, anchor }: Props) {
  if (!open) return null;
  const left = anchor ? Math.min(anchor.x, window.innerWidth - 220) : 16;
  const top = anchor ? Math.max(8, anchor.y - 48) : 80;

  return (
    <>
      <button type="button" className="fixed inset-0 z-[70]" aria-label="Fermer" onClick={onClose} />
      <div
        className="fixed z-[71] flex items-center gap-0.5 rounded-full border border-slate-200 bg-white px-1.5 py-1 shadow-lg"
        style={{ left, top }}
      >
        {MESSAGE_REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="rounded-full px-1.5 py-0.5 text-[18px] transition-transform hover:scale-125"
            onClick={() => {
              onPick(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}

type ChipsProps = {
  reactions: MessageReactionsMap;
  myUserId: string;
  nameById?: Record<string, string>;
  onToggleMine: (emoji: string) => void;
};

export function MessageReactionChips({
  reactions,
  myUserId,
  nameById = {},
  onToggleMine,
}: ChipsProps) {
  const agg = aggregateReactions(reactions);
  if (agg.length === 0) return null;

  return (
    <div className="mt-0.5 flex flex-wrap gap-1">
      {agg.map(({ emoji, count, userIds }) => {
        const mine = reactions[myUserId] === emoji;
        const title = userIds
          .map((id) => nameById[id] || (id === myUserId ? "Vous" : "Participant"))
          .join(", ");
        return (
          <button
            key={emoji}
            type="button"
            title={title}
            className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[12px] shadow-sm ${
              mine
                ? "border-[#1e3a5f]/30 bg-[#eef2f7] text-[#1e3a5f]"
                : "border-slate-200 bg-white text-slate-700"
            }`}
            onClick={() => onToggleMine(emoji)}
          >
            <span>{emoji}</span>
            <span className="font-medium">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
