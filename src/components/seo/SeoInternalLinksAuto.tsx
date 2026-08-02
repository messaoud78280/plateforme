"use client";

import { usePathname } from "next/navigation";
import { SeoInternalLinks } from "@/components/seo/SeoInternalLinks";

/** Maillage interne automatique selon l’URL courante (tutos / guides ressources). */
export function SeoInternalLinksAuto({ className = "mt-12 mb-16" }: { className?: string }) {
  const pathname = usePathname();
  if (!pathname || pathname === "/ressources" || pathname === "/ressources/tutos" || pathname === "/ressources/guides") {
    return null;
  }
  return (
    <div className="mx-auto w-full max-w-6xl px-6">
      <SeoInternalLinks path={pathname} className={className} />
    </div>
  );
}
