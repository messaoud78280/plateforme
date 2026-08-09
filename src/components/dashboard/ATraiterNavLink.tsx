"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Lien nav « À traiter » avec badge compteur (rafraîchi ~60 s). */
export function ATraiterNavLink({ activeClass }: { activeClass: string }) {
  const pathname = usePathname();
  const [total, setTotal] = useState(0);
  const [capped, setCapped] = useState(false);
  const isActive = pathname === "/dashboard/a-traiter" || pathname.startsWith("/dashboard/a-traiter/");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/a-traiter/count", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { total?: number; capped?: boolean };
        if (!cancelled) {
          setTotal(typeof data.total === "number" ? data.total : 0);
          setCapped(Boolean(data.capped));
        }
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

  // Si plafonné : jamais un chiffre présenté comme exact (ex. « 3 » au lieu de 7).
  // Si plafonné et 0 hot dans l’échantillon : « 200+ » = saturation, pas « rien ».
  const label =
    total <= 0 && !capped
      ? null
      : capped
        ? `${total <= 0 ? "200" : total > 99 ? "99" : total}+`
        : total > 99
          ? "99+"
          : String(total);

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
