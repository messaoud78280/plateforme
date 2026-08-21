"use client";

import { useState } from "react";

export function PlatformSupportBanner({
  organizationName,
  mode,
  organizationId,
}: {
  organizationName: string;
  mode: "READ_ONLY" | "INTERVENTION";
  organizationId: string;
}) {
  const [busy, setBusy] = useState(false);
  const intervention = mode === "INTERVENTION";

  async function endSupport() {
    setBusy(true);
    try {
      const res = await fetch("/api/platform-admin/support/end", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { redirectTo?: string };
      window.location.assign(
        data.redirectTo || `/admin/organisations/${organizationId}`,
      );
    } catch {
      setBusy(false);
    }
  }

  return (
    <div
      role="status"
      className={
        intervention
          ? "border-b border-red-400 bg-red-600 px-3 py-2.5 text-center text-[12px] font-semibold text-white"
          : "border-b border-violet-400 bg-violet-700 px-3 py-2.5 text-center text-[12px] font-semibold text-white"
      }
    >
      <p>
        MODE SUPPORT BEWORK — {organizationName} —{" "}
        {intervention ? "INTERVENTION AUTORISÉE" : "LECTURE SEULE"}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void endSupport()}
        className="mt-1.5 rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide hover:bg-white/25 disabled:opacity-60"
      >
        {busy ? "Fermeture…" : "Quitter le mode support"}
      </button>
    </div>
  );
}
