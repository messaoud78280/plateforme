"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Lien nav « À traiter » avec badge compteur (rafraîchi ~60 s). */
export function ATraiterNavLink({ activeClass }: { activeClass: string }) {
  const pathname = usePathname();
  const [total, setTotal] = useState(0);
  const isActive = pathname === "/dashboard/a-traiter" || pathname.startsWith("/dashboard/a-traiter/");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/a-traiter/count", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { total?: number };
        if (!cancelled) setTotal(typeof data.total === "number" ? data.total : 0);
      } catch {
        // silencieux : le lien reste utilisable sans badge
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const inactiveClass =
    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-bework-ink/80 transition-colors hover:bg-bework-navy-soft hover:text-bework-navy sm:text-sm";

  return (
    <Link
      href="/dashboard/a-traiter"
      className={cn(isActive ? activeClass : inactiveClass, "gap-1.5")}
      aria-current={isActive ? "page" : undefined}
      aria-label={total > 0 ? `À traiter, ${total} points` : "À traiter"}
    >
      À traiter
      {total > 0 ? (
        <span
          className={cn(
            "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
            isActive ? "bg-white/20 text-white" : "bg-red-600 text-white",
          )}
        >
          {total > 99 ? "99+" : total}
        </span>
      ) : null}
    </Link>
  );
}
