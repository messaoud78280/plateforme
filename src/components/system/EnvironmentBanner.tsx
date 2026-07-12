"use client";

import { getEnvironmentIdentity, type BeWorkEnvironment } from "@/lib/environment";
import { cn } from "@/lib/cn";

const toneClass: Record<string, string> = {
  neutral: "border-bework-navy/15 bg-bework-navy-soft text-bework-navy",
  watch: "border-amber-300 bg-amber-50 text-amber-950",
  intel: "border-violet-300 bg-violet-50 text-violet-950",
  critical: "border-red-300 bg-red-50 text-red-900",
  ok: "border-emerald-300 bg-emerald-50 text-emerald-900",
};

/** Bandeau discret d’identité d’environnement (hors production). */
export function EnvironmentBanner({
  environment,
  extra,
}: {
  environment?: BeWorkEnvironment;
  extra?: string;
}) {
  const id = getEnvironmentIdentity(environment);
  if (!id.showBanner) return null;

  return (
    <div
      role="status"
      className={cn(
        "border-b px-3 py-1.5 text-center text-[11px] font-semibold tracking-wide",
        toneClass[id.tone],
      )}
    >
      {id.label}
      {extra ? ` · ${extra}` : ""}
      {" — "}ne pas confondre avec la production
    </div>
  );
}
