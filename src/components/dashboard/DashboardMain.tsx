"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Conteneur principal dashboard — Agenda & Planning en largeur généreuse. */
export function DashboardMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAgenda = Boolean(pathname?.startsWith("/dashboard/agenda"));
  const isPlanning = Boolean(pathname?.startsWith("/dashboard/planning"));
  const fullBleed = isAgenda || isPlanning;

  return (
    <main
      id="contenu-principal"
      tabIndex={-1}
      className={cn(
        "cc-enter w-full min-w-0 flex-1 outline-none",
        fullBleed
          ? isAgenda
            ? "max-w-none px-0 py-0 pb-20 lg:pb-0"
            : "max-w-none px-3 py-4 pb-20 sm:px-4 lg:px-5 lg:pb-6"
          : "mx-auto max-w-site px-3 py-6 pb-24 sm:px-5 sm:py-8 lg:pb-8",
      )}
    >
      {children}
    </main>
  );
}
