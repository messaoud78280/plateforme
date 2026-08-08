"use client";

import { useEffect, useState } from "react";
import type { AlertRuleConfig, EscalateConfig, UrgencyThresholds } from "@/lib/follow-up/types";
import { URGENCY_LABELS } from "@/lib/follow-up/types";

export default function AlertesParametresPage() {
  const [thresholds, setThresholds] = useState<UrgencyThresholds | null>(null);
  const [rules, setRules] = useState<AlertRuleConfig[]>([]);
  const [escalate, setEscalate] = useState<EscalateConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/follow-up/settings")
      .then((r) => r.json())
      .then((d) => {
        setThresholds(d.thresholds);
        setRules(d.rules ?? []);
        setEscalate(d.escalate);
      });
  }, []);

  async function save() {
    if (!thresholds || !escalate) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/follow-up/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thresholds, rules, escalate }),
      });
      setMsg(res.ok ? "Paramètres enregistrés." : "Erreur d’enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  if (!thresholds || !escalate) {
    return <p className="p-6 text-sm text-slate-500">Chargement…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Alertes et rappels</h1>
        <p className="mt-1 text-sm text-slate-600">
          Seuils d’urgence configurables, règles métier BTP et escalade. Objectif : éviter les oublis sans
          harceler.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">Seuils d’urgence</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["normalMinDays", "Normal si échéance > (jours)"],
              ["watchMaxDays", "À surveiller sous (jours)"],
              ["importantMaxHours", "Important sous (heures)"],
              ["urgentMaxHours", "Urgent sous (heures)"],
              ["criticalOverdueHours", "Critique si retard > (heures)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600">{label}</span>
              <input
                type="number"
                min={0}
                value={thresholds[key]}
                onChange={(e) =>
                  setThresholds({ ...thresholds, [key]: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">Règles métier</h2>
        <ul className="mt-4 space-y-3">
          {rules.map((rule, idx) => (
            <li key={rule.id} className="rounded-xl border border-slate-100 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{rule.label}</p>
                  <p className="text-xs text-slate-500">{rule.description}</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(e) => {
                      const next = [...rules];
                      next[idx] = { ...rule, enabled: e.target.checked };
                      setRules(next);
                    }}
                  />
                  Actif
                </label>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <label className="text-xs">
                  Délai (h)
                  <input
                    type="number"
                    value={rule.delayHours}
                    onChange={(e) => {
                      const next = [...rules];
                      next[idx] = { ...rule, delayHours: Number(e.target.value) };
                      setRules(next);
                    }}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                  />
                </label>
                <label className="text-xs">
                  Urgence
                  <select
                    value={rule.urgency}
                    onChange={(e) => {
                      const next = [...rules];
                      next[idx] = {
                        ...rule,
                        urgency: e.target.value as AlertRuleConfig["urgency"],
                      };
                      setRules(next);
                    }}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                  >
                    {Object.entries(URGENCY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-col gap-1 text-xs pt-5">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rule.notifyAssignee}
                      onChange={(e) => {
                        const next = [...rules];
                        next[idx] = { ...rule, notifyAssignee: e.target.checked };
                        setRules(next);
                      }}
                    />
                    Responsable
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rule.notifyOwner}
                      onChange={(e) => {
                        const next = [...rules];
                        next[idx] = { ...rule, notifyOwner: e.target.checked };
                        setRules(next);
                      }}
                    />
                    Dirigeant / propriétaire
                  </label>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">Escalade</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            Alerte propriétaire après retard (h)
            <input
              type="number"
              value={escalate.escalateToOwnerAfterHours}
              onChange={(e) =>
                setEscalate({ ...escalate, escalateToOwnerAfterHours: Number(e.target.value) })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Critique / dirigeant après retard (h)
            <input
              type="number"
              value={escalate.escalateCriticalAfterHours}
              onChange={(e) =>
                setEscalate({ ...escalate, escalateCriticalAfterHours: Number(e.target.value) })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {msg && <p className="text-sm text-slate-600">{msg}</p>}
      </div>
    </div>
  );
}
