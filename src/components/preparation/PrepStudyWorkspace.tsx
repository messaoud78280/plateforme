"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { PrepStudyView } from "@/lib/preparation/service";
import {
  computeStudy,
  inputParamsOf,
  quantitiesDiffer,
  summarizeBases,
  type EngineNode,
  type EngineResult,
} from "@/lib/preparation/engine/compute";
import {
  DOSSIER_STATUS_LABELS,
  PROVENANCE_LABELS,
  ROLE_LABELS,
  type LineRole,
  type PrepLineDTO,
  type PrepParamDTO,
} from "@/lib/preparation/types";
import { displayUnit, formatQty, parseUserNumber } from "@/lib/preparation/units";
import {
  Chip,
  DemoBanner,
  NatureBadge,
  ProvenanceBadge,
  RoleBadge,
  StatusBadge,
  substituteFormula,
  type LineStatus,
} from "./prep-ui";
import { PrepImportModal, type PrepProjectOption } from "./PrepImportModal";
import { PrepLineTechSheetPanel } from "./PrepLineTechSheetPanel";
import { PrepChatGptPatchModal } from "./PrepChatGptPatchModal";
import {
  studyNeedsC01TextEnrichment,
} from "@/lib/preparation/enrichment/c01-fondations-texts";

type Tab = "metre" | "params" | "hypotheses" | "preparation" | "historique";
type Flash = { tone: "ok" | "error" | "conflict"; text: string } | null;

const TABS: { id: Tab; label: string }[] = [
  { id: "metre", label: "Métré" },
  { id: "params", label: "Paramètres" },
  { id: "hypotheses", label: "Hypothèses & décisions" },
  { id: "preparation", label: "Préparation (phases suivantes)" },
  { id: "historique", label: "Historique" },
];

const PROV_RING: Record<string, string> = {
  RELEVE: "ring-emerald-300",
  RELEVE_A_VERIFIER: "ring-amber-300",
  HYPOTHESE: "ring-violet-300",
  SAISIE_MANUELLE: "ring-sky-400",
};

function lineStatus(line: PrepLineDTO, node: EngineNode | undefined): LineStatus {
  if (node?.error) return "error";
  if (line.role === "indicator") return "indicator";
  if (line.validatedQuantity !== null) {
    return node?.value !== null && node?.value !== undefined && quantitiesDiffer(node.value, line.validatedQuantity)
      ? "revalidate"
      : "validated";
  }
  return "theoretical";
}

