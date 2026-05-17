"use client";

import {
  PPSPS_ALERT_LABELS,
  PPSPS_RISK_FAMILIES,
  type PpspsRiskAlert,
} from "@/content/ppsps-risk-tasks";

const ALERT_STYLES: Record<PpspsRiskAlert, string> = {
  high: "bg-red-50 text-red-800 border-red-200",
  verify: "bg-amber-50 text-amber-900 border-amber-200",
  habilitation: "bg-violet-50 text-violet-900 border-violet-200",
  csps: "bg-sky-50 text-sky-900 border-sky-200",
};

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function SkillPpspsRiskChecklist({ selectedIds, onChange }: Props) {
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const toggleFamily = (taskIds: string[]) => {
    const allSelected = taskIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      onChange(selectedIds.filter((id) => !taskIds.includes(id)));
    } else {
      onChange([...new Set([...selectedIds, ...taskIds])]);
    }
  };

  return (
    <div className="space-y-4">
      {PPSPS_RISK_FAMILIES.map((family) => {
        const familyIds = family.tasks.map((t) => t.id);
        const selectedInFamily = familyIds.filter((id) => selectedIds.includes(id)).length;
        return (
          <div key={family.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">{family.title}</h3>
              <button
                type="button"
                onClick={() => toggleFamily(familyIds)}
                className="text-xs font-semibold text-[#2563eb] hover:underline"
              >
                {selectedInFamily === familyIds.length ? "Tout décocher" : "Tout cocher"}
                {selectedInFamily > 0 && selectedInFamily < familyIds.length
                  ? ` (${selectedInFamily}/${familyIds.length})`
                  : null}
              </button>
            </div>
            <ul className="space-y-2">
              {family.tasks.map((task) => (
                <li key={task.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent bg-white px-3 py-2.5 shadow-sm transition hover:border-slate-200">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(task.id)}
                      onChange={() => toggle(task.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#1e3a5f] focus:ring-[#2563eb]/30"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-slate-800">{task.label}</span>
                      {task.alerts?.length ? (
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          {task.alerts.map((a) => (
                            <span
                              key={a}
                              className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ALERT_STYLES[a]}`}
                            >
                              {PPSPS_ALERT_LABELS[a]}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
