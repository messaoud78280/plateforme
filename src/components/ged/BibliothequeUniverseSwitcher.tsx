"use client";

import { FileStack, Ruler } from "lucide-react";
import { cn } from "@/lib/cn";

export type BibliothequeUniverse = "documents" | "ouvrages";

export function BibliothequeUniverseSwitcher({
  value,
  onChange,
  showOuvrages = true,
}: {
  value: BibliothequeUniverse;
  onChange: (next: BibliothequeUniverse) => void;
  showOuvrages?: boolean;
}) {
  return (
    <div
      className="inline-flex w-full max-w-md rounded-2xl border border-bework-navy/10 bg-white/90 p-1 shadow-[var(--cc-shadow)] sm:w-auto"
      role="tablist"
      aria-label="Univers Bibliothèque"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "documents"}
        onClick={() => onChange("documents")}
        className={cn(
          "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition sm:flex-none sm:px-4",
          value === "documents"
            ? "bg-bework-soft-accent text-bework-accent shadow-sm"
            : "text-slate-500 hover:bg-slate-50 hover:text-bework-navy",
        )}
      >
        <FileStack className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
        Documents
      </button>
      {showOuvrages ? (
        <button
          type="button"
          role="tab"
          aria-selected={value === "ouvrages"}
          onClick={() => onChange("ouvrages")}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition sm:flex-none sm:px-4",
            value === "ouvrages"
              ? "bg-violet-50 text-violet-700 shadow-sm"
              : "text-slate-500 hover:bg-slate-50 hover:text-bework-navy",
          )}
        >
          <Ruler className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
          Ouvrages &amp; prix
        </button>
      ) : null}
    </div>
  );
}
