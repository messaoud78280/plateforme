"use client";

import { shortQuoteLines, type MessageReplyMeta } from "@/lib/messagerie/message-reply";

type Props = {
  reply: MessageReplyMeta;
  onJump?: (messageId: string) => void;
  compact?: boolean;
};

export function MessageReplyQuote({ reply, onJump, compact }: Props) {
  const excerpt = shortQuoteLines(reply.excerpt);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onJump?.(reply.id);
      }}
      className={`mb-1 w-full rounded-md border-l-[3px] border-[#027eb5] bg-black/[0.04] px-2 py-1 text-left transition-colors hover:bg-black/[0.07] ${
        compact ? "max-w-full" : ""
      }`}
    >
      <p className="text-[11.5px] font-semibold text-[#027eb5]">
        Réponse à {reply.senderName.split(" ")[0] || reply.senderName}
      </p>
      <p className="line-clamp-2 text-[12px] leading-[16px] text-[#54656f]">{excerpt}</p>
    </button>
  );
}

type BannerProps = {
  reply: MessageReplyMeta;
  onClear: () => void;
};

export function MessageReplyComposerBanner({ reply, onClear }: BannerProps) {
  return (
    <div className="mb-2 flex items-start gap-2 rounded-[var(--bw-radius-control,0.625rem)] border border-[var(--cc-border,#e2e8f0)] bg-white px-3 py-2 shadow-sm">
      <div className="min-w-0 flex-1 border-l-[3px] border-[#1e3a5f] pl-2">
        <p className="text-[12px] font-semibold text-[#1e3a5f]">
          Réponse à {reply.senderName}
        </p>
        <p className="truncate text-[12px] text-slate-500">
          &ldquo;{shortQuoteLines(reply.excerpt, 80)}&rdquo;
        </p>
      </div>
      <button
        type="button"
        aria-label="Annuler la réponse"
        onClick={onClear}
        className="shrink-0 rounded-md px-1.5 py-0.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      >
        ×
      </button>
    </div>
  );
}
