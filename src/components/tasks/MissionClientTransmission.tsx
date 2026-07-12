"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientCreditsBadge } from "@/components/clients/ClientCreditsBadge";
import { documentDownloadHref } from "@/lib/documents/download-url";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  CLIENT_DECISION_LABELS,
  type ClientDecision,
} from "@/lib/tasks/client-decision";

type DeliveryPreview = {
  status: string;
  actionsUsed: number | null;
  timeSpentMinutes: number | null;
  creditsDeductedAt: string | null;
  clientReport: string | null;
  clientReportSentAt: string | null;
  correctionNote: string | null;
  documents: { id: string; name: string }[];
  chantierFiles: { id: string; name: string; folderLabel: string }[];
  defaultVisibleDocumentIds: string[];
  defaultVisibleChantierFileIds: string[];
  clientDelivery: {
    visibleDocumentIds: string[];
    visibleChantierFileIds: string[];
    showCorrectionNote: boolean;
  } | null;
  clientDecision?: string | null;
  clientDecisionAt?: string | null;
  clientDecisionNote?: string | null;
};

type Props = {
  taskId: string;
  clientId: string;
  clientName?: string;
  taskStatus: string;
  isStaff: boolean;
  isClient: boolean;
  onSent?: () => void | Promise<void>;
};

