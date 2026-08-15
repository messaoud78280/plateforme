"use client";

import Link from "next/link";
import { CommercialSubNav } from "@/components/commercial/CommercialSubNav";

export function CommercialWorkspaceHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="flex min-h-12 flex-wrap items-center gap-x-4 gap-y-2 px-3 py-1.5 sm:px-5">
        <Link
          href="/dashboard/devis-facturation"
          className="flex min-w-0 shrink-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/30"
        >
          <span className="text-[15px] font-semibold tracking-tight text-[#1e3a5f]">
            BeWork
          </span>
          <span className="h-4 w-px bg-slate-200" aria-hidden />
          <span className="truncate text-[14px] font-medium text-slate-600">
            Devis & Facturation
          </span>
        </Link>
        <div className="min-w-0 flex-1 overflow-x-auto">
          <CommercialSubNav />
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 text-[13px] font-medium text-slate-600 transition-colors duration-150 hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/30"
        >
          ← Retour à la plateforme
        </Link>
      </div>
    </header>
  );
}
