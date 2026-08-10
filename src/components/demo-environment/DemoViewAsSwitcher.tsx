"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OPEN_DEMO_TOUR_EVENT } from "@/lib/demo-environment/open-demo-tour-event";

type PersonaOpt = { key: string; label: string; name: string };

const PERSONA_CHANGED = "bework:persona-changed";

export function DemoViewAsSwitcher() {
  const router = useRouter();
  const [personas, setPersonas] = useState<PersonaOpt[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
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

  useEffect(() => {
    function onPersonaChanged(e: Event) {
      const detail = (e as CustomEvent<{ persona?: string }>).detail;
      if (detail?.persona) setCurrent(detail.persona);
      else void load();
    }
    window.addEventListener(PERSONA_CHANGED, onPersonaChanged);
    return () => window.removeEventListener(PERSONA_CHANGED, onPersonaChanged);
  }, [load]);

  async function onChange(persona: string) {
    if (persona === current || loading || pending) return;
    setLoading(true);
    setCurrent(persona);
    try {
      const { switchDemoPersona } = await import(
        "@/lib/demo-environment/switch-persona-client"
      );
      const result = await switchDemoPersona(
        persona as import("@/lib/demo-environment/personas").DemoPersonaKey,
      );
      if (result.ok) {
        startTransition(() => {
          router.replace("/dashboard");
          router.refresh();
        });
        return;
      }
      await load();
    } catch {
      await load();
    } finally {
      setLoading(false);
    }
  }

  if (personas.length === 0) return null;

  const busy = loading || pending;

  return (
    <div
      className="flex items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50/90 px-2 py-1"
      data-testid="demo-header-controls"
    >
      <label className="hidden text-[10px] font-bold uppercase tracking-wide text-amber-900 sm:block">
        Démo
      </label>
      <div className="relative flex items-center gap-1.5">
        <select
          value={current ?? "direction"}
          disabled={busy}
          onChange={(e) => void onChange(e.target.value)}
          className="max-w-[160px] rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 disabled:opacity-70 sm:max-w-[200px]"
          title={companyName ? `Démo ${companyName}` : "Basculer le profil démo"}
          aria-busy={busy}
          aria-label="Voir comme"
        >
          {personas.map((p) => (
            <option key={p.key} value={p.key}>
              {p.key === "conducteur"
                ? `Conducteur — ${p.name.split(" ")[0]}`
                : p.key === "administratif"
                  ? `Administratif — ${p.name.split(" ")[0]}`
                  : `${p.label} — ${p.name.split(" ")[0]}`}
            </option>
          ))}
        </select>
        {busy ? (
          <span
            className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-amber-600 border-t-transparent"
            aria-hidden
          />
        ) : null}
      </div>
      <button
        type="button"
        data-testid="demo-tour-menu-launch"
        onClick={() => {
          window.dispatchEvent(new CustomEvent(OPEN_DEMO_TOUR_EVENT));
        }}
        className="inline-flex rounded-md border border-amber-300/80 bg-white px-2 py-1 text-[11px] font-semibold text-amber-950 hover:bg-amber-100/80"
        title="Lancer la présentation commerciale BeWork"
      >
        ▶ Présenter
      </button>
    </div>
  );
}
