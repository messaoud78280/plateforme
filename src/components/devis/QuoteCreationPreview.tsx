"use client";

type Props = {
  title: string;
  clientLabel: string;
  documentNumberPreview: string;
  issueDateLabel: string;
  onAddClient?: () => void;
};

/** Aperçu statique du modèle commercial (sans coordonnées société). */
export function QuoteCreationPreview({ title, clientLabel, documentNumberPreview, issueDateLabel, onAddClient }: Props) {
  const hasClient = Boolean(clientLabel.trim());

  return (
    <div className="flex h-full min-h-[520px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Aperçu</p>
      </div>
      <div className="flex flex-1 flex-col p-5 text-slate-800">
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">{title || "Cliquez ici pour ajouter un titre"}</p>
          {hasClient ? (
            <p className="mt-1 text-xs text-slate-600">{clientLabel}</p>
          ) : (
            <button
              type="button"
              onClick={onAddClient}
              className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400 transition hover:border-[#1e3a5f]/40 hover:bg-amber-50/50 hover:text-[#1e3a5f]"
            >
              Cliquez ici pour ajouter un client
            </button>
          )}
          {hasClient && onAddClient ? (
            <button type="button" onClick={onAddClient} className="mt-1 text-[10px] font-semibold text-[#1e3a5f] hover:underline">
              Modifier le client
            </button>
          ) : null}
        </div>
        <div className="mt-8 text-center">
          <p className="text-lg font-bold tracking-tight text-slate-900">
            DEVIS N° {documentNumberPreview}
            <span className="text-sm font-semibold text-amber-700"> (PROVISOIRE)</span>
          </p>
          <p className="mt-2 text-sm text-slate-600">{issueDateLabel}</p>
        </div>
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-slate-100 text-[9px] font-bold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-2 py-2">Référence</th>
                <th className="px-2 py-2">Désignation</th>
                <th className="px-2 py-2 text-right">Quantité</th>
                <th className="px-2 py-2 text-right">PU Vente</th>
                <th className="px-2 py-2 text-right">TVA</th>
                <th className="px-2 py-2 text-right">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-2 py-8 text-center text-xs italic text-slate-400">
                  Cliquez ici pour saisir vos lignes
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-4 pt-6">
          <div>
            <p className="text-xs font-bold text-slate-800">Bon pour Accord</p>
            <div className="mt-1 h-16 rounded border border-dashed border-slate-300 bg-slate-50/50" />
            <p className="mt-3 text-xs font-bold text-slate-800">Conditions de paiement</p>
            <ul className="mt-1 space-y-0.5 text-[10px] text-slate-500">
              <li>30,00 % — Acompte à la commande</li>
              <li>40,00 % — Acompte en cours de chantier</li>
              <li>30,00 % — Paiement du solde</li>
            </ul>
          </div>
          <div className="rounded-lg bg-slate-100 p-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total HT</span>
              <span>0,00 €</span>
            </div>
            <div className="mt-2 flex justify-between text-slate-600">
              <span>TVA</span>
              <span>0,00 €</span>
            </div>
            <div className="mt-2 flex justify-between font-bold text-slate-900">
              <span>Total TTC</span>
              <span>0,00 €</span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-[8px] leading-snug text-slate-400">
          Clause de réserve de propriété et mentions légales en pied de page du PDF.
        </p>
        <p className="mt-1 text-right text-[9px] text-slate-400">Page 1 / 1</p>
      </div>
    </div>
  );
}
