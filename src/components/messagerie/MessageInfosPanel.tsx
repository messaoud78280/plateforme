"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  data: {
    senderName: string;
    conversationLabel: string;
    partyLabel: string;
    sentAt: string;
    attachmentSummary?: string;
    replyToLabel?: string | null;
    deliveryNote?: string;
  } | null;
};

export function MessageInfosPanel({ open, onClose, data }: Props) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Fermer" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Infos message"
        className="relative z-10 w-full max-w-sm rounded-[var(--bw-radius-panel,1.125rem)] border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide text-[#1e3a5f]">MESSAGE</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>
        <dl className="space-y-3 text-[13px]">
          <Row label="Envoyé par" value={data.senderName} />
          <Row label="Conversation" value={data.conversationLabel} />
          <Row label="Type" value={data.partyLabel} />
          <Row label="Envoyé" value={data.sentAt} />
          {data.attachmentSummary ? (
            <Row label="Pièces jointes" value={data.attachmentSummary} />
          ) : null}
          {data.replyToLabel ? <Row label="Réponse à" value={data.replyToLabel} /> : null}
          <Row label="Statut" value={data.deliveryNote ?? "Envoyé"} />
        </dl>
        <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
          Accusés « Livré / Lu » : non disponibles sur ce fil pour l’instant (pas de
          deliveredAt / readAt unifiés).
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{value}</dd>
    </div>
  );
}
