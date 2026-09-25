"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { PrepImportPreview } from "@/lib/preparation/service";
import type { PrepIssue } from "@/lib/preparation/types";
import { displayUnit, formatQty } from "@/lib/preparation/units";
import { quantitiesDiffer } from "@/lib/preparation/engine/compute";
import { DemoBanner, IssueList, NatureBadge, ProvenanceBadge, RoleBadge } from "./prep-ui";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

export type PrepProjectOption = { id: string; title: string; siteCity?: string | null };

export function PrepImportModal({
  projects,
  defaultProjectId,
  target,
  onClose,
  onImported,
}: {
  projects: PrepProjectOption[];
  defaultProjectId?: string | null;
  target?: { studyId: string; title: string; projectId: string } | null;
  onClose: () => void;
  onImported: (studyId: string) => void;
}) {
  const [projectOptions, setProjectOptions] = useState(projects);
  const [projectId, setProjectId] = useState(target?.projectId ?? defaultProjectId ?? "");
  const [newProject, setNewProject] = useState<{ title: string; city: string } | null>(null);
  const [raw, setRaw] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<PrepIssue[]>([]);
  const [preview, setPreview] = useState<PrepImportPreview | null>(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const resetPreview = () => {
    setPreview(null);
    setIssues([]);
    setError(null);
    setAllowDuplicate(false);
    setConfirmReplace(false);
  };

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError("Fichier trop volumineux (2 Mo maximum)");
      return;
    }
    resetPreview();
    setFileName(file.name);
    setRaw(await file.text());
  }

  async function createProject() {
    if (!newProject?.title.trim()) return setError("Donnez un nom au projet");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/projets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newProject.title.trim(),
          siteCity: newProject.city.trim() || null,
          chantierStatus: "ETUDE",
          description: "Projet de démonstration — étude de métré non contractuelle.",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.id) {
        setError(data?.error ?? "Création du projet impossible");
        return;
      }
      const created = { id: String(data.id), title: newProject.title.trim(), siteCity: newProject.city.trim() || null };
      setProjectOptions((list) => [created, ...list]);
      setProjectId(created.id);
      setNewProject(null);
    } catch {
      setError("Connexion interrompue — projet non créé");
    } finally {
      setBusy(false);
    }
  }

  async function runPreview() {
    resetPreview();
    if (!projectId) return setError("Sélectionnez un projet");
    if (!raw.trim()) return setError("Collez ou chargez un JSON");
    setBusy(true);
    try {
      const res = await fetch("/api/prep-studies/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, raw, targetStudyId: target?.studyId ?? null }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.ok === true) setPreview(data.preview as PrepImportPreview);
      else if (Array.isArray(data?.issues)) {
        setIssues(data.issues);
        setError(data.error ?? "Le JSON ne peut pas être importé en l'état");
      } else setError(data?.error ?? "Prévisualisation impossible");
    } catch {
      setError("Connexion interrompue — réessayez");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/prep-studies/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          raw,
          targetStudyId: target?.studyId ?? null,
          confirmReplace,
          allowDuplicate,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Enregistrement impossible");
        if (Array.isArray(data?.issues)) setIssues(data.issues);
        return;
      }
      onImported(String(data.studyId));
    } catch {
      setError("Connexion interrompue — rien n'a été enregistré, réessayez");
    } finally {
      setBusy(false);
    }
  }

  const blocking = useMemo(() => {
    if (!preview) return true;
    if (preview.issues.some((i) => i.severity === "error")) return true;
    if (preview.duplicate && !allowDuplicate) return true;
    if (preview.target && !confirmReplace) return true;
    return false;
  }, [preview, allowDuplicate, confirmReplace]);

  const byLot = useMemo(() => {
    if (!preview) return [];
    const labels = new Map(preview.lots.map((l) => [l.code, l.label]));
    const groups = new Map<string, PrepImportPreview["lines"]>();
    for (const l of preview.lines) {
      const g = groups.get(l.lot) ?? [];
      g.push(l);
      groups.set(l.lot, g);
    }
    return [...groups.entries()].map(([code, lines]) => ({ code, label: labels.get(code) ?? code, lines }));
  }, [preview]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8">
      <div className="w-full max-w-5xl rounded-2xl border border-[#1e3a5f]/10 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[17px] font-semibold text-[#1e3a5f]">
              {target ? `Réimporter — ${target.title}` : "Importer une étude de métré"}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              JSON préparé avec ChatGPT (format bework_prep_bundle_v1 ou ancien format fondations). Rien n&apos;est
              enregistré avant votre confirmation.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-2 py-1 text-slate-400 hover:bg-slate-100">
            ✕
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {!preview ? (
            <>
              <label className="block text-[13px] font-medium text-slate-700">
                Projet
                <select
                  value={projectId}
                  disabled={!!target}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    resetPreview();
                  }}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px]"
                >
                  <option value="">— Choisir un projet —</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                      {p.siteCity ? ` — ${p.siteCity}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              {!target ? (
                newProject ? (
                  <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2">
                    <label className="min-w-[14rem] flex-1 text-[12px] text-slate-600">
                      Nom du projet
                      <input
                        value={newProject.title}
                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                        className="mt-0.5 block w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                      />
                    </label>
                    <label className="w-40 text-[12px] text-slate-600">
                      Ville
                      <input
                        value={newProject.city}
                        onChange={(e) => setNewProject({ ...newProject, city: e.target.value })}
                        className="mt-0.5 block w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void createProject()}
                      disabled={busy}
                      className="rounded-full bg-[#1e3a5f] px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
                    >
                      Créer le projet
                    </button>
                    <button type="button" onClick={() => setNewProject(null)} className="px-2 py-1.5 text-[12px] text-slate-500">
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setNewProject({ title: "DÉMO — Fondations C-01", city: "" })}
                    className="text-[12px] font-medium text-[#1e3a5f] hover:underline"
                  >
                    + Créer un projet de démonstration
                  </button>
                )
              ) : null}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-slate-700">JSON</span>
                  <label className="cursor-pointer rounded-full border border-slate-200 px-3 py-1 text-[12px] text-slate-600 hover:bg-slate-50">
                    Charger un fichier .json
                    <input
                      type="file"
                      accept=".json,application/json,text/plain"
                      className="hidden"
                      onChange={(e) => void onFile(e.target.files?.[0])}
                    />
                  </label>
                </div>
                {fileName ? <p className="mt-1 text-[12px] text-slate-500">Fichier : {fileName}</p> : null}
                <textarea
                  value={raw}
                  onChange={(e) => {
                    setRaw(e.target.value);
                    setFileName(null);
                    resetPreview();
                  }}
                  rows={12}
                  spellCheck={false}
                  placeholder='{"format": "bework_prep_bundle_v1", ...}'
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-[12px]"
                />
              </div>
            </>
          ) : (
            <PreviewBody preview={preview} byLot={byLot} />
          )}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</div>
          ) : null}
          <IssueList issues={issues} />

          {preview?.duplicate ? (
            <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
              <input
                type="checkbox"
                checked={allowDuplicate}
                onChange={(e) => setAllowDuplicate(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Ce JSON a déjà été importé dans ce projet (étude « {preview.duplicate.title} », le{" "}
                {new Date(preview.duplicate.importedAt).toLocaleDateString("fr-FR")}). Cochez pour créer malgré tout
                une copie indépendante.
              </span>
            </label>
          ) : null}
          {preview?.target ? (
            <label className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-900">
              <input
                type="checkbox"
                checked={confirmReplace}
                onChange={(e) => setConfirmReplace(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Remplacer le contenu de « {preview.target.title} » : {preview.target.manualParams} paramètre(s) saisi(s)
                manuellement, {preview.target.manualLines} quantité(s) forfaitaire(s) modifiée(s) et{" "}
                {preview.target.validatedLines} validation(s) seront remplacés. Lignes ajoutées :{" "}
                {preview.target.linesAdded.length}, retirées : {preview.target.linesRemoved.length}. L&apos;état actuel
                est conservé et l&apos;import pourra être annulé tant qu&apos;aucune modification n&apos;est enregistrée.
              </span>
            </label>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/80 px-5 py-3">
          {preview ? (
            <button
              type="button"
              onClick={resetPreview}
              disabled={busy}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] text-slate-700"
            >
              Modifier le JSON
            </button>
          ) : null}
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-[13px] text-slate-600">
            Annuler
          </button>
          {!preview ? (
            <button
              type="button"
              onClick={() => void runPreview()}
              disabled={busy}
              className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
            >
              {busy ? "Analyse…" : "Prévisualiser"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void commit()}
              disabled={busy || blocking}
              className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
            >
              {busy ? "Enregistrement…" : target ? "Confirmer le remplacement" : "Enregistrer l'étude"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewBody({
  preview,
  byLot,
}: {
  preview: PrepImportPreview;
  byLot: { code: string; label: string; lines: PrepImportPreview["lines"] }[];
}) {
  const hypoLines = preview.lines.filter((l) => l.hypothesisCount > 0).length;
  const errors = preview.lines.filter((l) => l.error).length;
  const kpis = [
    { label: "Paramètres", value: preview.params.length },
    { label: "Lignes de métré", value: preview.lines.length },
    { label: "Dépendent d'hypothèses", value: hypoLines },
    { label: "Décisions ouvertes", value: preview.decisions.length },
    { label: "Erreurs de calcul", value: errors },
  ];
  return (
    <div className="space-y-4">
      {preview.mode === "DEMONSTRATION" ? <DemoBanner /> : null}
      <div>
        <p className="text-[15px] font-semibold text-slate-900">{preview.study.title}</p>
        <p className="text-[12px] text-slate-500">
          {preview.adapted ? "Ancien format adapté automatiquement" : "Format bework_prep_bundle_v1"}
          {preview.study.trade ? ` · ${preview.study.trade}` : ""}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
            <p className="text-[18px] font-semibold text-[#1e3a5f]">{k.value}</p>
            <p className="text-[11px] text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>
      {preview.adapted && preview.params.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          Ancien format : les quantités sont importées telles quelles, sans paramètres. Le recalcul automatique ne sera
          pas possible sur ces lignes — importez la version bework_prep_bundle_v1 pour bénéficier du recalcul.
        </div>
      ) : null}
      <IssueList issues={preview.issues} />
      <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-100">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Réf.</th>
              <th className="px-3 py-2">Désignation</th>
              <th className="px-3 py-2 text-right">Quantité calculée</th>
              <th className="px-3 py-2">Unité</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Provenance</th>
            </tr>
          </thead>
          <tbody>
            {byLot.map((g) => (
              <PreviewLot key={g.code} group={g} />
            ))}
          </tbody>
        </table>
      </div>
      {preview.checks.length ? (
        <div className="rounded-xl border border-slate-100 px-3 py-2 text-[12px]">
          <p className="font-semibold text-slate-700">Contrôles déclarés</p>
          <ul className="mt-1 space-y-0.5">
            {preview.checks.map((c) => {
              const ok = c.computed === null ? null : !quantitiesDiffer(c.computed, c.expected);
              return (
                <li key={c.id} className="flex justify-between gap-2">
                  <span>{c.label}</span>
                  <span className={cn(ok === false ? "text-amber-700" : ok ? "text-emerald-700" : "text-slate-500")}>
                    attendu {formatQty(c.expected)}
                    {c.computed !== null ? ` · calculé ${formatQty(c.computed)}` : " · non relié à une ligne"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <p className="text-[12px] text-slate-500">
        Préparé pour les phases suivantes : {preview.prepared.workflowSteps} étape(s) de mode opératoire,{" "}
        {preview.prepared.rates} cadence(s), {preview.prepared.scheduleTasks} tâche(s) de planning,{" "}
        {preview.prepared.variants} variante(s) — enregistrés, non exploités à ce stade.
      </p>
    </div>
  );
}

function PreviewLot({ group }: { group: { code: string; label: string; lines: PrepImportPreview["lines"] } }) {
  return (
    <>
      <tr className="bg-[#1e3a5f]/[0.04]">
        <td colSpan={6} className="px-3 py-1.5 text-[12px] font-semibold text-[#1e3a5f]">
          {group.code} — {group.label}
        </td>
      </tr>
      {group.lines.map((l) => {
        const gap =
          l.computed !== null && l.declaredQuantity !== null && l.formula && quantitiesDiffer(l.computed, l.declaredQuantity);
        return (
          <tr key={l.code} className="border-t border-slate-100 align-top">
            <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600">{l.code}</td>
            <td className="px-3 py-1.5">
              <p className="text-slate-800">{l.designation}</p>
              {l.formula ? <p className="font-mono text-[11px] text-slate-400">{l.formula}</p> : null}
            </td>
            <td className="px-3 py-1.5 text-right tabular-nums">
              {l.error ? (
                <span className="text-red-700">{l.error}</span>
              ) : (
                <span className="font-medium text-slate-900">{formatQty(l.computed)}</span>
              )}
              {gap ? (
                <p className="text-[11px] text-amber-700">déclaré {formatQty(l.declaredQuantity)}</p>
              ) : null}
            </td>
            <td className="px-3 py-1.5">{displayUnit(l.unit)}</td>
            <td className="px-3 py-1.5">
              <div className="flex flex-wrap gap-1">
                <RoleBadge role={l.role} />
                <NatureBadge nature={l.nature} />
              </div>
            </td>
            <td className="px-3 py-1.5">
              {l.formula ? (
                l.hypothesisCount || l.toVerifyCount ? (
                  <span className="text-[11px] text-violet-700">
                    {l.hypothesisCount ? `${l.hypothesisCount} hypothèse(s)` : ""}
                    {l.hypothesisCount && l.toVerifyCount ? " · " : ""}
                    {l.toVerifyCount ? `${l.toVerifyCount} à vérifier` : ""}
                  </span>
                ) : (
                  <ProvenanceBadge provenance="CALCULE" />
                )
              ) : (
                <ProvenanceBadge provenance={l.provenance} />
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
}
