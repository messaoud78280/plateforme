"use client";

import { cn } from "@/lib/cn";
import { useMessagerieUnread } from "@/hooks/useMessagerieUnread";

/** Badge non-lus Messagerie (conversations) — poll partagé PERF-V1A. */
export function MessagerieNavBadge({ active }: { active?: boolean }) {
  const total = useMessagerieUnread();

  if (total <= 0) return null;

  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
        active ? "bg-white/20 text-white" : "bg-[#00a884] text-white",
      )}
      aria-hidden
    >
      {total > 99 ? "99+" : total}
    </span>
  );
}