function formatDate(d: string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MissionClientTransmission({
  taskId,
  clientId,
  clientName,
  taskStatus,
  isStaff,
  isClient,
  onSent,
}: Props) {
  const router = useRouter();
  const [preview, setPreview] = useState<DeliveryPreview | null>(null);
  const [loading, setLoading] = useState(isStaff);
  const [content, setContent] = useState("");
  const [actionsUsed, setActionsUsed] = useState("");
  const [visibleDocIds, setVisibleDocIds] = useState<Set<string>>(new Set());
  const [visibleChantierIds, setVisibleChantierIds] = useState<Set<string>>(new Set());
  const [showCorrectionNote, setShowCorrectionNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [deciding, setDeciding] = useState<ClientDecision | null>(null);
  const validationEnabled = isFeatureEnabled("clientDeliverableValidation");

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const url = isClient
        ? `/api/tasks/${taskId}/client-report`
        : `/api/tasks/${taskId}/delivery-preview`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        if (isClient && res.status === 404) {
          setPreview(null);
          return;
        }
        setError(data.error ?? "Chargement impossible.");
        return;
      }
      if (isClient) {
        setPreview({
          status: data.status,
          actionsUsed: data.actionsUsed,
          timeSpentMinutes: null,
          creditsDeductedAt: data.creditsDeductedAt,
          clientReport: data.clientReport,
          clientReportSentAt: data.clientReportSentAt,
          correctionNote: data.correctionNoteForClient,
          documents: data.documents ?? [],
          chantierFiles: data.chantierFiles ?? [],
          defaultVisibleDocumentIds: [],
          defaultVisibleChantierFileIds: [],
          clientDelivery: data.clientDelivery,
          clientDecision: data.clientDecision ?? null,
          clientDecisionAt: data.clientDecisionAt ?? null,
          clientDecisionNote: data.clientDecisionNote ?? null,
        });
      } else {
        setContent(data.clientReport ?? "");
        setActionsUsed(String(data.actionsUsed ?? ""));
        setVisibleDocIds(new Set(data.defaultVisibleDocumentIds ?? []));
        setVisibleChantierIds(new Set(data.defaultVisibleChantierFileIds ?? []));
        setShowCorrectionNote(Boolean(data.clientDelivery?.showCorrectionNote));
        setPreview({
          ...(data as DeliveryPreview),
          clientDecision: data.clientDecision ?? null,
          clientDecisionAt: data.clientDecisionAt ?? null,
          clientDecisionNote: data.clientDecisionNote ?? null,
        });
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, [taskId, isClient]);

  useEffect(() => {
    if (isStaff || isClient) void loadPreview();
  }, [isStaff, isClient, loadPreview]);

  const alreadySent = Boolean(preview?.clientReportSentAt);
  const canTransmit =
    isStaff && (taskStatus === "COMPLETE" || taskStatus === "A_VALIDER") && !alreadySent;
  const canValidateOnly = isStaff && taskStatus === "A_VALIDER" && !alreadySent;

  function toggleId(set: Set<string>, id: string, checked: boolean) {
    const next = new Set(set);
    if (checked) next.add(id);
    else next.delete(id);
    return next;
  }

  async function handleValidateOnly() {
    const credits = parseInt(actionsUsed, 10);
    if (Number.isNaN(credits) || credits < 1) {
      setError("Indiquez le nombre de crédits à décompter (minimum 1).");
      return;
    }
    setValidating(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/validate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", actionsUsed: credits }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Validation impossible.");
        return;
      }
      setSuccess("Mission validée. Vous pouvez maintenant préparer la transmission au client.");
      await onSent?.();
      router.refresh();
      await loadPreview();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setValidating(false);
    }
  }

  async function handleTransmit() {
    if (!content.trim()) {
      setError("Le compte rendu client est requis pour transmettre.");
      return;
    }
    const credits = parseInt(actionsUsed, 10);
    if (Number.isNaN(credits) || credits < 1) {
      setError("Indiquez le nombre de crédits à décompter (minimum 1).");
      return;
    }
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/client-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          actionsUsed: credits,
          visibleDocumentIds: Array.from(visibleDocIds),
          visibleChantierFileIds: Array.from(visibleChantierIds),
          showCorrectionNote,
          validateIfNeeded: taskStatus === "A_VALIDER",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Transmission impossible.");
        return;
      }
      setSuccess(
        `Compte rendu transmis à ${clientName ?? "le client"}. ${credits} crédit${credits > 1 ? "s" : ""} décompté${credits > 1 ? "s" : ""}.${
          validationEnabled ? " En attente de validation client." : ""
        }`
      );
      await onSent?.();
      router.refresh();
      await loadPreview();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSending(false);
    }
  }

  async function handleClientDecision(decision: Exclude<ClientDecision, "EN_ATTENTE_CLIENT">) {
    if (decision !== "ACCEPTE" && decisionNote.trim().length < 5) {
      setError(
        decision === "REFUSE"
          ? "Indiquez le motif du refus et ce que BeWork doit corriger."
          : "Précisez vos réserves (ce qui reste à clarifier ou corriger)."
      );
      return;
    }
    setDeciding(decision);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/client-decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: decisionNote.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Enregistrement impossible.");
        return;
      }
      setSuccess(CLIENT_DECISION_LABELS[decision]);
      await onSent?.();
      router.refresh();
      await loadPreview();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setDeciding(null);
    }
  }

  function DecisionStatusBlock({
    decision,
    at,
    note,
  }: {
    decision: string | null | undefined;
    at?: string | null;
    note?: string | null;
  }) {
    if (!validationEnabled || !decision) return null;
    const label =
      decision in CLIENT_DECISION_LABELS
        ? CLIENT_DECISION_LABELS[decision as ClientDecision]
        : decision;
    const tone =
      decision === "ACCEPTE"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : decision === "EN_ATTENTE_CLIENT"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-red-200 bg-red-50 text-red-900";
    return (
      <div id="validation-client" className={`mt-4 scroll-mt-6 rounded-lg border p-3 text-sm ${tone}`}>
        <p className="font-semibold">{label}</p>
        {at ? <p className="mt-1 text-xs opacity-80">Le {formatDate(at)}</p> : null}
        {note ? <p className="mt-2 whitespace-pre-wrap">{note}</p> : null}
      </div>
    );
  }

  if (isClient) {
    if (loading) {
      return <p className="text-sm text-slate-500">Chargement du compte rendu…</p>;
    }
    if (!alreadySent || !preview?.clientReport) {
      return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm text-slate-600">
            Le compte rendu sera disponible ici une fois transmis par votre équipe BeWork.
          </p>
        </div>
      );
    }
    const delivery = preview?.clientDelivery;
    const visibleDocs = preview?.documents?.filter((d) =>
      delivery ? delivery.visibleDocumentIds.includes(d.id) : true
    );
    const visibleChantier = preview?.chantierFiles?.filter((f) =>
      delivery ? delivery.visibleChantierFileIds.includes(f.id) : true
    );

    return (
      <div id="compte-rendu" className="scroll-mt-6 rounded-xl border border-green-200 bg-green-50/40 p-6">
        <h2 className="mb-2 text-lg font-semibold text-slate-800">Compte rendu de mission</h2>
        <p className="mb-4 text-xs text-slate-500">
          Transmis le {formatDate(preview.clientReportSentAt)}
          {preview.actionsUsed
            ? ` · ${preview.actionsUsed} crédit${preview.actionsUsed > 1 ? "s" : ""} décomptés`
            : ""}
        </p>
        <div className="rounded-lg border border-green-100 bg-white p-4 text-sm whitespace-pre-wrap text-slate-800">
          {preview.clientReport}
        </div>
        {preview.correctionNote ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Point de vigilance</p>
            <p className="mt-1 whitespace-pre-wrap">{preview.correctionNote}</p>
          </div>
        ) : null}
        {(visibleDocs?.length ?? 0) > 0 || (visibleChantier?.length ?? 0) > 0 ? (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-700">Pièces jointes</h3>
            <ul className="mt-2 space-y-2">
              {visibleDocs?.map((d) => (
                <li key={d.id}>
                  <a
                    href={documentDownloadHref(d.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {d.name}
                  </a>
                </li>
              ))}
              {visibleChantier?.map((f) => (
                <li key={f.id}>
                  <a
                    href={`/api/chantier/files/${f.id}/preview?download=original`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {f.name} <span className="text-slate-500">({f.folderLabel})</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <DecisionStatusBlock
          decision={
            preview.clientDecision && preview.clientDecision !== "EN_ATTENTE_CLIENT"
              ? preview.clientDecision
              : null
          }
          at={preview.clientDecisionAt}
          note={preview.clientDecisionNote}
        />

        {validationEnabled &&
        (!preview.clientDecision || preview.clientDecision === "EN_ATTENTE_CLIENT") ? (
          <div
            id="validation-client"
            className="mt-5 scroll-mt-6 rounded-xl border border-bework-navy/20 bg-white p-4"
          >
            <h3 className="text-base font-semibold text-bework-ink">Valider ce livrable</h3>
            <p className="mt-1 text-sm text-bework-muted">
              Accepter confirme que le travail répond à votre demande. Un refus ou des réserves
              doivent expliquer ce qui bloque — BeWork pourra corriger.
            </p>
            <label className="mt-3 block text-sm font-medium text-slate-700">
              Motif (obligatoire pour réserves ou refus)
              <textarea
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Ex. : manque le plan d’exécution mis à jour, ou la quantité n’est pas claire…"
              />
            </label>
            {error ? (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                {success}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={Boolean(deciding)}
                onClick={() => void handleClientDecision("ACCEPTE")}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {deciding === "ACCEPTE" ? "Enregistrement…" : "Accepter"}
              </button>
              <button
                type="button"
                disabled={Boolean(deciding)}
                onClick={() => void handleClientDecision("RESERVES")}
                className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50"
              >
                {deciding === "RESERVES" ? "Enregistrement…" : "Accepter avec réserves"}
              </button>
              <button
                type="button"
                disabled={Boolean(deciding)}
                onClick={() => void handleClientDecision("REFUSE")}
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-100 disabled:opacity-50"
              >
                {deciding === "REFUSE" ? "Enregistrement…" : "Refuser"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (!isStaff) return null;

  if (loading) {
    return (
      <div className="rounded-xl surface-metallic-light p-6 text-sm text-slate-500">
        Chargement de la transmission…
      </div>
    );
  }

  if (alreadySent && preview?.clientReport) {
    return (
      <div id="compte-rendu" className="scroll-mt-6 rounded-xl border border-green-200 bg-green-50/40 p-6">
        <h2 className="mb-2 text-lg font-semibold text-slate-800">Transmission client effectuée</h2>
        <p className="mb-3 text-xs text-slate-500">Envoyé le {formatDate(preview.clientReportSentAt)}</p>
        <ClientCreditsBadge clientId={clientId} className="mb-4" />
        <div className="rounded-lg border bg-white p-4 text-sm whitespace-pre-wrap">{preview.clientReport}</div>
        <DecisionStatusBlock
          decision={preview.clientDecision}
          at={preview.clientDecisionAt}
          note={preview.clientDecisionNote}
        />
      </div>
    );
  }

  if (!canTransmit && taskStatus !== "COMPLETE" && taskStatus !== "A_VALIDER") {
    return null;
  }

  return (
    <div id="compte-rendu" className="scroll-mt-6 rounded-xl border border-[color:var(--primary-100)] bg-[color:var(--primary-50)]/30 p-6">
      <h2 className="mb-2 text-lg font-semibold text-slate-800">Transmission au client</h2>
      <p className="mb-4 text-sm text-slate-600">
        Ajustez les crédits à décompter, rédigez le compte rendu et choisissez les pièces visibles par{" "}
        {clientName ?? "le client"}. Les notes internes et corrections non cochées restent côté équipe.
      </p>

      <ClientCreditsBadge clientId={clientId} className="mb-5" />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Crédits à décompter pour cette mission
          </label>
          <input
            type="number"
            min={1}
            value={actionsUsed}
            onChange={(e) => setActionsUsed(e.target.value)}
            disabled={Boolean(preview?.creditsDeductedAt)}
            className="w-full max-w-[140px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {preview?.timeSpentMinutes != null ? (
            <p className="mt-1 text-xs text-slate-500">
              Temps agent : {preview.timeSpentMinutes} min (référence)
            </p>
          ) : null}
          {preview?.creditsDeductedAt ? (
            <p className="mt-1 text-xs text-green-700">
              Crédits déjà décomptés le {formatDate(preview.creditsDeductedAt)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">Compte rendu visible client</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Résumé du travail, livrables, points d'attention…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      {(preview?.documents?.length ?? 0) > 0 && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-slate-800">Pièces de la mission — visibles client</p>
          <ul className="space-y-2">
            {preview!.documents.map((d) => (
              <li key={d.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`doc-${d.id}`}
                  checked={visibleDocIds.has(d.id)}
                  onChange={(e) => setVisibleDocIds(toggleId(visibleDocIds, d.id, e.target.checked))}
                  className="rounded border-slate-300"
                />
                <label htmlFor={`doc-${d.id}`} className="text-sm text-slate-700">
                  {d.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(preview?.chantierFiles?.length ?? 0) > 0 && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-slate-800">Documents classeur chantier — visibles client</p>
          <ul className="space-y-2">
            {preview!.chantierFiles.map((f) => (
              <li key={f.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`cf-${f.id}`}
                  checked={visibleChantierIds.has(f.id)}
                  onChange={(e) =>
                    setVisibleChantierIds(toggleId(visibleChantierIds, f.id, e.target.checked))
                  }
                  className="rounded border-slate-300"
                />
                <label htmlFor={`cf-${f.id}`} className="text-sm text-slate-700">
                  {f.name} <span className="text-slate-400">({f.folderLabel})</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {preview?.correctionNote ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={showCorrectionNote}
              onChange={(e) => setShowCorrectionNote(e.target.checked)}
              className="mt-1 rounded border-slate-300"
            />
            <span className="text-sm text-amber-900">
              <span className="font-medium">Afficher la note de correction au client</span>
              <span className="mt-1 block text-xs font-normal text-amber-800">
                Par défaut masquée (usage interne). Cochez uniquement si le client doit la voir.
              </span>
            </span>
          </label>
          {!showCorrectionNote ? (
            <p className="mt-2 text-xs text-slate-600 line-clamp-2">
              Aperçu interne : {preview.correctionNote.slice(0, 120)}
              {preview.correctionNote.length > 120 ? "…" : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      {success ? (
        <p className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {success}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {canValidateOnly ? (
          <button
            type="button"
            onClick={() => void handleValidateOnly()}
            disabled={validating || sending}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {validating ? "Validation…" : "Valider sans transmettre"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void handleTransmit()}
          disabled={sending || validating || !content.trim()}
          className="rounded-lg bg-[color:var(--accent-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--accent-700)] disabled:opacity-50"
        >
          {sending
            ? "Envoi…"
            : taskStatus === "A_VALIDER"
              ? "Valider et transmettre au client"
              : "Transmettre au client"}
        </button>
      </div>
    </div>
  );
}
