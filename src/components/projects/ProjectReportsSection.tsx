"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ReportItem = {
  id: string;
  reportType: string;
  periodStart: string;
  periodEnd: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string };
  attachments: { id: string; name: string; fileUrl: string }[];
  comments: {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
  }[];
};

interface ProjectReportsSectionProps {
  projectId: string;
  isAgence: boolean;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  JOURNALIER: "Journalier",
  HEBDOMADAIRE: "Hebdomadaire",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProjectReportsSection({ projectId, isAgence }: ProjectReportsSectionProps) {
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reportType, setReportType] = useState<"JOURNALIER" | "HEBDOMADAIRE">("HEBDOMADAIRE");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<{ name: string; fileUrl: string; fileSize: number; mimeType?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [commentReportId, setCommentReportId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/reports?projectId=${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setReports(data);
        }
      } catch {
        setError("Erreur lors du chargement des rapports.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    setError("");
    const added: { name: string; fileUrl: string; fileSize: number; mimeType?: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.size) continue;

      const fd = new FormData();
      fd.append("file", file);

      try {
        const res = await fetch("/api/reports/upload", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (res.ok) {
          added.push({
            name: data.name ?? file.name,
            fileUrl: data.fileUrl,
            fileSize: data.fileSize ?? file.size,
            mimeType: data.mimeType,
          });
        }
      } catch {
        // skip
      }
    }

    setAttachments((prev) => [...prev, ...added]);
    setUploading(false);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!content.trim()) {
      setError("Le texte du rapport est requis.");
      return;
    }
    if (!periodStart || !periodEnd) {
      setError("Période requise (début et fin).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          reportType,
          periodStart,
          periodEnd,
          content: content.trim(),
          attachments,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'enregistrement.");
        setSubmitting(false);
        return;
      }
      setReports((prev) => [data, ...prev]);
      setShowForm(false);
      setContent("");
      setPeriodStart("");
      setPeriodEnd("");
      setAttachments([]);
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    }
    setSubmitting(false);
  };

  const handleAddComment = async (reportId: string) => {
    if (!commentText.trim()) return;

    try {
      const res = await fetch(`/api/reports/${reportId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      const comment = await res.json();
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? { ...r, comments: [...r.comments, comment] }
              : r
          )
        );
        setCommentReportId(null);
        setCommentText("");
        router.refresh();
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl surface-metallic-light p-6">
        <p className="text-slate-500">Chargement des rapports…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl surface-metallic-light p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-800">Reporting</h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "Annuler" : "Nouveau rapport"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as "JOURNALIER" | "HEBDOMADAIRE")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="JOURNALIER">Journalier</option>
                <option value="HEBDOMADAIRE">Hebdomadaire</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Période début</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Période fin</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contenu</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
              placeholder="Résumé des actions, points importants, difficultés rencontrées..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Pièces jointes</label>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.txt,.csv"
              onChange={handleFileChange}
              disabled={uploading}
              className="text-sm text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700 file:hover:bg-blue-100"
            />
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {attachments.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-slate-700">{a.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="text-red-600 hover:underline"
                    >
                      Retirer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting || uploading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Enregistrement…" : "Enregistrer le rapport"}
          </button>
        </form>
      )}

      {reports.length === 0 && !showForm ? (
        <p className="text-slate-500">Aucun rapport pour le moment. Cliquez sur « Nouveau rapport » pour en créer un.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    {REPORT_TYPE_LABELS[report.reportType] ?? report.reportType}
                  </span>
                  <span className="ml-2 text-sm text-slate-600">
                    {formatDate(report.periodStart)} → {formatDate(report.periodEnd)}
                  </span>
                </div>
                <div className="text-sm text-slate-500">
                  Par {report.author.name} • {formatDateTime(report.createdAt)}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-slate-800">{report.content}</p>

              {report.attachments.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500">Pièces jointes</p>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {report.attachments.map((a) => (
                      <li key={a.id}>
                        <a
                          href={a.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {a.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.comments.length > 0 && (
                <div className="mt-4 border-t border-slate-200 pt-3">
                  <p className="text-xs font-medium text-slate-500">Commentaires</p>
                  <ul className="mt-2 space-y-2">
                    {report.comments.map((c) => (
                      <li key={c.id} className="rounded bg-white px-3 py-2 text-sm">
                        <span className="font-medium text-slate-700">{c.user.name}</span>{" "}
                        <span className="text-slate-500">— {formatDateTime(c.createdAt)}</span>
                        <p className="mt-1 text-slate-800">{c.content}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
                {commentReportId === report.id ? (
                  <>
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Votre commentaire..."
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddComment(report.id);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComment(report.id)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                    >
                      Envoyer
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCommentReportId(null); setCommentText(""); }}
                      className="text-sm text-slate-500 hover:underline"
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCommentReportId(report.id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Ajouter un commentaire
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
