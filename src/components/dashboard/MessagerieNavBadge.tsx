"use client";

import { cn } from "@/lib/cn";
import { useMessagerieUnread } from "@/hooks/useMessagerieUnread";

/** Badge non-lus Messagerie (conversations) — poll partagé PERF-V1A. */
export function MessagerieNavBadge({
  active,
  compact,
}: {
  active?: boolean;
  compact?: boolean;
}) {
  const total = useMessagerieUnread();

  if (total <= 0) return null;

  if (compact) {
    return (
      <span
        className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-bework-watch"
        aria-hidden
      />
    );
  }

  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-[1.15rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
        active
          ? "bg-bework-watch/15 text-[#b45309]"
          : "bg-bework-watch text-white",
      )}
      aria-hidden
    >
      {total > 99 ? "99+" : total}
    </span>
  );
}
