"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useATraiterCount } from "@/hooks/useATraiterCount";

/** Lien nav « À traiter » avec badge compteur (bus partagé + pause onglet caché). */
export function ATraiterNavLink({ activeClass }: { activeClass: string }) {
  const pathname = usePathname();
  const { total, capped, label } = useATraiterCount();
  const isActive =
    pathname === "/dashboard/a-traiter" || pathname.startsWith("/dashboard/a-traiter/");

  const inactiveClass =
    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-bework-ink/80 transition-colors hover:bg-bework-navy-soft hover:text-bework-navy sm:text-sm";

  return (
    <Link
      href="/dashboard/a-traiter"
      className={cn(isActive ? activeClass : inactiveClass, "gap-1.5")}
      aria-current={isActive ? "page" : undefined}
      aria-label={
        capped
          ? total > 0
            ? `À traiter, au moins ${total} points (échantillon saturé)`
            : "À traiter, échantillon saturé — ouvrir pour le détail"
          : total > 0
            ? `À traiter, ${total} points`
            : "À traiter"
      }
    >
      À traiter
      {label ? (
        <span
          className={cn(
            "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
            isActive ? "bg-white/20 text-white" : "bg-red-600 text-white",
          )}
        >
          {label}
        </span>
      ) : null}
    </Link>
  );
}
