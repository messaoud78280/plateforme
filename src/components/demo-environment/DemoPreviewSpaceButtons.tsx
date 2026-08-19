"use client";

import { useEffect, useState } from "react";

type PersonaOpt = { key: string; label: string; name: string };

export function DemoPreviewSpaceButtons() {
  const [busy, setBusy] = useState<string | null>(null);
  const [personas, setPersonas] = useState<PersonaOpt[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/demo/view-as");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setPersonas(Array.isArray(data.personas) ? data.personas : []);
        }
      } catch {
        /* ignore */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

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
      {personas.map((persona) => (
        <button
          key={persona.key}
          type="button"
          disabled={busy !== null}
          onClick={() => void preview(persona.key)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:border-[#1d4ed8] hover:text-[#1d4ed8] disabled:opacity-50"
        >
          {busy === persona.key ? "…" : `Espace ${persona.label}`}
        </button>
      ))}
    </div>
  );
}
