"use client";

import { useCallback, useEffect, useState } from "react";
import { POSTIT_COLORS } from "@/lib/follow-up/types";
import { WORKFLOW_DEFAULT_ROLES } from "@/lib/workflow/templates";

type Step = {
  id: string;
  statusKey: string;
  label: string;
  colorKey: string;
  sortOrder: number;
  visibleOnBoard: boolean;
  defaultRole: string | null;
  delayHours: number | null;
  reminderHours: number | null;
  alertOrangeHours: number | null;
  alertRedHours: number | null;
  nextActionLabel: string | null;
  nextActionDelayHours: number | null;
};

type Workflow = {
  id: string;
  name: string;
  description: string | null;
  templateKey: string | null;
  isDefault: boolean;
  steps: Step[];
};

export function WorkflowProcessEditor() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Step> | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/workflow");
    if (!res.ok) {
      setMsg("Impossible de charger les processus (droits admin requis).");
      return;
    }
    const data = await res.json();
    const list = (data.workflows ?? []) as Workflow[];
    setWorkflows(list);
    setSelectedId((prev) => prev ?? list.find((w) => w.isDefault)?.id ?? list[0]?.id ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = workflows.find((w) => w.id === selectedId) ?? null;

  function startEdit(step: Step) {
    setEditId(step.id);
    setDraft({ ...step });
    setMsg(null);
  }

  async function saveStep() {
    if (!editId || !draft) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/workflow/steps/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: draft.label,
          colorKey: draft.colorKey,
          defaultRole: draft.defaultRole,
          delayHours: draft.delayHours,
          reminderHours: draft.reminderHours,
          alertOrangeHours: draft.alertOrangeHours,
          alertRedHours: draft.alertRedHours,
          nextActionLabel: draft.nextActionLabel,
          nextActionDelayHours: draft.nextActionDelayHours,
          visibleOnBoard: draft.visibleOnBoard,
        }),
      });
      if (!res.ok) {
        setMsg("Erreur d’enregistrement.");
      } else {
        setMsg("Étape enregistrée.");
        setEditId(null);
        setDraft(null);
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function duplicate() {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: selected.id,
          name: `${selected.name} (copie)`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await load();
        setSelectedId(data.workflow?.id ?? null);
        setMsg("Processus dupliqué.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!selected) {
    return (
      <p className="text-sm text-slate-600">
        {msg ?? "Chargement du processus métier…"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Processus
          </label>
          <select
            value={selected.id}
            onChange={(e) => setSelectedId(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
          >
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
                {w.isDefault ? " (défaut)" : ""}
              </option>
            ))}
          </select>
          {selected.description ? (
            <p className="mt-2 max-w-xl text-sm text-slate-600">{selected.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void duplicate()}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Dupliquer
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Couleur = post-it métier · Urgence = niveau d’attention (configuré dans Alertes). Les deux restent
        séparés.
      </p>

      <ol className="space-y-3">
        {selected.steps
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((step, idx) => {
            const color = POSTIT_COLORS[step.colorKey] ?? POSTIT_COLORS.jaune;
            const editing = editId === step.id;
            return (
              <li key={step.id}>
                <div
                  className={`rounded-xl border-2 p-4 ${color.border} ${color.bg} ${color.text}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide opacity-70">
                        [{idx + 1}] {step.statusKey}
                      </p>
                      <p className="text-base font-bold">{step.label}</p>
                      <p className="mt-1 text-xs opacity-80">
                        Rôle : {step.defaultRole ?? "—"}
                        {step.delayHours != null ? ` · Délai ${step.delayHours}h` : ""}
                        {step.nextActionLabel ? ` · Puis : ${step.nextActionLabel}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(step)}
                      className="rounded-lg bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm"
                    >
                      Modifier
                    </button>
                  </div>

                  {editing && draft ? (
                    <div className="mt-4 space-y-3 rounded-lg border border-white/60 bg-white/90 p-3 text-slate-800">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs font-semibold">
                          Nom
                          <input
                            value={draft.label ?? ""}
                            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="block text-xs font-semibold">
                          Couleur post-it
                          <select
                            value={draft.colorKey ?? "jaune"}
                            onChange={(e) => setDraft({ ...draft, colorKey: e.target.value })}
                            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          >
                            {Object.keys(POSTIT_COLORS).map((k) => (
                              <option key={k} value={k}>
                                {k}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-xs font-semibold">
                          Responsable (rôle)
                          <select
                            value={draft.defaultRole ?? ""}
                            onChange={(e) =>
                              setDraft({ ...draft, defaultRole: e.target.value || null })
                            }
                            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          >
                            <option value="">—</option>
                            {WORKFLOW_DEFAULT_ROLES.map((r) => (
                              <option key={r.key} value={r.key}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-xs font-semibold">
                          Délai étape (heures)
                          <input
                            type="number"
                            value={draft.delayHours ?? ""}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                delayHours: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="block text-xs font-semibold">
                          Rappel après (h)
                          <input
                            type="number"
                            value={draft.reminderHours ?? ""}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                reminderHours: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="block text-xs font-semibold">
                          Alerte orange après (h)
                          <input
                            type="number"
                            value={draft.alertOrangeHours ?? ""}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                alertOrangeHours:
                                  e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="block text-xs font-semibold sm:col-span-2">
                          Prochaine action (auto)
                          <input
                            value={draft.nextActionLabel ?? ""}
                            onChange={(e) =>
                              setDraft({ ...draft, nextActionLabel: e.target.value || null })
                            }
                            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="block text-xs font-semibold">
                          Échéance action (h)
                          <input
                            type="number"
                            value={draft.nextActionDelayHours ?? ""}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                nextActionDelayHours:
                                  e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void saveStep()}
                          className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditId(null);
                            setDraft(null);
                          }}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
                {idx < selected.steps.length - 1 ? (
                  <p className="py-1 text-center text-slate-400">↓</p>
                ) : null}
              </li>
            );
          })}
      </ol>

      {msg ? <p className="text-sm font-medium text-emerald-700">{msg}</p> : null}
    </div>
  );
}
