"use client";

import { useState } from "react";
import { isLongMessageBody } from "@/lib/messagerie/message-expand";

type Props = {
  text: string;
  className?: string;
  /** Suffixe inline (ex. « (interne) ») — hors troncature. */
  suffix?: string;
};

export function MessageExpandableBody({ text, className, suffix }: Props) {
  const long = isLongMessageBody(text);
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const shown = long && !expanded ? truncateForPreview(text) : text;

  return (
    <div className={className}>
      <p className="whitespace-pre-wrap break-words text-[14.2px] leading-[19px]">
        {shown}
        {suffix ? suffix : null}
      </p>
      {long ? (
        <button
          type="button"
          className="mt-0.5 text-[12.5px] font-semibold text-[#027eb5] hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {expanded ? "Voir moins" : "Voir plus"}
        </button>
      ) : null}
    </div>
  );
}

function truncateForPreview(text: string): string {
  const lines = text.split("\n");
  if (lines.length > 10) {
    return `${lines.slice(0, 10).join("\n")}…`;
  }
  if (text.length > 480) {
    return `${text.slice(0, 479)}…`;
  }
  return text;
}