export function PrepStudyWorkspace({ initial, projects }: { initial: PrepStudyView; projects: PrepProjectOption[] }) {
  const router = useRouter();
  const [study, setStudy] = useState(initial);
  const [paramEdits, setParamEdits] = useState<Record<string, number>>({});
  const [paramRestores, setParamRestores] = useState<Set<string>>(new Set());
  const [lineEdits, setLineEdits] = useState<Record<string, number>>({});
  const [lineRestores, setLineRestores] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("metre");
  const [groupBy, setGroupBy] = useState<"lot" | "element">("lot");
  const [roleFilter, setRoleFilter] = useState<"all" | LineRole>("all");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sheetCode, setSheetCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [patchOpen, setPatchOpen] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [confirmUndoPatch, setConfirmUndoPatch] = useState(false);

  const params = useMemo<PrepParamDTO[]>(
    () =>
      study.params.map((p) => {
        if (paramRestores.has(p.key)) {
          return { ...p, value: p.originalValue, provenance: p.originalProvenance, modifiedAt: null };
        }
        if (p.key in paramEdits) return { ...p, value: paramEdits[p.key], provenance: "SAISIE_MANUELLE" };
        return p;
      }),
    [study.params, paramEdits, paramRestores],
  );
  const lines = useMemo<PrepLineDTO[]>(
    () =>
      study.lines.map((l) => {
        if (lineRestores.has(l.code)) {
          return { ...l, declaredQuantity: l.originalDeclared, provenance: l.originalProvenance };
        }
        if (l.code in lineEdits) return { ...l, declaredQuantity: lineEdits[l.code], provenance: "SAISIE_MANUELLE" };
        return l;
      }),
    [study.lines, lineEdits, lineRestores],
  );

  const engine = useMemo(() => computeStudy({ params, lines }), [params, lines]);
  const savedEngine = useMemo(() => computeStudy({ params: study.params, lines: study.lines }), [study]);
  const paramByKey = useMemo(() => new Map(params.map((p) => [p.key, p])), [params]);
  const hypoById = useMemo(() => new Map(study.hypotheses.map((h) => [h.id, h])), [study.hypotheses]);

  const dirtyCount =
    Object.keys(paramEdits).length + paramRestores.size + Object.keys(lineEdits).length + lineRestores.size;
  const dirty = dirtyCount > 0;

  const changedCodes = useMemo(() => {
    const out = new Set<string>();
    for (const l of study.lines) {
      const a = engine.nodes.get(l.code)?.value ?? null;
      const b = savedEngine.nodes.get(l.code)?.value ?? null;
      if (a !== b) out.add(l.code);
    }
    return out;
  }, [engine, savedEngine, study.lines]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const savedParam = (key: string) => study.params.find((p) => p.key === key);

  function editParam(key: string, value: number) {
    const saved = savedParam(key);
    setParamRestores((s) => {
      if (!s.has(key)) return s;
      const n = new Set(s);
      n.delete(key);
      return n;
    });
    setParamEdits((prev) => {
      const next = { ...prev };
      if (saved && saved.value === value) delete next[key];
      else next[key] = value;
      return next;
    });
  }

  function restoreParam(key: string) {
    const saved = savedParam(key);
    setParamEdits((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (saved?.modifiedAt) setParamRestores((s) => new Set(s).add(key));
  }

  function editLine(code: string, value: number) {
    const saved = study.lines.find((l) => l.code === code);
    setLineRestores((s) => {
      if (!s.has(code)) return s;
      const n = new Set(s);
      n.delete(code);
      return n;
    });
    setLineEdits((prev) => {
      const next = { ...prev };
      if (saved && saved.declaredQuantity === value) delete next[code];
      else next[code] = value;
      return next;
    });
  }

  function restoreLine(code: string) {
    const saved = study.lines.find((l) => l.code === code);
    setLineEdits((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });
    if (saved?.provenance === "SAISIE_MANUELLE") setLineRestores((s) => new Set(s).add(code));
  }

  function discard() {
    setParamEdits({});
    setParamRestores(new Set());
    setLineEdits({});
    setLineRestores(new Set());
    setFlash(null);
  }

  async function callApi(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  async function save() {
    setBusy(true);
    setFlash(null);
    try {
      const { res, data } = await callApi(`/api/prep-studies/${study.id}`, "PATCH", {
        expectedVersion: study.version,
        params: [
          ...Object.entries(paramEdits).map(([key, value]) => ({ key, value })),
          ...[...paramRestores].map((key) => ({ key, restore: true })),
        ],
        lines: [
          ...Object.entries(lineEdits).map(([code, quantity]) => ({ code, quantity })),
          ...[...lineRestores].map((code) => ({ code, restore: true })),
        ],
      });
      if (res.status === 409) {
        setFlash({ tone: "conflict", text: data?.error ?? "Conflit de version" });
        return;
      }
      if (!res.ok || !data?.study) {
        setFlash({ tone: "error", text: data?.error ?? "Enregistrement impossible" });
        return;
      }
      setStudy(data.study);
      setParamEdits({});
      setParamRestores(new Set());
      setLineEdits({});
      setLineRestores(new Set());
      setFlash({ tone: "ok", text: `Enregistré — ${data.impacted ?? 0} quantité(s) recalculée(s).` });
    } catch {
      setFlash({ tone: "error", text: "Connexion interrompue — modifications non enregistrées" });
    } finally {
      setBusy(false);
    }
  }

  async function setValidation(codes: string[], validated: boolean) {
    if (!codes.length) return;
    setBusy(true);
    setFlash(null);
    try {
      const { res, data } = await callApi(`/api/prep-studies/${study.id}/validate-lines`, "POST", {
        expectedVersion: study.version,
        codes,
        validated,
      });
      if (!res.ok || !data?.study) {
        setFlash({ tone: res.status === 409 ? "conflict" : "error", text: data?.error ?? "Validation impossible" });
        return;
      }
      setStudy(data.study);
      setFlash({
        tone: "ok",
        text: validated ? `${data.count} quantité(s) validée(s).` : `Validation retirée sur ${data.count} ligne(s).`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function undoImport() {
    setBusy(true);
    setConfirmUndo(false);
    try {
      const { res, data } = await callApi(`/api/prep-studies/${study.id}/undo-import`, "POST");
      if (!res.ok) {
        setFlash({ tone: "error", text: data?.error ?? "Annulation impossible" });
        return;
      }
      if (data.action === "archived") {
        router.push(`/dashboard/visites-metres/etudes?projectId=${encodeURIComponent(study.project.id)}`);
        return;
      }
      if (data.study) setStudy(data.study);
      setFlash({ tone: "ok", text: "Import annulé — l'état précédent de l'étude est rétabli." });
    } finally {
      setBusy(false);
    }
  }

  async function undoPatch() {
    setBusy(true);
    setConfirmUndoPatch(false);
    try {
      const { res, data } = await callApi(`/api/prep-studies/${study.id}/chatgpt-patch/undo`, "POST");
      if (!res.ok) {
        setFlash({ tone: "error", text: data?.error ?? "Annulation du patch impossible" });
        return;
      }
      if (data.study) setStudy(data.study);
      setFlash({ tone: "ok", text: "Dernière modification ChatGPT annulée — état antérieur rétabli." });
    } finally {
      setBusy(false);
    }
  }

  async function enrichTexts() {
    setBusy(true);
    setFlash(null);
    try {
      const { res, data } = await callApi(`/api/prep-studies/${study.id}/enrich-texts`, "POST", {
        expectedVersion: study.version,
        source: "c01-fondations",
      });
      if (res.status === 409) {
        setFlash({ tone: "conflict", text: data?.error ?? "Conflit de version" });
        return;
      }
      if (!res.ok || !data?.study) {
        setFlash({ tone: "error", text: data?.error ?? "Enrichissement impossible" });
        return;
      }
      setStudy(data.study);
      setFlash({
        tone: "ok",
        text: `Fiches techniques enrichies — ${data.updated ?? 0} ligne(s) mise(s) à jour, quantités inchangées.`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function saveLineTexts(
    code: string,
    texts: {
      designation: string;
      description: string | null;
      includedServices: string[];
      technicalReferences: NonNullable<PrepLineDTO["technicalReferences"]>;
      executionNotes: string | null;
      qualityControls: string[];
      technicalReservations: string[];
    },
  ) {
    setBusy(true);
    setFlash(null);
    try {
      const { res, data } = await callApi(`/api/prep-studies/${study.id}`, "PATCH", {
        expectedVersion: study.version,
        lines: [{ code, texts }],
      });
      if (res.status === 409) {
        setFlash({ tone: "conflict", text: data?.error ?? "Conflit de version" });
        return;
      }
      if (!res.ok || !data?.study) {
        setFlash({ tone: "error", text: data?.error ?? "Enregistrement de la fiche impossible" });
        return;
      }
      setStudy(data.study);
      setFlash({ tone: "ok", text: `Fiche ${code} enregistrée — quantités inchangées.` });
    } finally {
      setBusy(false);
    }
  }

  const needsEnrichment = studyNeedsC01TextEnrichment(study);
  const sheetLine = sheetCode ? lines.find((l) => l.code === sheetCode) : null;

  function lineCharacteristics(line: PrepLineDTO): { label: string; value: string }[] {
    const keys = line.formula ? inputParamsOf(engine, line.code) : [];
    return keys
      .map((k) => paramByKey.get(k))
      .filter((p): p is PrepParamDTO => !!p && p.value !== null)
      .slice(0, 8)
      .map((p) => ({
        label: p.label,
        value: `${formatQty(p.value)} ${displayUnit(p.unit)}`,
      }));
  }

  const kpis = useMemo(() => {
    let quote = 0, indicator = 0, hypo = 0, verify = 0, revalidate = 0, errors = 0, validated = 0;
    for (const l of lines) {
      const node = engine.nodes.get(l.code);
      const st = lineStatus(l, node);
      if (l.role === "quote") quote++;
      if (l.role === "indicator") indicator++;
      if (st === "error") errors++;
      if (st === "revalidate") revalidate++;
      if (st === "validated") validated++;
      if (node && l.formula) {
        const s = summarizeBases(node.bases);
        if (s.hypotheses.length) hypo++;
        if (s.toVerify.length) verify++;
      }
    }
    return [
      { label: "Quantités devis", value: quote, tone: "text-[#1e3a5f]" },
      { label: "Indicateurs techniques", value: indicator, tone: "text-slate-600" },
      { label: "Dépendent d'hypothèses", value: hypo, tone: "text-violet-700" },
      { label: "Relevés à vérifier", value: verify, tone: "text-amber-700" },
      { label: "Validées", value: validated, tone: "text-emerald-700" },
      { label: "À revalider", value: revalidate, tone: "text-amber-700" },
      { label: "Erreurs", value: errors, tone: "text-red-700" },
    ];
  }, [lines, engine]);

  const groups = useMemo(() => {
    const visible = lines.filter((l) => roleFilter === "all" || l.role === roleFilter);
    const out: { key: string; label: string; lines: PrepLineDTO[] }[] = [];
    const idx = new Map<string, number>();
    const push = (key: string, label: string, line: PrepLineDTO) => {
      if (!idx.has(key)) {
        idx.set(key, out.length);
        out.push({ key, label, lines: [] });
      }
      out[idx.get(key)!].lines.push(line);
    };
    if (groupBy === "lot") {
      const labels = new Map(study.lots.map((l) => [l.code, l.label]));
      study.lots.forEach((l) => {
        idx.set(`lot:${l.code}`, out.length);
        out.push({ key: `lot:${l.code}`, label: `${l.code} — ${l.label}`, lines: [] });
      });
      visible.forEach((l) => push(`lot:${l.lot}`, `${l.lot} — ${labels.get(l.lot) ?? l.lot}`, l));
    } else {
      const elements = new Map(study.elements.map((e) => [e.id, e]));
      study.elements.forEach((e) => {
        idx.set(`el:${e.id}`, out.length);
        out.push({ key: `el:${e.id}`, label: `${e.code} — ${e.label}`, lines: [] });
      });
      visible.forEach((l) => {
        const el = l.elementIds.length === 1 ? elements.get(l.elementIds[0]) : undefined;
        if (el) push(`el:${el.id}`, `${el.code} — ${el.label}`, l);
        else push("el:_multi", "Totaux et ouvrages multiples", l);
      });
    }
    return out.filter((g) => g.lines.length);
  }, [lines, roleFilter, groupBy, study.lots, study.elements]);

  const valueOf = (ref: string) => engine.nodes.get(ref)?.value ?? null;
  const validatableShown = groups
    .flatMap((g) => g.lines)
    .filter((l) => {
      const st = lineStatus(l, engine.nodes.get(l.code));
      return l.role !== "indicator" && (st === "theoretical" || st === "revalidate");
    })
    .map((l) => l.code);

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[12px] text-slate-500">
            <Link href="/dashboard/visites-metres/etudes" className="hover:underline">
              Études de métré
            </Link>
            {" · "}
            <Link
              href={`/dashboard/visites-metres/etudes?projectId=${encodeURIComponent(study.project.id)}`}
              className="hover:underline"
            >
              {study.project.title}
            </Link>
          </p>
          <h1 className="mt-0.5 text-[1.6rem] font-semibold tracking-tight text-[#1e3a5f]">{study.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
            <Chip
              className={
                study.mode === "DEMONSTRATION"
                  ? "bg-amber-50 text-amber-800 ring-amber-200"
                  : "bg-slate-50 text-slate-700 ring-slate-200"
              }
            >
              {DOSSIER_STATUS_LABELS[study.dossierStatus]}
            </Chip>
            {study.trade ? <span>{study.trade}</span> : null}
            <span>Version {study.version}</span>
            {study.sourceFormat && study.sourceFormat !== "bework_prep_bundle_v1" ? (
              <span>Importé depuis l&apos;ancien format</span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {study.lastPatch ? (
            <button
              type="button"
              disabled={busy || dirty || !study.lastPatch.canUndo}
              title={study.lastPatch.undoBlockedReason ?? undefined}
              onClick={() => setConfirmUndoPatch(true)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] text-slate-700 disabled:opacity-50"
            >
              Annuler la dernière modification
            </button>
          ) : null}
          {study.lastImport ? (
            <button
              type="button"
              disabled={busy || dirty || !study.lastImport.canUndo}
              title={study.lastImport.undoBlockedReason ?? undefined}
              onClick={() => setConfirmUndo(true)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] text-slate-700 disabled:opacity-50"
            >
              Annuler le dernier import
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy || dirty}
            onClick={() => setPatchOpen(true)}
            className="rounded-full border border-[#1e3a5f]/20 bg-white px-4 py-2 text-[13px] font-medium text-[#1e3a5f] disabled:opacity-50"
          >
            ✨ Modifier avec ChatGPT
          </button>
          <button
            type="button"
            disabled={busy || dirty}
            onClick={() => setImportOpen(true)}
            className="rounded-full border border-[#1e3a5f]/20 bg-white px-4 py-2 text-[13px] font-medium text-[#1e3a5f] disabled:opacity-50"
          >
            Réimporter un JSON
          </button>
        </div>
      </header>

      {study.mode === "DEMONSTRATION" ? <DemoBanner /> : null}
      {needsEnrichment ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1e3a5f]/15 bg-[#1e3a5f]/[0.04] px-4 py-3">
          <div className="min-w-0 text-[13px] text-slate-700">
            <p className="font-medium text-[#1e3a5f]">Désignations professionnelles disponibles</p>
            <p className="mt-0.5 text-slate-600">
              Enrichit les intitulés et fiches techniques du scénario C-01 sans modifier les quantités, formules ni paramètres.
            </p>
          </div>
          <button
            type="button"
            disabled={busy || dirty}
            onClick={() => void enrichTexts()}
            className="shrink-0 rounded-xl bg-[#1e3a5f] px-3.5 py-2 text-[13px] font-medium text-white disabled:opacity-40"
            title={dirty ? "Enregistrez ou annulez vos modifications de quantités avant" : undefined}
          >
            Enrichir les fiches techniques
          </button>
        </div>
      ) : null}

      {confirmUndo && study.lastImport ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-900">
          <p>
            {study.lastImport.kind === "CREATE"
              ? "Annuler l'import initial archive cette étude (elle disparaît de la liste, rien n'est supprimé)."
              : "Annuler ce réimport rétablit exactement l'état de l'étude avant le remplacement."}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void undoImport()}
              className="rounded-full bg-red-700 px-3 py-1.5 text-[12px] font-medium text-white"
            >
              Confirmer l&apos;annulation
            </button>
            <button type="button" onClick={() => setConfirmUndo(false)} className="rounded-full px-3 py-1.5 text-[12px]">
              Garder l&apos;import
            </button>
          </div>
        </div>
      ) : null}

      {confirmUndoPatch && study.lastPatch ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
          <p>
            Annuler le patch <span className="font-mono">{study.lastPatch.patchId}</span> rétablit l&apos;état
            de l&apos;étude juste avant cette modification ChatGPT.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void undoPatch()}
              className="rounded-full bg-[#1e3a5f] px-3 py-1.5 text-[12px] font-medium text-white"
            >
              Confirmer l&apos;annulation
            </button>
            <button
              type="button"
              onClick={() => setConfirmUndoPatch(false)}
              className="rounded-full px-3 py-1.5 text-[12px]"
            >
              Garder la modification
            </button>
          </div>
        </div>
      ) : null}

      {flash ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 text-[13px]",
            flash.tone === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-900",
            flash.tone === "error" && "border-red-200 bg-red-50 text-red-900",
            flash.tone === "conflict" && "border-amber-300 bg-amber-50 text-amber-900",
          )}
        >
          <span>{flash.text}</span>
          {flash.tone === "conflict" ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full border border-amber-400 bg-white px-3 py-1 text-[12px]"
            >
              Recharger l&apos;étude (vos modifications en cours seront perdues)
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-[#1e3a5f]/10 bg-white px-3 py-2.5">
            <p className={cn("text-[20px] font-semibold tabular-nums", k.tone)}>{k.value}</p>
            <p className="text-[11px] text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[13px]",
              tab === t.id
                ? "border-[#1e3a5f] font-semibold text-[#1e3a5f]"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "metre" ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5">
              {(["lot", "element"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroupBy(g)}
                  className={cn(
                    "rounded-full px-3 py-1",
                    groupBy === g ? "bg-[#1e3a5f] text-white" : "text-slate-600",
                  )}
                >
                  {g === "lot" ? "Par lot" : "Par ouvrage"}
                </button>
              ))}
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "all" | LineRole)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5"
            >
              <option value="all">Toutes les quantités</option>
              {(Object.keys(ROLE_LABELS) as LineRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setCollapsed(new Set())}
              className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100"
            >
              Tout déplier
            </button>
            <button
              type="button"
              onClick={() => setCollapsed(new Set(groups.map((g) => g.key)))}
              className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100"
            >
              Tout replier
            </button>
            <span className="ml-auto" />
            <button
              type="button"
              disabled={busy || dirty || !validatableShown.length}
              title={dirty ? "Enregistrez d'abord vos modifications" : undefined}
              onClick={() => void setValidation(validatableShown, true)}
              className="rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-emerald-800 disabled:opacity-40"
            >
              Valider les quantités affichées ({validatableShown.length})
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#1e3a5f]/10 bg-white">
            <table className="w-full min-w-[1180px] text-[12.5px]">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Lot</th>
                  <th className="px-3 py-2">Réf. ouvrage</th>
                  <th className="px-3 py-2">Désignation</th>
                  <th className="px-3 py-2">Dimensions</th>
                  <th className="px-3 py-2">Formule</th>
                  <th className="px-3 py-2 text-right">Quantité</th>
                  <th className="px-3 py-2">Unité</th>
                  <th className="px-3 py-2">Provenance</th>
                  <th className="px-3 py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => {
                  const isCollapsed = collapsed.has(g.key);
                  return (
                    <Fragment key={g.key}>
                      <tr className="border-t border-slate-200 bg-[#1e3a5f]/[0.04]">
                        <td colSpan={9} className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCollapsed((s) => {
                                const n = new Set(s);
                                if (n.has(g.key)) n.delete(g.key);
                                else n.add(g.key);
                                return n;
                              })
                            }
                            className="flex w-full items-center gap-2 text-left text-[13px] font-semibold text-[#1e3a5f]"
                          >
                            <span className="w-3 text-slate-400">{isCollapsed ? "▸" : "▾"}</span>
                            {g.label}
                            <span className="font-normal text-slate-500">· {g.lines.length} ligne(s)</span>
                          </button>
                        </td>
                      </tr>
                      {isCollapsed
                        ? null
                        : g.lines.map((l) => (
                            <LineRow
                              key={l.code}
                              line={l}
                              engine={engine}
                              savedValue={savedEngine.nodes.get(l.code)?.value ?? null}
                              changed={changedCodes.has(l.code)}
                              paramByKey={paramByKey}
                              valueOf={valueOf}
                              expanded={expanded === l.code}
                              onToggle={() => setExpanded((c) => (c === l.code ? null : l.code))}
                              onOpenSheet={() => setSheetCode(l.code)}
                              onEditParam={editParam}
                              onEditLine={editLine}
                              onRestoreLine={restoreLine}
                              lineDirty={l.code in lineEdits || lineRestores.has(l.code)}
                              hypoById={hypoById}
                              decisions={study.decisions}
                              busy={busy}
                              dirty={dirty}
                              onValidate={(v) => void setValidation([l.code], v)}
                            />
                          ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {groups.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px] text-slate-500">Aucune ligne pour ce filtre.</p>
            ) : null}
          </div>

          {study.checks.length ? <ChecksPanel study={study} engine={engine} /> : null}
        </section>
      ) : null}

      {tab === "params" ? (
        <ParamsPanel
          study={study}
          params={params}
          engine={engine}
          paramEdits={paramEdits}
          paramRestores={paramRestores}
          onEdit={editParam}
          onRestore={restoreParam}
          hypoById={hypoById}
        />
      ) : null}

      {tab === "hypotheses" ? <HypothesesPanel study={study} params={params} engine={engine} lines={lines} /> : null}

      {tab === "preparation" ? <PreparationPanel study={study} /> : null}

      {tab === "historique" ? (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-[#1e3a5f]/10 bg-white">
          {study.events.length === 0 ? <li className="px-4 py-3 text-[13px] text-slate-500">Aucun évènement</li> : null}
          {study.events.map((e) => (
            <li key={e.id} className="flex justify-between gap-3 px-4 py-2.5 text-[13px]">
              <span>{e.summary}</span>
              <span className="text-slate-500">{new Date(e.createdAt).toLocaleString("fr-FR")}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {dirty ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1e3a5f]/15 bg-white/95 px-4 py-3 shadow-[0_-6px_20px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-slate-700">
              <span className="font-semibold text-[#1e3a5f]">{dirtyCount} modification(s) non enregistrée(s)</span>
              {" · "}
              {changedCodes.size} quantité(s) recalculée(s) en direct
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={discard}
                disabled={busy}
                className="rounded-full border border-slate-200 px-4 py-2 text-[13px] text-slate-700"
              >
                Annuler les modifications
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={busy || engine.structural.length > 0}
                className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
              >
                {busy ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {importOpen ? (
        <PrepImportModal
          projects={projects}
          target={{ studyId: study.id, title: study.title, projectId: study.project.id }}
          onClose={() => setImportOpen(false)}
          onImported={() => window.location.reload()}
        />
      ) : null}

      {patchOpen ? (
        <PrepChatGptPatchModal
          studyId={study.id}
          studyTitle={study.title}
          open={patchOpen}
          onClose={() => setPatchOpen(false)}
          onApplied={(next) => {
            setStudy(next);
            setFlash({ tone: "ok", text: "Modifications ChatGPT appliquées — quantités recalculées si nécessaire." });
          }}
        />
      ) : null}

      {sheetLine ? (
        <PrepLineTechSheetPanel
          line={sheetLine}
          quantity={engine.nodes.get(sheetLine.code)?.value ?? null}
          characteristics={lineCharacteristics(sheetLine)}
          busy={busy}
          onClose={() => setSheetCode(null)}
          onSave={async (texts) => {
            await saveLineTexts(sheetLine.code, texts);
          }}
        />
      ) : null}
    </div>
  );
}

function NumberInput({
  value,
  onCommit,
  className,
  label,
}: {
  value: number | null;
  onCommit: (n: number) => void;
  className?: string;
  label: string;
}) {
  const toText = (v: number | null) => (v === null ? "" : String(v).replace(".", ","));
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? toText(value);
  const invalid = text.trim() !== "" && parseUserNumber(text) === null;
  return (
    <input
      aria-label={label}
      title={label}
      inputMode="decimal"
      value={text}
      onFocus={() => setDraft(toText(value))}
      onBlur={() => setDraft(null)}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = parseUserNumber(e.target.value);
        if (n !== null) onCommit(n);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className={cn(
        "w-[4.5rem] rounded-md border bg-white px-1.5 py-0.5 text-right tabular-nums",
        invalid ? "border-red-400 ring-1 ring-red-300" : "border-slate-200",
        className,
      )}
    />
  );
}

function DimChip({
  param,
  onEdit,
  compact,
}: {
  param: PrepParamDTO;
  onEdit: (key: string, v: number) => void;
  compact?: boolean;
}) {
  const label = compact && param.label.length > 22 ? `${param.label.slice(0, 21)}…` : param.label;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-slate-50 px-1.5 py-0.5 ring-1",
        PROV_RING[param.provenance ?? ""] ?? "ring-slate-200",
      )}
      title={`${param.label} (${param.key}) — ${param.provenance ? PROVENANCE_LABELS[param.provenance] : "provenance inconnue"}`}
    >
      <span className="text-[11px] text-slate-600">{label}</span>
      <NumberInput value={param.value} label={param.label} onCommit={(v) => onEdit(param.key, v)} />
      <span className="text-[11px] text-slate-400">{displayUnit(param.unit)}</span>
    </span>
  );
}

function LineRow({
  line,
  engine,
  savedValue,
  changed,
  paramByKey,
  valueOf,
  expanded,
  onToggle,
  onOpenSheet,
  onEditParam,
  onEditLine,
  onRestoreLine,
  lineDirty,
  hypoById,
  decisions,
  busy,
  dirty,
  onValidate,
}: {
  line: PrepLineDTO;
  engine: EngineResult;
  savedValue: number | null;
  changed: boolean;
  paramByKey: Map<string, PrepParamDTO>;
  valueOf: (ref: string) => number | null;
  expanded: boolean;
  onToggle: () => void;
  onOpenSheet: () => void;
  onEditParam: (key: string, v: number) => void;
  onEditLine: (code: string, v: number) => void;
  onRestoreLine: (code: string) => void;
  lineDirty: boolean;
  hypoById: Map<string, { statement: string; toConfirmWith: string | null }>;
  decisions: PrepStudyView["decisions"];
  busy: boolean;
  dirty: boolean;
  onValidate: (validated: boolean) => void;
}) {
  const node = engine.nodes.get(line.code);
  const status = lineStatus(line, node);
  const inputs = line.formula
    ? inputParamsOf(engine, line.code)
        .map((k) => paramByKey.get(k))
        .filter((p): p is PrepParamDTO => !!p)
    : [];
  const summary = node ? summarizeBases(node.bases) : null;
  const value = node?.value ?? null;
  const declaredGap =
    line.formula && value !== null && line.declaredQuantity !== null && quantitiesDiffer(value, line.declaredQuantity);
  const shownInputs = inputs.slice(0, 3);
  const linkedDecisions = decisions.filter((d) => line.dependsOnDecisions.includes(d.id) || d.affects.includes(line.code));

  return (
    <>
      <tr
        className={cn(
          "border-t border-slate-100 align-top",
          summary?.hypotheses.length ? "bg-violet-50/30" : "",
          expanded && "bg-slate-50",
        )}
      >
        <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{line.lot}</td>
        <td className="px-3 py-2">
          <button type="button" onClick={onToggle} className="text-left">
            <span className="font-mono text-[12px] font-semibold text-[#1e3a5f] hover:underline">{line.code}</span>
          </button>
          {line.elementIds.length ? (
            <p className="text-[11px] text-slate-400">{line.elementIds.join(", ")}</p>
          ) : null}
        </td>
        <td className="max-w-[18rem] px-3 py-2">
          <p className="text-slate-900">{line.designation}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <RoleBadge role={line.role} />
            <NatureBadge nature={line.nature} />
            {linkedDecisions.length ? (
              <Chip className="bg-orange-50 text-orange-800 ring-orange-200">
                {linkedDecisions.length} décision(s) ouverte(s)
              </Chip>
            ) : null}
            <button
              type="button"
              onClick={onOpenSheet}
              className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[#1e3a5f] underline-offset-2 hover:bg-[#1e3a5f]/5 hover:underline"
            >
              Fiche technique
            </button>
          </div>
        </td>
        <td className="px-3 py-2">
          <div className="flex max-w-[22rem] flex-wrap gap-1">
            {shownInputs.map((p) => (
              <DimChip key={p.key} param={p} onEdit={onEditParam} compact />
            ))}
            {inputs.length > shownInputs.length ? (
              <button type="button" onClick={onToggle} className="rounded-lg px-1.5 py-0.5 text-[11px] text-[#1e3a5f] hover:bg-slate-100">
                +{inputs.length - shownInputs.length} paramètre(s)
              </button>
            ) : null}
            {!line.formula ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                Forfait
                <NumberInput
                  value={line.declaredQuantity}
                  label={`Quantité ${line.code}`}
                  onCommit={(v) => onEditLine(line.code, v)}
                />
                {lineDirty || line.provenance === "SAISIE_MANUELLE" ? (
                  <button type="button" onClick={() => onRestoreLine(line.code)} className="text-[#1e3a5f] hover:underline">
                    rétablir
                  </button>
                ) : null}
              </span>
            ) : null}
          </div>
        </td>
        <td className="max-w-[16rem] px-3 py-2">
          {line.formula ? (
            <p className="line-clamp-2 break-all font-mono text-[11px] text-slate-600" title={line.formula}>
              {line.formula}
            </p>
          ) : (
            <p className="text-[11px] italic text-slate-400">{line.justification ? "Justifiée (voir détail)" : "Saisie directe"}</p>
          )}
        </td>
        <td className={cn("px-3 py-2 text-right tabular-nums", changed && "bg-amber-50")}>
          {node?.error ? (
            <span className="text-[12px] text-red-700">{node.error}</span>
          ) : (
            <span className="text-[14px] font-semibold text-slate-900">{formatQty(value)}</span>
          )}
          {changed ? (
            <p className="text-[11px] text-slate-400 line-through">{formatQty(savedValue)}</p>
          ) : null}
          {declaredGap ? <p className="text-[11px] text-amber-700">déclaré {formatQty(line.declaredQuantity)}</p> : null}
        </td>
        <td className="px-3 py-2 text-slate-600">{displayUnit(line.unit)}</td>
        <td className="px-3 py-2">
          {line.formula && summary ? (
            summary.reliable ? (
              <Chip className="bg-emerald-50 text-emerald-800 ring-emerald-200">Calculé sur relevés</Chip>
            ) : (
              <div className="flex flex-wrap gap-1">
                {summary.hypotheses.length ? (
                  <Chip className="bg-violet-50 text-violet-800 ring-violet-200">
                    {summary.hypotheses.length} hypothèse(s)
                  </Chip>
                ) : null}
                {summary.toVerify.length ? (
                  <Chip className="bg-amber-50 text-amber-800 ring-amber-200">{summary.toVerify.length} à vérifier</Chip>
                ) : null}
                {summary.manual.length ? (
                  <Chip className="bg-sky-50 text-sky-800 ring-sky-200">{summary.manual.length} saisie(s)</Chip>
                ) : null}
                {!summary.hypotheses.length && !summary.toVerify.length && !summary.manual.length ? (
                  <ProvenanceBadge provenance="CALCULE" />
                ) : null}
              </div>
            )
          ) : (
            <ProvenanceBadge provenance={line.provenance} />
          )}
        </td>
        <td className="px-3 py-2">
          <StatusBadge status={status} validated={line.validatedQuantity} />
        </td>
      </tr>
      {expanded ? (
        <tr className="border-t border-slate-100 bg-slate-50">
          <td colSpan={9} className="px-4 py-3">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2 text-[12.5px]">
                {line.formula ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Formule</p>
                    <p className="break-all font-mono text-[12px] text-slate-800">{line.formula}</p>
                    <p className="mt-1 break-all font-mono text-[12px] text-slate-500">
                      = {substituteFormula(line.formula, valueOf)}
                    </p>
                    <p className="mt-1 font-mono text-[13px] font-semibold text-[#1e3a5f]">
                      = {node?.error ?? `${formatQty(value, 4)} ${displayUnit(line.unit)}`}
                    </p>
                  </div>
                ) : null}
                {line.justification ? (
                  <p className="text-slate-600">
                    <span className="font-medium text-slate-800">Justification : </span>
                    {line.justification}
                  </p>
                ) : null}
                {line.description ? (
                  <p className="line-clamp-3 text-slate-600">
                    <span className="font-medium text-slate-800">Description : </span>
                    {line.description}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={onOpenSheet}
                  className="rounded-lg bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#1e3a5f] ring-1 ring-[#1e3a5f]/20 hover:bg-[#1e3a5f]/5"
                >
                  Ouvrir la fiche technique
                </button>
                {line.notes ? <p className="text-slate-500">Note : {line.notes}</p> : null}
                {line.formula && line.declaredQuantity !== null ? (
                  <p className="text-slate-500">
                    Valeur déclarée dans le JSON (contrôle uniquement) : {formatQty(line.declaredQuantity)}
                    {declaredGap ? " — écart avec le calcul, à vérifier" : " — cohérente"}
                  </p>
                ) : null}
                {line.role === "indicator" ? (
                  <p className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
                    Indicateur technique : sert au contrôle et à la préparation, jamais une quantité facturable.
                  </p>
                ) : null}
                {linkedDecisions.length ? (
                  <div>
                    <p className="font-medium text-orange-800">Décisions ouvertes liées</p>
                    <ul className="list-disc pl-4 text-slate-600">
                      {linkedDecisions.map((d) => (
                        <li key={d.id}>{d.question}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2 text-[12.5px]">
                {inputs.length ? (
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">Paramètres d&apos;entrée</p>
                    <div className="flex flex-wrap gap-1.5">
                      {inputs.map((p) => (
                        <DimChip key={p.key} param={p} onEdit={onEditParam} />
                      ))}
                    </div>
                  </div>
                ) : null}
                {summary && (summary.hypotheses.length || summary.toVerify.length) ? (
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">Points à confirmer</p>
                    <ul className="space-y-1">
                      {[...summary.hypotheses, ...summary.toVerify].map((k) => {
                        const p = paramByKey.get(k);
                        const h = p?.hypothesisId ? hypoById.get(p.hypothesisId) : undefined;
                        return (
                          <li key={k} className="text-slate-600">
                            <span className="font-medium text-slate-800">{p?.label ?? k}</span>
                            {p ? ` : ${formatQty(p.value, 4)} ${displayUnit(p.unit)}` : ""}
                            {" — "}
                            {p?.provenance ? PROVENANCE_LABELS[p.provenance] : ""}
                            {h ? ` · ${h.statement}${h.toConfirmWith ? ` (à confirmer avec ${h.toConfirmWith})` : ""}` : ""}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
                {line.role !== "indicator" ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {status === "validated" || status === "revalidate" ? (
                      <>
                        <span className="text-slate-500">
                          Validée : {formatQty(line.validatedQuantity)} le{" "}
                          {line.validatedAt ? new Date(line.validatedAt).toLocaleDateString("fr-FR") : "—"}
                        </span>
                        {status === "revalidate" ? (
                          <button
                            type="button"
                            disabled={busy || dirty}
                            onClick={() => onValidate(true)}
                            className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-emerald-800 disabled:opacity-40"
                          >
                            Revalider {formatQty(value)}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={busy || dirty}
                          onClick={() => onValidate(false)}
                          className="rounded-full px-3 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                        >
                          Retirer la validation
                        </button>
                      </>
                    ) : status === "theoretical" ? (
                      <button
                        type="button"
                        disabled={busy || dirty}
                        title={dirty ? "Enregistrez d'abord vos modifications" : undefined}
                        onClick={() => onValidate(true)}
                        className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-emerald-800 disabled:opacity-40"
                      >
                        Valider cette quantité
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function ChecksPanel({ study, engine }: { study: PrepStudyView; engine: EngineResult }) {
  return (
    <div className="rounded-2xl border border-[#1e3a5f]/10 bg-white px-4 py-3">
      <p className="text-[13px] font-semibold text-[#1e3a5f]">Contrôles de cohérence</p>
      <ul className="mt-1 divide-y divide-slate-100 text-[12.5px]">
        {study.checks.map((c) => {
          const v = c.target ? engine.nodes.get(c.target)?.value ?? null : null;
          const ok = v === null ? null : !quantitiesDiffer(v, c.expected);
          return (
            <li key={c.id} className="flex flex-wrap justify-between gap-2 py-1.5">
              <span>{c.label}</span>
              <span className={cn(ok === false ? "text-amber-700" : ok ? "text-emerald-700" : "text-slate-500")}>
                valeur déclarée {formatQty(c.expected)}
                {v !== null
                  ? ` · calcul actuel ${formatQty(v)}${ok === false ? " (écart normal si une dimension a été modifiée)" : ""}`
                  : " · non relié à une ligne"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ParamsPanel({
  study,
  params,
  engine,
  paramEdits,
  paramRestores,
  onEdit,
  onRestore,
  hypoById,
}: {
  study: PrepStudyView;
  params: PrepParamDTO[];
  engine: EngineResult;
  paramEdits: Record<string, number>;
  paramRestores: Set<string>;
  onEdit: (key: string, v: number) => void;
  onRestore: (key: string) => void;
  hypoById: Map<string, { statement: string }>;
}) {
  if (!params.length) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
        Cette étude ne contient aucun paramètre (ancien format) : les quantités ne peuvent pas être recalculées
        automatiquement. Réimportez la version bework_prep_bundle_v1 pour activer le recalcul.
      </div>
    );
  }
  const prefixLabel = new Map(
    study.elements.filter((e) => e.parameterPrefix).map((e) => [e.parameterPrefix as string, `${e.code} — ${e.label}`]),
  );
  const groups = new Map<string, PrepParamDTO[]>();
  for (const p of params) {
    const prefix = p.key.split(".")[0];
    const g = groups.get(prefix) ?? [];
    g.push(p);
    groups.set(prefix, g);
  }
  return (
    <div className="space-y-3">
      {[...groups.entries()].map(([prefix, list]) => (
        <section key={prefix} className="overflow-x-auto rounded-2xl border border-[#1e3a5f]/10 bg-white">
          <p className="border-b border-slate-100 bg-[#1e3a5f]/[0.04] px-4 py-2 text-[13px] font-semibold text-[#1e3a5f]">
            {prefixLabel.get(prefix) ?? prefix}
          </p>
          <table className="w-full min-w-[900px] text-[12.5px]">
            <tbody>
              {list.map((p) => {
                const draft = p.key in paramEdits || paramRestores.has(p.key);
                const node = engine.nodes.get(p.key);
                const modified = p.provenance === "SAISIE_MANUELLE";
                return (
                  <tr key={p.key} className={cn("border-t border-slate-100 align-top", draft && "bg-amber-50/60")}>
                    <td className="px-4 py-2">
                      <p className="text-slate-900">{p.label}</p>
                      <p className="font-mono text-[11px] text-slate-400">{p.key}</p>
                    </td>
                    <td className="px-3 py-2">
                      {p.formula ? (
                        <div>
                          <span className="font-semibold tabular-nums">{formatQty(node?.value ?? null, 4)}</span>
                          <p className="font-mono text-[11px] text-slate-400">= {p.formula}</p>
                        </div>
                      ) : (
                        <NumberInput value={p.value} label={p.label} onCommit={(v) => onEdit(p.key, v)} />
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{displayUnit(p.unit)}</td>
                    <td className="px-3 py-2">
                      <ProvenanceBadge provenance={p.formula ? "CALCULE" : p.provenance} />
                      {modified && p.originalValue !== null ? (
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          valeur d&apos;origine {formatQty(p.originalValue, 4)}
                          {p.originalProvenance ? ` (${PROVENANCE_LABELS[p.originalProvenance]})` : ""}
                        </p>
                      ) : null}
                    </td>
                    <td className="max-w-[20rem] px-3 py-2 text-[11.5px] text-slate-500">
                      {p.sourceRef ? <span className="font-medium">{p.sourceRef}</span> : null}
                      {p.evidence?.location ? ` · ${p.evidence.location}` : ""}
                      {p.evidence?.quote ? <p className="italic">« {p.evidence.quote} »</p> : null}
                      {p.hypothesisId && hypoById.get(p.hypothesisId) ? (
                        <p className="text-violet-700">{hypoById.get(p.hypothesisId)!.statement}</p>
                      ) : null}
                      {p.note ? <p>{p.note}</p> : null}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {!p.formula && (modified || draft) ? (
                        <button
                          type="button"
                          onClick={() => onRestore(p.key)}
                          className="rounded-full px-2 py-1 text-[12px] text-[#1e3a5f] hover:bg-slate-100"
                        >
                          Rétablir
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

function HypothesesPanel({
  study,
  params,
  engine,
  lines,
}: {
  study: PrepStudyView;
  params: PrepParamDTO[];
  engine: EngineResult;
  lines: PrepLineDTO[];
}) {
  const impacted = (hypothesisId: string) => {
    const keys = new Set(params.filter((p) => p.hypothesisId === hypothesisId).map((p) => p.key));
    return lines.filter((l) => {
      const node = engine.nodes.get(l.code);
      return node ? [...node.bases.keys()].some((k) => keys.has(k)) : false;
    }).length;
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-[#1e3a5f]/10 bg-white px-4 py-3">
        <p className="text-[13px] font-semibold text-[#1e3a5f]">Hypothèses ({study.hypotheses.length})</p>
        {study.hypotheses.length === 0 ? <p className="mt-1 text-[12.5px] text-slate-500">Aucune hypothèse déclarée.</p> : null}
        <ul className="mt-2 space-y-2 text-[12.5px]">
          {study.hypotheses.map((h) => (
            <li key={h.id} className="rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-2">
              <p className="text-slate-900">
                <span className="font-mono text-[11px] text-violet-700">{h.id}</span> {h.statement}
              </p>
              {h.reason ? <p className="text-slate-500">{h.reason}</p> : null}
              <p className="mt-0.5 text-[11.5px] text-slate-500">
                {h.toConfirmWith ? `À confirmer avec : ${h.toConfirmWith} · ` : ""}
                {impacted(h.id)} quantité(s) concernée(s)
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-4">
        <div className="rounded-2xl border border-[#1e3a5f]/10 bg-white px-4 py-3">
          <p className="text-[13px] font-semibold text-[#1e3a5f]">Décisions à prendre ({study.decisions.length})</p>
          <ul className="mt-2 space-y-2 text-[12.5px]">
            {study.decisions.map((d) => (
              <li key={d.id} className="rounded-xl border border-orange-100 bg-orange-50/40 px-3 py-2">
                <p className="text-slate-900">{d.question}</p>
                {d.affects.length ? <p className="text-[11.5px] text-slate-500">Impacte : {d.affects.join(", ")}</p> : null}
                {d.blockingFor.length ? (
                  <p className="text-[11.5px] text-orange-800">Bloquant pour : {d.blockingFor.join(", ")}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[#1e3a5f]/10 bg-white px-4 py-3">
          <p className="text-[13px] font-semibold text-[#1e3a5f]">Documents sources ({study.sources.length})</p>
          <ul className="mt-2 space-y-1 text-[12.5px] text-slate-600">
            {study.sources.map((s) => (
              <li key={s.id}>
                <span className="font-mono text-[11px] text-slate-400">{s.id}</span>{" "}
                {[s.planNumber, s.title ?? s.filename, s.revision ? `ind. ${s.revision}` : null, s.scale]
                  .filter(Boolean)
                  .join(" · ")}
                {s.legibility ? <span className="text-amber-700"> — lisibilité : {s.legibility}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function PreparationPanel({ study }: { study: PrepStudyView }) {
  const items = [
    { label: "Étapes de mode opératoire", value: study.prepared.workflowSteps },
    { label: "Cadences / rendements", value: study.prepared.rates },
    { label: "Tâches de planning", value: study.prepared.scheduleTasks },
    { label: "Variantes", value: study.prepared.variants },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.label} className="rounded-2xl border border-[#1e3a5f]/10 bg-white px-4 py-3">
            <p className="text-[20px] font-semibold text-[#1e3a5f]">{i.value}</p>
            <p className="text-[12px] text-slate-500">{i.label}</p>
          </div>
        ))}
      </div>
      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
        Ces données sont importées et conservées avec l&apos;étude. Le mode opératoire, les ressources, le planning et le
        transfert vers un devis seront exploités dans les phases suivantes, après validation du module Métré.
      </p>
      {study.disclaimers.length ? (
        <ul className="list-disc space-y-0.5 pl-5 text-[12px] text-slate-500">
          {study.disclaimers.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
