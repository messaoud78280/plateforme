"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PersonaOpt = { key: string; label: string; name: string };

export function DemoViewAsSwitcher() {
  const router = useRouter();
  const [personas, setPersonas] = useState<PersonaOpt[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/demo/view-as");
      if (!res.ok) return;
      const data = await res.json();
      setPersonas(Array.isArray(data.personas) ? data.personas : []);
      setCurrent(data.current ?? null);
      setCompanyName(data.companyName ?? "");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onChange(persona: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/view-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona }),
      });
      if (res.ok) {
        setCurrent(persona);
        router.refresh();
        window.location.href = "/dashboard";
        return;
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  if (personas.length === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-2 py-1">
      <label className="hidden text-[10px] font-bold uppercase tracking-wide text-amber-900 sm:block">
        Voir comme
      </label>
      <select
        value={current ?? "direction"}
        disabled={loading}
        onChange={(e) => void onChange(e.target.value)}
        className="max-w-[160px] rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800"
        title={companyName ? `Démo ${companyName}` : "Basculer le profil démo"}
      >
        {personas.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
