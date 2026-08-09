"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const PREFETCH_HREFS = [
  "/dashboard",
  "/dashboard/a-traiter",
  "/dashboard/messagerie",
  "/dashboard/projets",
  "/dashboard/planning",
  "/dashboard/agenda",
  "/dashboard/commandes",
] as const;

/** Prefetch ciblé des pages principales — pas toute l’app (PERF-V1A). */
export function PrefetchMainRoutes() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      for (const href of PREFETCH_HREFS) {
        try {
          router.prefetch(href);
        } catch {
          // ignore
        }
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [router]);

  return null;
}
