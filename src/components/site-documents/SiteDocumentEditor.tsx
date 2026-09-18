"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SiteDocChatGptModal } from "@/components/site-documents/SiteDocChatGptModal";
import {
  emptyPpspsPayload,
  emptySiteReportPayload,
  PPSPS_EQUIPMENT_PRESETS,
  PPSPS_RISK_CATEGORIES,
  type PpspsPayload,
  type SiteReportPayload,
} from "@/lib/site-documents/types";

type Doc = {
  id: string;
  kind: "COMPTE_RENDU" | "PPSPS";
  number: string;
  versionNumber: number;
  status: string;
  title: string;
  visitDate: string | null;
  visitTime: string | null;
  weather: string | null;
  authorName: string | null;
  quickNotes: string | null;
  payloadJson: unknown;
  chatgptImports: Array<{ id: string }>;
};

type Props = {
  projectId: string;
  projectTitle: string;
  canWrite: boolean;
  document: Doc;
};

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function listToLines(list: string[]): string {
  return list.join("\n");
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#1e3a5f]/25";
const areaClass = `${inputClass} min-h-[88px]`;

export function SiteDocumentEditor({
  projectId,
  projectTitle,
  canWrite,
  document: initial,
}: Props) {
  const router = useRouter();
  const [doc, setDoc] = useState(initial);
  const [title, setTitle] = useState(initial.title);
  const [status, setStatus] = useState(initial.status);
  const [quickNotes, setQuickNotes] = useState(initial.quickNotes ?? "");
  const [visitDate, setVisitDate] = useState(
    initial.visitDate ? initial.visitDate.slice(0, 10) : "",
  );
  const [visitTime, setVisitTime] = useState(initial.visitTime ?? "");
  const [weather, setWeather] = useState(initial.weather ?? "");
  const [authorName, setAuthorName] = useState(initial.authorName ?? "");
  const [cr, setCr] = useState<SiteReportPayload>(() =>
    initial.kind === "COMPTE_RENDU"
      ? { ...emptySiteReportPayload(), ...(initial.payloadJson as SiteReportPayload) }
      : emptySiteReportPayload(),
  );
  const [ppsps, setPpsps] = useState<PpspsPayload>(() =>
    initial.kind === "PPSPS"
      ? { ...emptyPpspsPayload(), ...(initial.payloadJson as PpspsPayload) }
      : emptyPpspsPayload(),
  );
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatgptMode, setChatgptMode] = useState<"prepare" | "import" | null>(null);
  const [canUndo, setCanUndo] = useState(initial.chatgptImports.length > 0);

  const hubHref = `/dashboard/projets/${projectId}/documents-chantier`;
  const apiBase = `/api/projets/${projectId}/site-documents/${doc.id}`;

  const payload = useMemo(
    () => (doc.kind === "COMPTE_RENDU" ? cr : ppsps),
    [doc.kind, cr, ppsps],
  );

  async function save() {
    if (!canWrite) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(apiBase, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          status,
          visitDate: visitDate || null,
          visitTime: visitTime || null,
          weather: weather || null,
          authorName: authorName || null,
          quickNotes: quickNotes || null,
          payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      setDoc((d) => ({ ...d, ...data.document, chatgptImports: d.chatgptImports }));
      setToast("Enregistré");
      window.setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function duplicate() {
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Duplication impossible");
      router.push(`${hubHref}/${data.document.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Supprimer définitivement ce document ?")) return;
    setBusy(true);
    try {
      const res = await fetch(apiBase, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Suppression impossible");
      router.push(hubHref);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function undoImport() {
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/chatgpt/undo`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Annulation impossible");
      const refreshed = await fetch(apiBase);
      const body = await refreshed.json();
      if (refreshed.ok && body.document) {
        setDoc(body.document);
        if (body.document.kind === "COMPTE_RENDU") {
          setCr({
            ...emptySiteReportPayload(),
            ...(body.document.payloadJson as SiteReportPayload),
          });
        } else {
          setPpsps({
            ...emptyPpspsPayload(),
            ...(body.document.payloadJson as PpspsPayload),
          });
        }
        setCanUndo(false);
        setToast("Dernier import ChatGPT annulé");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function onImported() {
    void (async () => {
      const refreshed = await fetch(apiBase);
      const body = await refreshed.json();
      if (refreshed.ok && body.document) {
        setDoc(body.document);
        setTitle(body.document.title);
        if (body.document.kind === "COMPTE_RENDU") {
          setCr({
            ...emptySiteReportPayload(),
            ...(body.document.payloadJson as SiteReportPayload),
          });
        } else {
          setPpsps({
            ...emptyPpspsPayload(),
            ...(body.document.payloadJson as PpspsPayload),
          });
        }
        setCanUndo(true);
        setToast("Réponse ChatGPT importée — vérifiez puis enregistrez.");
      }
    })();
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="sticky top-12 z-20 -mx-1 border-b border-slate-200/80 bg-white/95 px-1 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href={hubHref} className="text-xs font-semibold text-[#1d4ed8] hover:underline">
              ← Documents de chantier
            </Link>
            <h1 className="text-xl font-bold text-[#1e3a5f]">
              {doc.number} · {projectTitle}
            </h1>
            <p className="text-xs text-slate-500">
              {doc.kind === "COMPTE_RENDU" ? "Compte rendu" : `PPSPS · v${doc.versionNumber}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canWrite ? (
              <>
                <button
                  type="button"
                  onClick={() => setChatgptMode("prepare")}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-900"
                >
                  ✨ Préparer pour ChatGPT
                </button>
                <button
                  type="button"
                  onClick={() => setChatgptMode("import")}
                  className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-900"
                >
                  ✨ Importer la réponse ChatGPT
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void save()}
                  className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {busy ? "…" : "Enregistrer"}
                </button>
              </>
            ) : null}
            <a
              href={`${apiBase}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              Générer le PDF
            </a>
          </div>
        </div>
      </div>

      {toast ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {toast}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {canWrite && canUndo ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50/80 px-3 py-2">
          <p className="text-xs font-medium text-indigo-950">Dernier import ChatGPT disponible</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void undoImport()}
            className="text-[11px] font-semibold text-[#1e3a5f] underline-offset-2 hover:underline"
          >
            Annuler le dernier import
          </button>
        </div>
      ) : null}

      <section className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4">
        <h2 className="text-sm font-bold text-amber-950">Saisie rapide</h2>
        <p className="mt-0.5 text-xs text-amber-900/80">
          Notes brutes intégrées automatiquement au prompt ChatGPT.
        </p>
        <textarea
          value={quickNotes}
          disabled={!canWrite}
          onChange={(e) => setQuickNotes(e.target.value)}
          rows={4}
          placeholder={
            "Dalle terminée aujourd’hui.\n2 camions évacués.\nLe regard EP est trop haut.\nLe client valide le déplacement du caniveau de 50 cm.\nDemain : décaissement et pose du PVC."
          }
          className={`${areaClass} mt-2`}
        />
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <Field label="Titre">
          <input className={inputClass} value={title} disabled={!canWrite} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Statut">
          <select
            className={inputClass}
            value={status}
            disabled={!canWrite}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="DRAFT">Brouillon</option>
            <option value="FINALIZED">Finalisé</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
        </Field>
        {doc.kind === "COMPTE_RENDU" ? (
          <>
            <Field label="Date">
              <input type="date" className={inputClass} value={visitDate} disabled={!canWrite} onChange={(e) => setVisitDate(e.target.value)} />
            </Field>
            <Field label="Heure">
              <input className={inputClass} value={visitTime} disabled={!canWrite} onChange={(e) => setVisitTime(e.target.value)} placeholder="09:30" />
            </Field>
            <Field label="Météo">
              <input className={inputClass} value={weather} disabled={!canWrite} onChange={(e) => setWeather(e.target.value)} />
            </Field>
            <Field label="Rédacteur">
              <input className={inputClass} value={authorName} disabled={!canWrite} onChange={(e) => setAuthorName(e.target.value)} />
            </Field>
          </>
        ) : null}
      </section>

      {doc.kind === "COMPTE_RENDU" ? (
        <CrForm cr={cr} setCr={setCr} canWrite={canWrite} />
      ) : (
        <PpspsForm ppsps={ppsps} setPpsps={setPpsps} canWrite={canWrite} />
      )}

      {canWrite ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void duplicate()} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
            Dupliquer
          </button>
          <button type="button" onClick={() => void remove()} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
            Supprimer
          </button>
        </div>
      ) : null}

      <SiteDocChatGptModal
        projectId={projectId}
        docId={doc.id}
        kind={doc.kind}
        open={chatgptMode != null}
        mode={chatgptMode ?? "prepare"}
        onClose={() => setChatgptMode(null)}
        onImported={onImported}
      />
    </div>
  );
}

function CrForm({
  cr,
  setCr,
  canWrite,
}: {
  cr: SiteReportPayload;
  setCr: (v: SiteReportPayload) => void;
  canWrite: boolean;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#1e3a5f]">Synthèse & participants</h3>
        <Field label="Synthèse">
          <textarea className={areaClass} disabled={!canWrite} value={cr.summary ?? ""} onChange={(e) => setCr({ ...cr, summary: e.target.value })} />
        </Field>
        <Field label="Participants (une ligne : Nom | Société | Fonction)">
          <textarea
            className={areaClass}
            disabled={!canWrite}
            value={cr.participants.map((p) => [p.name, p.company, p.role].filter(Boolean).join(" | ")).join("\n")}
            onChange={(e) =>
              setCr({
                ...cr,
                participants: linesToList(e.target.value).map((line) => {
                  const [name, company, role] = line.split("|").map((x) => x.trim());
                  return { name: name || line, company: company || null, role: role || null };
                }),
              })
            }
          />
        </Field>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#1e3a5f]">Avancement</h3>
        <Field label="Travaux réalisés (1 ligne = 1 point)">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(cr.workCompleted)} onChange={(e) => setCr({ ...cr, workCompleted: linesToList(e.target.value) })} />
        </Field>
        <Field label="Travaux en cours">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(cr.workInProgress)} onChange={(e) => setCr({ ...cr, workInProgress: linesToList(e.target.value) })} />
        </Field>
        <Field label="% avancement">
          <input
            type="number"
            min={0}
            max={100}
            className={inputClass}
            disabled={!canWrite}
            value={cr.progressPercent ?? ""}
            onChange={(e) =>
              setCr({
                ...cr,
                progressPercent: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </Field>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#1e3a5f]">Observations & décisions</h3>
        <Field label="Observations">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(cr.observations)} onChange={(e) => setCr({ ...cr, observations: linesToList(e.target.value) })} />
        </Field>
        <Field label="Problèmes">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(cr.issues)} onChange={(e) => setCr({ ...cr, issues: linesToList(e.target.value) })} />
        </Field>
        <Field label="Contraintes">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(cr.constraints)} onChange={(e) => setCr({ ...cr, constraints: linesToList(e.target.value) })} />
        </Field>
        <Field label="Retard">
          <input className={inputClass} disabled={!canWrite} value={cr.delayNote ?? ""} onChange={(e) => setCr({ ...cr, delayNote: e.target.value })} />
        </Field>
        <Field label="Décisions">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(cr.decisions)} onChange={(e) => setCr({ ...cr, decisions: linesToList(e.target.value) })} />
        </Field>
        <Field label="Demandes client">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(cr.clientRequests)} onChange={(e) => setCr({ ...cr, clientRequests: linesToList(e.target.value) })} />
        </Field>
        <Field label="Validations client">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(cr.clientValidations)} onChange={(e) => setCr({ ...cr, clientValidations: linesToList(e.target.value) })} />
        </Field>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#1e3a5f]">Sécurité & suite</h3>
        <Field label="Observations sécurité">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(cr.safetyObservations)} onChange={(e) => setCr({ ...cr, safetyObservations: linesToList(e.target.value) })} />
        </Field>
        <Field label="Anomalie">
          <input className={inputClass} disabled={!canWrite} value={cr.safetyAnomaly ?? ""} onChange={(e) => setCr({ ...cr, safetyAnomaly: e.target.value })} />
        </Field>
        <Field label="Mesures correctives">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(cr.correctiveActions)} onChange={(e) => setCr({ ...cr, correctiveActions: linesToList(e.target.value) })} />
        </Field>
        <Field label="Travaux prévus">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(cr.plannedWorks)} onChange={(e) => setCr({ ...cr, plannedWorks: linesToList(e.target.value) })} />
        </Field>
        <Field label="Actions (Action | Responsable | Échéance)">
          <textarea
            className={areaClass}
            disabled={!canWrite}
            value={cr.nextSteps.map((s) => [s.action, s.responsible, s.dueDate].filter(Boolean).join(" | ")).join("\n")}
            onChange={(e) =>
              setCr({
                ...cr,
                nextSteps: linesToList(e.target.value).map((line) => {
                  const [action, responsible, dueDate] = line.split("|").map((x) => x.trim());
                  return { action: action || line, responsible: responsible || null, dueDate: dueDate || null };
                }),
              })
            }
          />
        </Field>
        <Field label="Réserves">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(cr.reservations)} onChange={(e) => setCr({ ...cr, reservations: linesToList(e.target.value) })} />
        </Field>
        <Field label="Prochaine visite">
          <input className={inputClass} disabled={!canWrite} value={cr.nextMeeting ?? ""} onChange={(e) => setCr({ ...cr, nextMeeting: e.target.value })} />
        </Field>
        <Field label="Remarques">
          <textarea className={areaClass} disabled={!canWrite} value={cr.additionalNotes ?? ""} onChange={(e) => setCr({ ...cr, additionalNotes: e.target.value })} />
        </Field>
      </section>
    </div>
  );
}

