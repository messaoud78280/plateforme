"use client";

import { useState } from "react";
import { DEMO_PERSONA_KEYS, DEMO_PERSONAS } from "@/lib/demo-environment/personas";

export function DemoPreviewSpaceButtons() {
  const [busy, setBusy] = useState<string | null>(null);

  async function preview(persona: string) {
    setBusy(persona);
    try {
      const res = await fetch("/api/demo/view-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona }),
      });
      if (res.ok) {
        window.location.href = "/dashboard";
        return;
      }
    } catch {
      /* ignore */
    }
    setBusy(null);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {DEMO_PERSONA_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          disabled={busy !== null}
          onClick={() => void preview(key)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:border-[#1d4ed8] hover:text-[#1d4ed8] disabled:opacity-50"
        >
          {busy === key ? "…" : `Espace ${DEMO_PERSONAS[key].label}`}
        </button>
      ))}
    </div>
  );
}
