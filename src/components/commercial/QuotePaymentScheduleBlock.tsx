"use client";

import {
  PAYMENT_SCHEDULE_PRESETS,
  PAYMENT_SCHEDULE_TYPES,
  computePaymentScheduleAmounts,
  defaultLabelForType,
  paymentScheduleTypeLabel,
  sumSchedulePercent,
  validatePaymentSchedule,
  type PaymentSchedule,
  type PaymentScheduleLine,
  type PaymentScheduleLineType,
} from "@/lib/commercial/payment-schedule";
import { roundMoney } from "@/lib/commercial/money";

function fmtMoney(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function QuotePaymentScheduleBlock({
  schedule,
  totalTtc,
  canEdit,
  onChange,
}: {
  schedule: PaymentSchedule | null;
  totalTtc: number;
  canEdit: boolean;
  onChange: (next: PaymentSchedule | null) => void;
}) {
  const lines = schedule?.lines ?? [];
  const computed = computePaymentScheduleAmounts(
    schedule && lines.length ? schedule : null,
    totalTtc,
  );
  const validation = validatePaymentSchedule(
    schedule && lines.length ? schedule : null,
  );
  const sum = sumSchedulePercent(lines);

  function commit(nextLines: PaymentScheduleLine[]) {
    if (nextLines.length === 0) {
      onChange(null);
      return;
    }
    onChange({
      basis: "TTC",
      lines: nextLines.map((l, i) => ({ ...l, sortOrder: i })),
    });
  }

  function applyPreset(key: keyof typeof PAYMENT_SCHEDULE_PRESETS) {
    onChange(PAYMENT_SCHEDULE_PRESETS[key]);
  }

  function updateLine(index: number, patch: Partial<PaymentScheduleLine>) {
    const next = lines.map((l, i) => {
      if (i !== index) return l;
      const type = (patch.type ?? l.type) as PaymentScheduleLineType;
      return {
        ...l,
        ...patch,
        type,
        label:
          patch.label !== undefined
            ? patch.label
            : patch.type && patch.type !== l.type
              ? defaultLabelForType(type)
              : l.label,
      };
    });
    commit(next);
  }

  function addLine() {
    commit([
      ...lines,
      {
        type: "CUSTOM",
        percent: 0,
        label: defaultLabelForType("CUSTOM"),
        sortOrder: lines.length,
      },
    ]);
  }

  function removeLine(index: number) {
    commit(lines.filter((_, i) => i !== index));
  }

  function moveLine(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= lines.length) return;
    const next = [...lines];
    const tmp = next[index];
    next[index] = next[j];
    next[j] = tmp;
    commit(next);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">
            Conditions de paiement
          </h3>
          <p className="text-[11px] text-slate-500">
            Échéancier sur total TTC · montants recalculés automatiquement
          </p>
        </div>
        {canEdit ? (
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["30_70", "30 / 70"],
                ["30_40_30", "30 / 40 / 30"],
                ["50_50", "50 / 50"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {computed.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aucun échéancier structuré.
          {canEdit ? " Choisissez un preset ou ajoutez une échéance." : ""}
        </p>
      ) : (
        <ul className="space-y-2">
          {computed.map((row, index) => (
            <li
              key={`${row.type}-${index}`}
              className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
            >
              {canEdit ? (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={row.type}
                    onChange={(e) =>
                      updateLine(index, {
                        type: e.target.value as PaymentScheduleLineType,
                      })
                    }
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                    aria-label="Type d’échéance"
                  >
                    {PAYMENT_SCHEDULE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {paymentScheduleTypeLabel(t)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={row.percent}
                    onChange={(e) =>
                      updateLine(index, { percent: Number(e.target.value) || 0 })
                    }
                    className="w-20 rounded border border-slate-200 px-2 py-1 text-xs tabular-nums"
                    aria-label="Pourcentage"
                  />
                  <span className="text-xs text-slate-500">%</span>
                  <input
                    value={row.label}
                    onChange={(e) => updateLine(index, { label: e.target.value })}
                    className="min-w-[10rem] flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
                    aria-label="Libellé"
                  />
                  <span className="ml-auto text-sm font-semibold tabular-nums text-slate-900">
                    {fmtMoney(row.amountTtc)} €
                  </span>
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveLine(index, -1)}
                      className="rounded px-1.5 text-xs text-slate-500 hover:bg-white"
                      aria-label="Monter"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLine(index, 1)}
                      className="rounded px-1.5 text-xs text-slate-500 hover:bg-white"
                      aria-label="Descendre"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="rounded px-1.5 text-xs text-red-600 hover:bg-white"
                      aria-label="Supprimer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ) : (
                <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-slate-800">
                  <span>
                    <span className="font-semibold">{row.percent} %</span>
                    {" — "}
                    {row.label}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {fmtMoney(row.amountTtc)} €
                  </span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {lines.length > 0 ? (
        <p
          className={
            !validation.ok
              ? "text-xs font-semibold text-red-700"
              : validation.level === "warn"
                ? "text-xs font-medium text-amber-800"
                : "text-xs text-slate-500"
          }
        >
          Total échéancier : {sum} %
          {!validation.ok ? ` — ${validation.error}` : null}
          {validation.ok && validation.level === "warn"
            ? " — incomplet (doit atteindre 100 % pour finaliser)"
            : null}
          {validation.ok && validation.level === "ok" && lines.length > 0
            ? " — cohérent"
            : null}
        </p>
      ) : null}

      {canEdit ? (
        <button
          type="button"
          onClick={addLine}
          className="text-xs font-semibold text-[#1d4ed8]"
        >
          + Ajouter une échéance
        </button>
      ) : null}
    </section>
  );
}
