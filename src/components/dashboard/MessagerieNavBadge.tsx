"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Badge non-lus Messagerie (conversations avec messages non lus). */
export function MessagerieNavBadge({ active }: { active?: boolean }) {
  const pathname = usePathname();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/messagerie/unread-count", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { total?: number };
        if (!cancelled) setTotal(typeof data.total === "number" ? data.total : 0);
      } catch {
        // silencieux
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pathname]);

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
