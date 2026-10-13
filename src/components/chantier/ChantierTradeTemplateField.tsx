"use client";

import {
  CHANTIER_TRADE_TEMPLATES,
  getChantierTradeTemplate,
} from "@/lib/chantier/trade-templates";

export function ChantierTradeTemplateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (templateId: string) => void;
}) {
  const selected = getChantierTradeTemplate(value);

  return (
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium text-slate-700">
        Modèle métier
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">Chantier vierge — aucun lot type</option>
        {CHANTIER_TRADE_TEMPLATES.map((template) => (
          <option key={template.id} value={template.id}>
            {template.label}
          </option>
        ))}
      </select>
      {selected ? (
        <div className="mt-2 rounded-lg border border-[#1e3a5f]/15 bg-[#1e3a5f]/[0.04] px-3 py-2 text-[13px] text-slate-700">
          <p>{selected.summary}</p>
          <ul className="mt-2 space-y-1">
            {selected.lots.map((lot) => (
              <li key={lot.name}>
                <span className="font-semibold text-slate-900">{lot.name}</span>
                {" — "}
                {lot.phases.join(" · ")}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] text-slate-600">
            Paramètres entreprise, métiers, ouvrages, matériaux et fournisseurs
            de l’organisation restent la source. Quantités, prix de ce chantier,
            dates et client restent à saisir et à valider. Aucune commande,
            aucun devis accepté et aucune donnée d’un autre client ne sont
            recopiés.
          </p>
        </div>
      ) : (
        <p className="mt-1 text-[12px] text-slate-500">
          Sans modèle, le dossier s’ouvre vide. La bibliothèque de
          l’organisation reste disponible ensuite.
        </p>
      )}
    </div>
  );
}
