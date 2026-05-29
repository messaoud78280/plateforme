"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TaskClientReportProps {
  taskId: string;
  taskTitle: string;
  clientName?: string;
  actionsUsed?: number | null;
  creditsDeductedAt?: Date | string | null;
  clientReport?: string | null;
  clientReportSentAt?: Date | string | null;
  isManager: boolean;
  isClient: boolean;
  taskStatus: string;
  onSent?: () => void | Promise<void>;
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskClientReport({
  taskId,
  taskTitle,
  clientName,
  actionsUsed,
  creditsDeductedAt,
  clientReport,
  clientReportSentAt,
  isManager,
  isClient,
  taskStatus,
  onSent,
}: TaskClientReportProps) {
  const router = useRouter();
  const [content, setContent] = useState(clientReport ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const alreadySent = Boolean(clientReportSentAt);
  const canSend = isManager && taskStatus === "COMPLETE" && !alreadySent;
  const showClientView = isClient && alreadySent && clientReport;

  if (!isManager && !showClientView) return null;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/client-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(
          `Compte rendu envoyé à ${clientName ?? "le client"}. ${
            data.creditsDeducted ? `${data.creditsDeducted} crédit(s) décomptés.` : ""
          }`
        );
        await onSent?.();
        router.refresh();
      } else {
        setError((data as { error?: string }).error ?? "Envoi impossible.");
      }
    } catch {
      setError("Erreur réseau. Réessayez dans un instant.");
    } finally {
      setSending(false);
    }
  }

  if (showClientView) {
    return (
      <div id="compte-rendu" className="scroll-mt-6 rounded-xl border border-green-200 bg-green-50/40 p-6">
        <h2 className="mb-2 text-lg font-semibold text-slate-800">Compte rendu de mission</h2>
        <p className="mb-4 text-xs text-slate-500">
          Transmis le {formatDate(clientReportSentAt)}
          {actionsUsed ? ` · ${actionsUsed} crédit${actionsUsed > 1 ? "s" : ""} décomptés` : ""}
        </p>
        <div className="rounded-lg border border-green-100 bg-white p-4 text-sm whitespace-pre-wrap text-slate-800">
          {clientReport}
        </div>
      </div>
    );
  }

  return (
    <div id="compte-rendu" className="scroll-mt-6 rounded-xl border border-[color:var(--primary-100)] bg-[color:var(--primary-50)]/30 p-6">
      <h2 className="mb-2 text-lg font-semibold text-slate-800">Compte rendu client</h2>
      <p className="mb-4 text-sm text-slate-600">
        Rédigez le compte rendu pour {clientName ?? "le client"}. À l&apos;envoi, les crédits de la mission
        {actionsUsed ? ` (${actionsUsed})` : ""} seront décomptés de son compteur et il recevra une notification.
      </p>

      {creditsDeductedAt && !alreadySent && (
        <p className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          Crédits déjà décomptés le {formatDate(creditsDeductedAt)} (validation). L&apos;envoi transmettra le compte rendu au client.
        </p>
      )}

      {alreadySent ? (
        <div className="space-y-3">
          <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            Compte rendu envoyé le {formatDate(clientReportSentAt)}
          </p>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm whitespace-pre-wrap text-slate-800">
            {clientReport}
          </div>
        </div>
      ) : canSend ? (
        <form onSubmit={handleSend} className="flex flex-col gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Résumé du travail réalisé, livrables, points d'attention, prochaines étapes…"
            rows={6}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[color:var(--accent-500)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent-500)]"
          />
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          )}
          {success && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{success}</p>
          )}
          <button
            type="submit"
            disabled={!content.trim() || sending}
            className="w-fit rounded-lg bg-[color:var(--accent-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--accent-700)] disabled:opacity-50"
          >
            {sending ? "Envoi…" : "Envoyer le compte rendu au client"}
          </button>
        </form>
      ) : taskStatus !== "COMPLETE" ? (
        <p className="text-sm text-amber-800">
          Disponible après validation de la mission (statut Terminée).
        </p>
      ) : null}
    </div>
  );
}
