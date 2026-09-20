"use client";

import { FileText } from "lucide-react";
import {
  LOT_TECHNICAL_FIELDS,
  type LotFieldDef,
} from "@/lib/site-visits/survey-types";
import {
  VisitSectionCard,
  visitFieldClass,
  visitLabelClass,
} from "@/components/site-visits/VisitSectionCard";

export type LotSheets = Record<string, Record<string, string>>;

type Props = {
  lots: string[];
  values: LotSheets;
  onChange: (next: LotSheets) => void;
};

function fieldsForLot(lot: string): LotFieldDef[] {
  if (LOT_TECHNICAL_FIELDS[lot]) return LOT_TECHNICAL_FIELDS[lot]!;
  // Fallback proche pour lots non listés
  if (lot.toLowerCase().includes("carrel")) return LOT_TECHNICAL_FIELDS.Carrelage ?? [];
  if (lot.toLowerCase().includes("étanch") || lot.toLowerCase().includes("etanch"))
    return LOT_TECHNICAL_FIELDS["Étanchéité"] ?? [];
  return LOT_TECHNICAL_FIELDS.Revêtements ?? [];
}

export function VisitLotSheetsPanel({ lots, values, onChange }: Props) {
  const activeLots = lots.length > 0 ? lots : ["Revêtements"];

  function setField(lot: string, key: string, value: string) {
    onChange({
      ...values,
      [lot]: {
        ...(values[lot] ?? {}),
        [key]: value,
      },
    });
  }

  return (
    <div className="space-y-4">
      {activeLots.map((lot) => {
        const fields = fieldsForLot(lot);
        const filled = fields.filter((f) => (values[lot]?.[f.key] ?? "").trim()).length;
        return (
          <VisitSectionCard
            key={lot}
            tone="cyan"
            icon={FileText}
            title={`Fiche technique — ${lot}`}
            hint={`${filled}/${fields.length} renseignés · valeurs persistées avec la visite`}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <label key={f.key} className="block">
                  <span className={visitLabelClass}>{f.label}</span>
                  <input
                    className={visitFieldClass}
                    value={values[lot]?.[f.key] ?? ""}
                    onChange={(e) => setField(lot, f.key, e.target.value)}
                    placeholder="À renseigner sur place"
                  />
                </label>
              ))}
            </div>
          </VisitSectionCard>
        );
      })}
    </div>
  );
}
