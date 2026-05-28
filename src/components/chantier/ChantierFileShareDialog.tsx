"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Recipient = {
  id: string;
  name: string;
  roleLabel: string;
  channel: "project" | "direct";
};

export function ChantierFileShareDialog({
  open,
  onClose,
  projectId,
  fileId,
  fileName,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  fileId: string;
  fileName: string;
}) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError("");
    setSuccessUrl(null);
    setMessage("");
    setRecipientId("");
    setLoadingRecipients(true);
    fetch(`/api/chantier/files/share-recipients?projectId=${encodeURIComponent(projectId)}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.recipients) ? (data.recipients as Recipient[]) : [];
        setRecipients(list);
        if (list[0]) setRecipientId(list[0].id);
      })
      .catch(() => setError("Impossible de charger les destinataires."))
      .finally(() => setLoadingRecipients(false));
  }, [open, projectId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, sending]);

  async function handleSend() {
    if (!recipientId) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/chantier/files/${fileId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, message: message.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de l’envoi");
        return;
      }
      setSuccessUrl(typeof data.messagerieUrl === "string" ? data.messagerieUrl : "/dashboard/messagerie");
    } catch {
      setError("Erreur réseau");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  const selected = recipients.find((r) => r.id === recipientId);

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Fermer" />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">Transférer par messagerie</h3>
        <p className="mt-1 truncate text-sm text-slate-600">{fileName}</p>

        {successUrl ? (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            <p className="font-semibold">Document envoyé</p>
            <p className="mt-1 text-green-800">Le destinataire le retrouvera dans sa messagerie.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={successUrl}
                className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]"
              >
                Ouvrir la messagerie
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <>
            {loadingRecipients ? (
              <p className="mt-4 text-sm text-slate-600">Chargement des destinataires…</p>
            ) : recipients.length === 0 ? (
              <p className="mt-4 text-sm text-amber-800">
                Aucun destinataire disponible pour ce chantier.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="share-recipient" className="block text-xs font-semibold uppercase text-slate-500">
                    Destinataire
                  </label>
                  <select
                    id="share-recipient"
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {recipients.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} — {r.roleLabel}
                        {r.channel === "direct" ? " (message direct)" : " (messagerie chantier)"}
                      </option>
                    ))}
                  </select>
                  {selected ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {selected.channel === "direct"
                        ? "Pièce jointe dans les messages directs (équipe BeWork)."
                        : "Message sur le chantier avec lien de téléchargement sécurisé."}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="share-message" className="block text-xs font-semibold uppercase text-slate-500">
                    Message (optionnel)
                  </label>
                  <textarea
                    id="share-message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ex. Voici le tableau de prospection pour validation…"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={sending || !recipientId || recipients.length === 0}
                onClick={() => void handleSend()}
                className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50"
              >
                {sending ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
