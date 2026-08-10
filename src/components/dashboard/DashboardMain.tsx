"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Conteneur principal dashboard — Agenda, Planning & Messagerie full-bleed ; reste ~1520.
 * Feedback clic : léger fondu pendant le passage de route (PERF-V2A).
 */
export function DashboardMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingNav, setPendingNav] = useState(false);
  const isAgenda = Boolean(pathname?.startsWith("/dashboard/agenda"));
  const isPlanning = Boolean(pathname?.startsWith("/dashboard/planning"));
  const isMessagerie = Boolean(pathname?.startsWith("/dashboard/messagerie"));
  const fullBleed = isAgenda || isPlanning || isMessagerie;

  useEffect(() => {
    setPendingNav(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      const a = t?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/dashboard")) return;
      if (a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return;
        }
        setPendingNav(true);
      } catch {
        // ignore
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <main
      id="contenu-principal"
      tabIndex={-1}
      className={cn(
        "cc-enter w-full min-w-0 flex-1 outline-none transition-opacity duration-150",
        pendingNav ? "opacity-70" : "opacity-100",
        fullBleed
          ? isAgenda || isMessagerie
            ? "max-w-none px-0 py-0 pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0"
            : "max-w-none px-3 py-4 pb-20 sm:px-4 lg:px-5 lg:pb-6"
          : "mx-auto max-w-dashboard px-3 py-6 pb-24 sm:px-5 sm:py-7 lg:pb-8",
      )}
      aria-busy={pendingNav || undefined}
    >
      {children}
    </main>
  );
}