function PpspsForm({
  ppsps,
  setPpsps,
  canWrite,
}: {
  ppsps: PpspsPayload;
  setPpsps: (v: PpspsPayload) => void;
  canWrite: boolean;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#1e3a5f]">Informations générales</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nom chantier">
            <input className={inputClass} disabled={!canWrite} value={ppsps.project.name ?? ""} onChange={(e) => setPpsps({ ...ppsps, project: { ...ppsps.project, name: e.target.value } })} />
          </Field>
          <Field label="Adresse">
            <input className={inputClass} disabled={!canWrite} value={ppsps.project.address ?? ""} onChange={(e) => setPpsps({ ...ppsps, project: { ...ppsps.project, address: e.target.value } })} />
          </Field>
          <Field label="Entreprise">
            <input className={inputClass} disabled={!canWrite} value={ppsps.company.name ?? ""} onChange={(e) => setPpsps({ ...ppsps, company: { ...ppsps.company, name: e.target.value } })} />
          </Field>
          <Field label="Responsable">
            <input className={inputClass} disabled={!canWrite} value={ppsps.company.responsible ?? ""} onChange={(e) => setPpsps({ ...ppsps, company: { ...ppsps.company, responsible: e.target.value } })} />
          </Field>
          <Field label="Effectif prévu">
            <input className={inputClass} disabled={!canWrite} value={ppsps.project.workforce ?? ""} onChange={(e) => setPpsps({ ...ppsps, project: { ...ppsps.project, workforce: e.target.value } })} />
          </Field>
          <Field label="Dates prévues">
            <input
              className={inputClass}
              disabled={!canWrite}
              placeholder="Début → Fin"
              value={[ppsps.project.plannedStart, ppsps.project.plannedEnd].filter(Boolean).join(" → ")}
              onChange={(e) => {
                const [a, b] = e.target.value.split("→").map((x) => x.trim());
                setPpsps({
                  ...ppsps,
                  project: { ...ppsps.project, plannedStart: a || null, plannedEnd: b || null },
                });
              }}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#1e3a5f]">Travaux & matériel</h3>
        <Field label="Nature des travaux">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(ppsps.workDescription)} onChange={(e) => setPpsps({ ...ppsps, workDescription: linesToList(e.target.value) })} />
        </Field>
        <Field label="Méthodes">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(ppsps.workMethods)} onChange={(e) => setPpsps({ ...ppsps, workMethods: linesToList(e.target.value) })} />
        </Field>
        <Field label="Phases">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(ppsps.workPhases)} onChange={(e) => setPpsps({ ...ppsps, workPhases: linesToList(e.target.value) })} />
        </Field>
        <Field label="Matériel / engins">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(ppsps.equipment)} onChange={(e) => setPpsps({ ...ppsps, equipment: linesToList(e.target.value) })} />
        </Field>
        {canWrite ? (
          <div className="flex flex-wrap gap-1.5">
            {PPSPS_EQUIPMENT_PRESETS.map((eq) => (
              <button
                key={eq}
                type="button"
                onClick={() => {
                  if (!ppsps.equipment.includes(eq)) {
                    setPpsps({ ...ppsps, equipment: [...ppsps.equipment, eq] });
                  }
                }}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
              >
                + {eq}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#1e3a5f]">Risques</h3>
        <p className="text-xs text-slate-500">
          Une ligne : Activité | Danger | Exposés | Prévention | Catégorie. À vérifier avant diffusion.
        </p>
        <textarea
          className={areaClass}
          disabled={!canWrite}
          rows={8}
          value={ppsps.risks
            .map((r) =>
              [r.activity, r.hazard, r.personsExposed, r.prevention, r.category]
                .filter((x) => x != null && String(x).length)
                .join(" | "),
            )
            .join("\n")}
          onChange={(e) =>
            setPpsps({
              ...ppsps,
              risks: linesToList(e.target.value).map((line) => {
                const [activity, hazard, personsExposed, prevention, category] = line
                  .split("|")
                  .map((x) => x.trim());
                return {
                  activity: activity || "",
                  hazard: hazard || "",
                  personsExposed: personsExposed || null,
                  prevention: prevention || "",
                  category: category || null,
                };
              }),
            })
          }
        />
        {canWrite ? (
          <div className="flex flex-wrap gap-1.5">
            {PPSPS_RISK_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() =>
                  setPpsps({
                    ...ppsps,
                    risks: [
                      ...ppsps.risks,
                      {
                        activity: "",
                        hazard: "",
                        prevention: "",
                        category: c,
                      },
                    ],
                  })
                }
                className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-900"
              >
                + {c}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#1e3a5f]">EPI, organisation, secours</h3>
        <Field label="EPI">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(ppsps.ppe)} onChange={(e) => setPpsps({ ...ppsps, ppe: linesToList(e.target.value) })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["access", "Accès"],
              ["circulation", "Circulation"],
              ["storage", "Stockage"],
              ["delivery", "Livraison"],
              ["marking", "Balisage"],
              ["workZone", "Zone de travail"],
              ["sanitation", "Sanitaires"],
              ["waste", "Déchets"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                className={inputClass}
                disabled={!canWrite}
                value={ppsps.siteOrganization[key] ?? ""}
                onChange={(e) =>
                  setPpsps({
                    ...ppsps,
                    siteOrganization: { ...ppsps.siteOrganization, [key]: e.target.value },
                  })
                }
              />
            </Field>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["procedure", "Procédure d’urgence"],
              ["assemblyPoint", "Point de rassemblement"],
              ["firstAid", "Secours"],
              ["kit", "Trousse de secours"],
              ["responsible", "Responsable secours"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                className={inputClass}
                disabled={!canWrite}
                value={ppsps.emergency[key] ?? ""}
                onChange={(e) =>
                  setPpsps({
                    ...ppsps,
                    emergency: { ...ppsps.emergency, [key]: e.target.value },
                  })
                }
              />
            </Field>
          ))}
        </div>
        <Field label="Coactivité">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(ppsps.coactivity)} onChange={(e) => setPpsps({ ...ppsps, coactivity: linesToList(e.target.value) })} />
        </Field>
        <Field label="Remarques">
          <textarea className={areaClass} disabled={!canWrite} value={listToLines(ppsps.additionalNotes)} onChange={(e) => setPpsps({ ...ppsps, additionalNotes: linesToList(e.target.value) })} />
        </Field>
      </section>
    </div>
  );
}
