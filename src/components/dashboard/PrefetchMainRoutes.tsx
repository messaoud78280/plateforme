"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { canAccessDashboardHref } from "@/lib/equipe-acces/dashboard-policy";

const PREFETCH_HREFS = [
  "/dashboard",
  "/dashboard/a-traiter",
  "/dashboard/messagerie",
  "/dashboard/projets",
  "/dashboard/planning",
  "/dashboard/agenda",
  "/dashboard/commandes",
  "/dashboard/documents",
  "/dashboard/livraisons",
  "/dashboard/facturation",
] as const;

/** Prefetch ciblé des pages autorisées pour le persona — pas toute l’app (PERF-V1A). */
export function PrefetchMainRoutes({
  personType,
  permissionProfile,
}: {
  personType?: string | null;
  permissionProfile?: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      for (const href of PREFETCH_HREFS) {
        if (!canAccessDashboardHref(href, personType, permissionProfile)) continue;
        try {
          router.prefetch(href);
        } catch {
          // ignore
        }
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [router, personType, permissionProfile]);

  return null;
}
