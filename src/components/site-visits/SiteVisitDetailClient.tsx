"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  NotebookPen,
  Ruler,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  VisitSectionCard,
  visitFieldClass,
  visitLabelClass,
} from "@/components/site-visits/VisitSectionCard";
import {
  ACCESS_LEVEL_OPTIONS,
  ACCESS_OPTIONS,
  ASBESTOS_STATUS_OPTIONS,
  DIFFICULTY_OPTIONS,
  MEANS_OPTIONS,
  OCCUPATION_OPTIONS,
  SITE_VISIT_LOTS,
  SUPPORT_OBSERVATION_OPTIONS,
  SUPPORT_STATE_OPTIONS,
  VISIT_DETAIL_TABS,
  WASTE_OPTIONS,
  type SiteVisitConstraints,
  type SiteVisitPrep,
  type VisitDetailTabId,
} from "@/lib/site-visits/types";
import { computeMeasurement, formatMeasureDims, MEASURE_UNITS, type MeasureDeduction, type MeasureType } from "@/lib/site-visits/measurements";

type Visit = {
  id: string;
  clientName: string;
  siteName: string | null;
  siteAddress: string;
  contactName: string | null;
  contactPhone: string | null;
  scheduledAt: string | null;
  responsibleName: string | null;
  responsibleId?: string | null;
  subject: string;
  clientNeed: string | null;
  projectId?: string | null;
  projectTitle?: string | null;
  projectHref?: string | null;
  agendaHref?: string | null;
  documentsHref?: string | null;
  lots?: string[];
  zones?: string[];
  prep?: SiteVisitPrep;
  preparedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  completeness?: {
    done: number;
    total: number;
    label: string;
    tone?: "ok" | "watch" | "accent";
    items: Array<{ id: string; label: string; done: boolean; required: boolean }>;
    readyChecks?: Array<{ id: string; label: string; done: boolean }>;
  };
  urgencyNote: string | null;
  timeConstraints: string | null;
  siteOccupied: boolean;
  comments: string | null;
  constraints: SiteVisitConstraints;
  estimatedCrewCount: number | null;
  estimatedDuration: string | null;
  status: string;
  statusLabel: string;
  commercialQuoteNumber: string | null;
  commercialQuoteHref: string | null;
  measurements: Array<{
    id: string;
    zone: string | null;
    label: string;
    measureType: MeasureType;
    lengthM: number | null;
    widthM: number | null;
    heightM: number | null;
    quantityValue: number | null;
    unit: string;
    computedQuantity: number;
    quantityLabel: string;
    observation: string | null;
    lot?: string | null;
    workItemId?: string | null;
    grossQuantity?: number | null;
    multiplier?: number | null;
    coefficient?: number | null;
    wastePercent?: number | null;
    deductions?: MeasureDeduction[];
    modifiedAfterTransmit: boolean;
  }>;
  missingInfos: Array<{
    id: string;
    label: string;
    open: boolean;
    comment?: string | null;
    dueAt?: string | null;
  }>;
  medias: Array<{
    id: string;
    measurementId: string | null;
    zone?: string | null;
    kind: string;
    name: string;
    caption: string | null;
    fileUrl: string | null;
    createdAt?: string | null;
  }>;
  impactPoints?: Array<{ id: string; label: string; severity: "info" | "warn" }>;
  summary?: {
    title: string;
    completenessLabel: string;
    ready: boolean;
    missingOpenCount: number;
    totalsByUnit: { unit: string; total: number; label: string }[];
    totalsByLot?: { lot: string; totals: { unit: string; total: number; label: string }[] }[];
    measurementLines: string[];
    stateLines: string[];
    logisticsLines: string[];
    orgLines: string[];
    docsLines: string[];
    confirmLines: string[];
    impactLabels: string[];
  };
  stats: {
    measurementCount: number;
    photoCount: number;
    documentCount: number;
    missingOpenCount: number;
    totalsByUnit?: string[];
  };
};

const MEASURE_TYPES: { id: MeasureType; label: string }[] = [
  { id: "SURFACE", label: "Surface" },
  { id: "WALL", label: "Mur" },
  { id: "LENGTH", label: "Linéaire" },
  { id: "VOLUME", label: "Volume" },
  { id: "QUANTITY", label: "Unités" },
  { id: "FREE", label: "Libre" },
];

const emptyMeasureForm = {
  zone: "",
  label: "",
  measureType: "SURFACE" as MeasureType,
  lengthM: "",
  widthM: "",
  heightM: "",
  quantityValue: "",
  unit: "",
  observation: "",
  multiplier: "1",
  coefficient: "1",
  wastePercent: "",
  lot: "",
  workItemId: "",
  deductionLabel: "",
  deductionL: "",
  deductionW: "",
};

export function SiteVisitDetailClient({
  initial,
  canCreateQuote,
  initialTab,
}: {
  initial: Visit;
  canCreateQuote: boolean;
  initialTab?: string;
}) {
  const router = useRouter();
  const [visit, setVisit] = useState(initial);
  const [step, setStep] = useState<VisitDetailTabId>(
    VISIT_DETAIL_TABS.some((t) => t.id === initialTab)
      ? (initialTab as VisitDetailTabId)
      : "resume",
  );
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [measureOpen, setMeasureOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [finishOpen, setFinishOpen] = useState(false);
  const [missingLabel, setMissingLabel] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [deductions, setDeductions] = useState<MeasureDeduction[]>([]);
  const [zoneDraft, setZoneDraft] = useState("");
  const [activeZone, setActiveZone] = useState("");
  const [workQuery, setWorkQuery] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaMeasurementId, setMediaMeasurementId] = useState("");
  const [mediaZone, setMediaZone] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [mForm, setMForm] = useState(emptyMeasureForm);
  const [workItems, setWorkItems] = useState<
    Array<{ id: string; name: string; saleUnit: string; family?: string | null; reference?: string | null }>
  >([]);

  const stepIndex = VISIT_DETAIL_TABS.findIndex((s) => s.id === step);
  const preview = computeMeasurement({
    measureType: mForm.measureType,
    lengthM: mForm.lengthM ? Number(mForm.lengthM.replace(",", ".")) : null,
    widthM: mForm.widthM ? Number(mForm.widthM.replace(",", ".")) : null,
    heightM: mForm.heightM ? Number(mForm.heightM.replace(",", ".")) : null,
    quantityValue: mForm.quantityValue
      ? Number(mForm.quantityValue.replace(",", "."))
      : null,
    unit: mForm.unit || null,
    multiplier: mForm.multiplier ? Number(mForm.multiplier.replace(",", ".")) : 1,
    coefficient: mForm.coefficient ? Number(mForm.coefficient.replace(",", ".")) : 1,
    wastePercent: mForm.wastePercent ? Number(mForm.wastePercent.replace(",", ".")) : null,
    deductions,
  });

  useEffect(() => {
    if (!measureOpen) return;
    const q = workQuery.trim();
    const url = q
      ? `/api/commercial/library/work-items?q=${encodeURIComponent(q)}`
      : "/api/commercial/library/work-items";
    const t = window.setTimeout(() => {
      void fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          const items = data.workItems ?? data.items ?? [];
          setWorkItems(
            (
              items as Array<{
                id: string;
                name: string;
                saleUnit?: string;
                family?: string | null;
                reference?: string | null;
              }>
            ).map((w) => ({
              id: w.id,
              name: w.name,
              saleUnit: w.saleUnit ?? "",
              family: w.family ?? null,
              reference: w.reference ?? null,
            })),
          );
        })
        .catch(() => undefined);
    }, q ? 220 : 0);
    return () => window.clearTimeout(t);
  }, [measureOpen, workQuery]);

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
    setSaveState("saving");
    setMessage(null);
    try {
      const res = await fetch(`/api/site-visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec");
      setVisit(json.visit);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1600);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
      setSaveState("idle");
    } finally {
      setBusy(false);
    }
  }

  function patchConstraints(partial: Partial<SiteVisitConstraints>) {
    void patch({ constraints: { ...visit.constraints, ...partial } });
  }

  function toggleList(
    key: "access" | "occupation" | "supportObservations" | "waste" | "means",
    value: string,
  ) {
    const current = visit.constraints[key] ?? [];
    const next = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value];
    patchConstraints({ [key]: next });
  }

  async function saveMeasurement(keepOpen: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/site-visits/${visit.id}/measurements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone: mForm.zone || null,
          label: mForm.label,
          measureType: mForm.measureType,
          lengthM: mForm.lengthM ? Number(mForm.lengthM.replace(",", ".")) : null,
          widthM: mForm.widthM ? Number(mForm.widthM.replace(",", ".")) : null,
          heightM: mForm.heightM ? Number(mForm.heightM.replace(",", ".")) : null,
          quantityValue: mForm.quantityValue
            ? Number(mForm.quantityValue.replace(",", "."))
            : null,
          unit: mForm.unit || null,
          observation: mForm.observation || null,
          multiplier: mForm.multiplier ? Number(mForm.multiplier.replace(",", ".")) : 1,
          coefficient: mForm.coefficient ? Number(mForm.coefficient.replace(",", ".")) : 1,
          wastePercent: mForm.wastePercent
            ? Number(mForm.wastePercent.replace(",", "."))
            : null,
          deductions,
          lot: mForm.lot || null,
          workItemId: mForm.workItemId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec");
      setVisit(json.visit);
      setDeductions([]);
      if (keepOpen) {
        setMForm({
          ...emptyMeasureForm,
          measureType: mForm.measureType,
          zone: mForm.zone,
          lot: mForm.lot,
        });
      } else {
        setMeasureOpen(false);
        setMForm(emptyMeasureForm);
        setAdvanced(false);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMeasurement(id: string) {
    if (!window.confirm("Supprimer ce relevé ?")) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/site-visits/${visit.id}/measurements?measurementId=${id}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec");
      setVisit(json.visit);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function action(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/site-visits/${visit.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec");
      setVisit(json.visit);
      setFinishOpen(false);
      setMissingLabel("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File, kind: "PHOTO" | "DOCUMENT") {
    setBusy(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("kind", kind);
      if (mediaCaption.trim()) fd.set("caption", mediaCaption.trim());
      if (mediaMeasurementId) fd.set("measurementId", mediaMeasurementId);
      if (mediaZone) fd.set("zone", mediaZone);
      const res = await fetch(`/api/site-visits/${visit.id}/media`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec");
      setVisit(json.visit);
      setMediaCaption("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function createQuote() {
    setBusy(true);
    try {
      const res = await fetch(`/api/site-visits/${visit.id}/create-quote`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      if (data.href) window.open(data.href, "_blank", "noopener,noreferrer");
      const refreshed = await fetch(`/api/site-visits/${visit.id}`).then((r) =>
        r.json(),
      );
      if (refreshed.visit) setVisit(refreshed.visit);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const summary = visit.summary;
  const photos = visit.medias.filter((m) => m.kind === "PHOTO");
  const docs = visit.medias.filter((m) => m.kind === "DOCUMENT");
  const missingOpen = visit.missingInfos.filter((i) => i.open);

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 px-3 py-4 pb-44 sm:px-6 lg:pb-32">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/dashboard/visites-metres"
          className="text-sm font-semibold text-[#1e3a5f]"
        >
          ← Visites
        </Link>
        <div className="flex items-center gap-2">
          {saveState === "saving" ? (
            <span className="text-[12px] text-slate-500">Enregistrement…</span>
          ) : saveState === "saved" ? (
            <span className="text-[12px] text-emerald-700">Enregistré</span>
          ) : null}
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            {visit.statusLabel}
          </span>
        </div>
      </div>

      <header className="rounded-2xl border border-bework-navy/10 bg-bework-soft-navy/50 p-4">
        <h1 className="text-[18px] font-semibold tracking-tight text-[#1e3a5f] sm:text-[20px]">
          {visit.siteName || visit.clientName}
        </h1>
        <p className="mt-1 text-[14px] text-slate-600">{visit.siteAddress}</p>
        <p className="mt-1 text-[13px] text-slate-500">
          {visit.clientName}
          {visit.projectTitle ? ` · ${visit.projectTitle}` : ""}
        </p>
        <p className="mt-2 text-[13px] text-slate-600">
          {visit.scheduledAt
            ? new Date(visit.scheduledAt).toLocaleString("fr-FR")
            : "Date à planifier"}
          {visit.responsibleName ? ` · ${visit.responsibleName}` : ""}
        </p>
        {visit.completeness ? (
          <div className="mt-3">
            <p className="text-[13px] font-medium text-slate-600">{visit.completeness.label}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full",
                  visit.completeness.tone === "watch" || visit.status === "INCOMPLETE"
                    ? "bg-bework-watch"
                    : visit.completeness.tone === "accent"
                      ? "bg-bework-accent"
                      : "bg-bework-ok",
                )}
                style={{
                  width: `${Math.round((visit.completeness.done / Math.max(1, visit.completeness.total)) * 100)}%`,
                }}
              />
            </div>
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {visit.agendaHref ? (
            <Link href={visit.agendaHref} className="text-[13px] font-medium text-bework-navy hover:underline">
              Voir dans l’Agenda
            </Link>
          ) : null}
          {visit.projectHref ? (
            <Link href={visit.projectHref} className="text-[13px] font-medium text-bework-navy hover:underline">
              Voir le chantier
            </Link>
          ) : null}
          {visit.documentsHref ? (
            <Link href={visit.documentsHref} className="text-[13px] font-medium text-bework-navy hover:underline">
              Voir dans Documents
            </Link>
          ) : null}
          {visit.commercialQuoteHref ? (
            <Link href={visit.commercialQuoteHref} className="text-[13px] font-medium text-bework-navy hover:underline">
              Voir le devis
            </Link>
          ) : null}
        </div>
      </header>

      <nav
        className="sticky top-14 z-10 -mx-1 overflow-x-auto rounded-xl border border-bework-navy/10 bg-white/95 p-1 backdrop-blur"
        aria-label="Fiche visite"
      >
        <div className="flex gap-0.5">
          {VISIT_DETAIL_TABS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors",
                step === s.id ? "bg-bework-navy text-white" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      <p className="text-[12px] font-medium text-slate-500">
        {VISIT_DETAIL_TABS[stepIndex]?.label}
      </p>

      {message ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{message}</p>
      ) : null}

      {step === "resume" ? (
        <Section title="Informations générales">
          <Field label="Client / prospect">
            <input
              defaultValue={visit.clientName}
              onBlur={(e) => {
                if (e.target.value !== visit.clientName) {
                  void patch({ clientName: e.target.value });
                }
              }}
              className={fieldClass}
            />
          </Field>
          <Field label="Adresse du site">
            <input
              defaultValue={visit.siteAddress}
              onBlur={(e) => {
                if (e.target.value !== visit.siteAddress) {
                  void patch({ siteAddress: e.target.value });
                }
              }}
              className={fieldClass}
            />
          </Field>
          <Field label="Nom du site">
            <input
              defaultValue={visit.siteName ?? ""}
              onBlur={(e) => {
                if (e.target.value !== (visit.siteName ?? "")) {
                  void patch({ siteName: e.target.value || null });
                }
              }}
              className={fieldClass}
            />
          </Field>
          <Field label="Date et heure de visite">
            <input
              type="datetime-local"
              defaultValue={
                visit.scheduledAt
                  ? new Date(visit.scheduledAt).toISOString().slice(0, 16)
                  : ""
              }
              onBlur={(e) => {
                const next = e.target.value ? new Date(e.target.value).toISOString() : null;
                const current = visit.scheduledAt
                  ? new Date(visit.scheduledAt).toISOString().slice(0, 16)
                  : "";
                if (e.target.value !== current) {
                  void patch({ scheduledAt: next });
                }
              }}
              className={fieldClass}
            />
          </Field>
          <Field label="Contact sur place">
            <input
              defaultValue={visit.contactName ?? ""}
              onBlur={(e) => {
                if (e.target.value !== (visit.contactName ?? "")) {
                  void patch({ contactName: e.target.value });
                }
              }}
              className={fieldClass}
            />
          </Field>
          <Field label="Téléphone">
            <input
              type="tel"
              defaultValue={visit.contactPhone ?? ""}
              onBlur={(e) => {
                if (e.target.value !== (visit.contactPhone ?? "")) {
                  void patch({ contactPhone: e.target.value });
                }
              }}
              className={fieldClass}
            />
          </Field>
          <Field label="Objet de la visite">
            <input
              defaultValue={visit.subject}
              onBlur={(e) => {
                if (e.target.value !== visit.subject) {
                  void patch({ subject: e.target.value });
                }
              }}
              className={fieldClass}
            />
          </Field>
          <Field label="Demande du client">
            <textarea
              defaultValue={visit.clientNeed ?? ""}
              onBlur={(e) => {
                if (e.target.value !== (visit.clientNeed ?? "")) {
                  void patch({ clientNeed: e.target.value });
                }
              }}
              rows={4}
              placeholder="Ex. Réfection étanchéité toiture terrasse avec remplacement isolant…"
              className={fieldClass}
            />
          </Field>
          <Field label="Notes terrain">
            <textarea
              defaultValue={visit.comments ?? ""}
              onBlur={(e) => {
                if (e.target.value !== (visit.comments ?? "")) {
                  void patch({ comments: e.target.value });
                }
              }}
              rows={3}
              placeholder="Tout ce qui ne rentre pas ailleurs…"
              className={fieldClass}
            />
          </Field>
          <Field label="Lots concernés">
            <div className="flex flex-wrap gap-2">
              {SITE_VISIT_LOTS.map((l) => {
                const active = (visit.lots ?? []).includes(l);
                return (
                  <Chip
                    key={l}
                    active={active}
                    label={l}
                    onClick={() => {
                      const next = active
                        ? (visit.lots ?? []).filter((x) => x !== l)
                        : [...(visit.lots ?? []), l];
                      void patch({ lots: next });
                    }}
                  />
                );
              })}
            </div>
          </Field>
        </Section>
      ) : null}

      {step === "resume" && visit.prep && (visit.prep.plannedMeasures?.length || visit.prep.zonePlans?.length) ? (
        <Section tone="cyan" icon={Ruler} title="Préparation" hint="Relevés et zones prévus avant la visite.">
          {visit.prep.plannedMeasures && visit.prep.plannedMeasures.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {visit.prep.plannedMeasures.map((m) => (
                <span key={m} className="rounded-full bg-white/80 px-2.5 py-1 text-[12px] font-medium text-slate-700">
                  {m}
                </span>
              ))}
            </div>
          ) : null}
          {visit.prep.zonePlans && visit.prep.zonePlans.length > 0 ? (
            <ul className="space-y-1 text-[13px] text-slate-700">
              {visit.prep.zonePlans.map((z) => (
                <li key={z.name}>
                  <span className="font-semibold text-bework-navy">{z.name}</span>
                  {z.measures.length ? ` · ${z.measures.join(", ")}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </Section>
      ) : null}

      {step === "resume" && summary ? (
        <Section title="Avant-métré">
          {summary.totalsByUnit.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Mesures factuelles
              </p>
              <p className="text-[18px] font-semibold tabular-nums text-bework-navy">
                {summary.totalsByUnit.map((t) => t.label).join(" · ")}
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-slate-500">Aucun relevé pour le moment.</p>
          )}
          {summary.totalsByLot && summary.totalsByLot.length > 0 ? (
            <ul className="mt-3 space-y-1 text-[13px]">
              {summary.totalsByLot.map((g) => (
                <li key={g.lot}>
                  <span className="font-medium text-slate-700">{g.lot}</span>
                  {" · "}
                  <span className="tabular-nums text-bework-navy">
                    {g.totals.map((t) => t.label).join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {(visit.estimatedCrewCount || visit.estimatedDuration) ? (
            <div className="mt-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Estimations opérationnelles
              </p>
              <p className="text-[13px] text-slate-700">
                {[
                  visit.estimatedCrewCount ? `${visit.estimatedCrewCount} personnes` : null,
                  visit.estimatedDuration,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          ) : null}
          {visit.completeness?.readyChecks ? (
            <ul className="mt-4 space-y-1 text-[13px]">
              {visit.completeness.readyChecks.map((c) => (
                <li key={c.id} className={c.done ? "text-emerald-700" : "text-amber-800"}>
                  {c.done ? "✓" : "○"} {c.label}
                </li>
              ))}
            </ul>
          ) : null}
          {canCreateQuote && visit.status === "READY_TO_QUOTE" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void createQuote()}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#1e3a5f] text-[14px] font-semibold text-white"
            >
              Créer le devis
            </button>
          ) : null}
        </Section>
      ) : null}

      {step === "resume" && (visit.status === "TO_PLAN" || visit.status === "SCHEDULED") ? (
        <Section title="À préparer">
          <ul className="space-y-1.5 text-[13px]">
            {[
              { ok: Boolean(visit.clientName.trim()), label: "Coordonnées client" },
              { ok: Boolean(visit.siteAddress.trim()), label: "Adresse" },
              { ok: Boolean(visit.contactName || visit.contactPhone), label: "Contact sur place" },
              { ok: Boolean(visit.subject.trim()), label: "Objectif de visite" },
              { ok: (visit.lots ?? []).length > 0, label: "Lots concernés" },
              { ok: visit.stats.documentCount > 0, label: "Plans / documents" },
            ].map((item) => (
              <li key={item.label} className={item.ok ? "text-emerald-700" : "text-amber-800"}>
                {item.ok ? "✓" : "○"} {item.label}
              </li>
            ))}
          </ul>
          {visit.preparedAt ? (
            <p className="mt-3 text-[13px] font-medium text-emerald-700">✓ Visite préparée</p>
          ) : (
            <button
              type="button"
              onClick={() => void patch({ preparedAt: true })}
              className="mt-3 text-[13px] font-medium text-bework-navy hover:underline"
            >
              Marquer la visite préparée
            </button>
          )}
        </Section>
      ) : null}

      {step === "metres" ? (
        <Section tone="cyan" icon={Ruler} title="Métré" hint="Lot, zone, dimensions et quantité nette.">
          <div className="mb-3 flex flex-wrap gap-2">
            {(visit.zones ?? []).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setActiveZone(activeZone === z ? "" : z)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[12px] font-medium",
                  activeZone === z ? "bg-bework-navy text-white" : "bg-white/80 text-slate-700 ring-1 ring-bework-navy/10",
                )}
              >
                {z}
              </button>
            ))}
          </div>
          <div className="mb-4 flex gap-2">
            <input
              value={zoneDraft}
              onChange={(e) => setZoneDraft(e.target.value)}
              placeholder="Nouvelle zone (RDC, toiture…)"
              className={fieldClass}
            />
            <button
              type="button"
              onClick={() => {
                const z = zoneDraft.trim();
                if (!z) return;
                void patch({ zones: [...(visit.zones ?? []), z] });
                setZoneDraft("");
                setActiveZone(z);
              }}
              className="shrink-0 rounded-xl bg-[#1e3a5f] px-3 text-[13px] font-semibold text-white"
            >
              + Zone
            </button>
          </div>
          {(visit.zones?.length ? visit.zones : ["Sans zone"])
            .filter((zone) => !activeZone || zone === activeZone)
            .map((zone) => {
            const lines = visit.measurements.filter((m) =>
              zone === "Sans zone" ? !m.zone : m.zone === zone,
            );
            const zoneTotal = lines.reduce((acc, m) => {
              acc[m.unit] = (acc[m.unit] ?? 0) + m.computedQuantity;
              return acc;
            }, {} as Record<string, number>);
            return (
              <div key={zone} className="mb-4 border-b border-slate-100 pb-3 last:border-0">
                <p className="text-[14px] font-semibold text-bework-navy">
                  {zone}
                  {lines.length > 0 ? (
                    <span className="ml-2 text-[12px] font-medium text-slate-500">
                      {Object.entries(zoneTotal)
                        .map(([u, q]) => `${q.toFixed(2).replace(/\.?0+$/, "").replace(".", ",")} ${u}`)
                        .join(" · ")}
                    </span>
                  ) : null}
                </p>
                <ul className="mt-2 space-y-2">
                  {lines.map((m) => {
                    const dims = formatMeasureDims(m);
                    const deduction = (m.deductions ?? []).reduce((sum, d) => {
                      const area = (d.lengthM ?? 0) * (d.widthM ?? 0);
                      return sum + (area > 0 ? area : d.lengthM ?? 0) * (d.quantity || 1);
                    }, 0);
                    return (
                    <li key={m.id} className="rounded-xl border border-bework-navy/10 bg-white/80 px-3 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {m.lot ? (
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-bework-intel">
                              {m.lot}
                            </p>
                          ) : null}
                          <p className="text-[12px] text-slate-500">{m.zone || zone}</p>
                          <p className="font-semibold text-slate-900">{m.label}</p>
                          {dims ? (
                            <p className="mt-0.5 font-mono text-[13px] text-slate-600">{dims}</p>
                          ) : null}
                          {deduction > 0 ? (
                            <p className="text-[12px] text-slate-500">
                              Déduction : − {deduction.toFixed(2).replace(".", ",")} {m.unit}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[22px] font-semibold tabular-nums leading-none text-[#1e3a5f]">
                            {m.quantityLabel}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void deleteMeasurement(m.id)}
                          className="text-[12px] font-medium text-slate-400 hover:text-red-600"
                        >
                          Suppr.
                        </button>
                      </div>
                    </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setMeasureOpen(true)}
            className="mt-2 hidden h-12 w-full items-center justify-center rounded-xl bg-[#1e3a5f] text-[15px] font-semibold text-white lg:flex"
          >
            + Ajouter une mesure
          </button>
        </Section>
      ) : null}

      {step === "terrain" ? (
        <Section tone="watch" icon={ShieldAlert} title="État de l’existant">
          <p className="mb-2 text-[12px] text-slate-500">État général</p>
          <div className="flex flex-wrap gap-2">
            {SUPPORT_STATE_OPTIONS.map((o) => (
              <Chip
                key={o}
                active={visit.constraints.supportState === o}
                onClick={() => patchConstraints({ supportState: o })}
                label={o}
              />
            ))}
          </div>
          <p className="mb-2 mt-5 text-[12px] text-slate-500">Observations</p>
          <div className="flex flex-wrap gap-2">
            {SUPPORT_OBSERVATION_OPTIONS.map((o) => (
              <Chip
                key={o}
                active={(visit.constraints.supportObservations ?? []).includes(o)}
                onClick={() => toggleList("supportObservations", o)}
                label={o}
              />
            ))}
          </div>
          <p className="mb-2 mt-5 text-[12px] text-slate-500">
            Amiante / plomb (prudence réglementaire)
          </p>
          <div className="flex flex-col gap-2">
            {ASBESTOS_STATUS_OPTIONS.map((o) => (
              <Chip
                key={o}
                active={visit.constraints.asbestosStatus === o}
                onClick={() => patchConstraints({ asbestosStatus: o })}
                label={o}
                block
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            BeWork n’établit aucun diagnostic réglementaire. Choisissez uniquement
            un état prudent documenté.
          </p>
        </Section>
      ) : null}

      {step === "terrain" ? (
        <>
          <Section title="Accès chantier">
            <div className="flex flex-wrap gap-2">
              {ACCESS_LEVEL_OPTIONS.map((o) => (
                <Chip
                  key={o}
                  active={visit.constraints.accessLevel === o}
                  onClick={() => patchConstraints({ accessLevel: o })}
                  label={o}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {ACCESS_OPTIONS.map((o) => (
                <Chip
                  key={o}
                  active={(visit.constraints.access ?? []).includes(o)}
                  onClick={() => toggleList("access", o)}
                  label={o}
                />
              ))}
            </div>
          </Section>
          <Section title="Occupation du site">
            <div className="flex flex-wrap gap-2">
              {OCCUPATION_OPTIONS.map((o) => (
                <Chip
                  key={o}
                  active={(visit.constraints.occupation ?? []).includes(o)}
                  onClick={() => toggleList("occupation", o)}
                  label={o}
                />
              ))}
            </div>
          </Section>
          <Section title="Déchets / évacuation">
            <div className="flex flex-wrap gap-2">
              {WASTE_OPTIONS.map((o) => (
                <Chip
                  key={o}
                  active={(visit.constraints.waste ?? []).includes(o)}
                  onClick={() => toggleList("waste", o)}
                  label={o}
                />
              ))}
            </div>
          </Section>
          <Section title="Moyens particuliers">
            <div className="flex flex-wrap gap-2">
              {MEANS_OPTIONS.map((o) => (
                <Chip
                  key={o}
                  active={(visit.constraints.means ?? []).includes(o)}
                  onClick={() => toggleList("means", o)}
                  label={o}
                />
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              Ces éléments n’ajoutent aucun prix — à intégrer au chiffrage.
            </p>
          </Section>
          <Section title="À prendre en compte dans le devis">
            <p className="mb-2 text-[12px] text-slate-500">
              Cochez uniquement ce qui doit rester visible au chiffreur.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                ...new Set([
                  ...(visit.constraints.access ?? []),
                  ...(visit.constraints.occupation ?? []),
                  ...(visit.constraints.waste ?? []).filter((w) => w !== "Non concerné"),
                  ...(visit.constraints.means ?? []),
                  ...(visit.constraints.quoteImpact ?? []),
                ]),
              ].map((label) => (
                <Chip
                  key={label}
                  active={(visit.constraints.quoteImpact ?? []).includes(label)}
                  onClick={() => {
                    const current = visit.constraints.quoteImpact ?? [];
                    const next = current.includes(label)
                      ? current.filter((x) => x !== label)
                      : [...current, label];
                    patchConstraints({ quoteImpact: next });
                  }}
                  label={label}
                />
              ))}
            </div>
          </Section>
          <Section title="Organisation">
            <Field label="Équipe estimée (personnes)">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                defaultValue={visit.estimatedCrewCount ?? ""}
                onBlur={(e) => {
                  const n = e.target.value ? Number(e.target.value) : null;
                  if (n !== visit.estimatedCrewCount) {
                    void patch({ estimatedCrewCount: n });
                  }
                }}
                className={fieldClass}
              />
            </Field>
            <Field label="Durée estimée">
              <input
                defaultValue={visit.estimatedDuration ?? ""}
                onBlur={(e) => {
                  if (e.target.value !== (visit.estimatedDuration ?? "")) {
                    void patch({ estimatedDuration: e.target.value });
                  }
                }}
                placeholder="Ex. 3 jours"
                className={fieldClass}
              />
            </Field>
            <p className="mb-2 mt-2 text-[12px] text-slate-500">Difficulté</p>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTY_OPTIONS.map((o) => (
                <Chip
                  key={o}
                  active={visit.constraints.estimatedDifficulty === o}
                  onClick={() => patchConstraints({ estimatedDifficulty: o })}
                  label={o}
                />
              ))}
            </div>
          </Section>
        </>
      ) : null}

      {step === "medias" ? (
        <>
          <Section title="Photos">
            <Field label="Légende / contexte">
              <input
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                placeholder="Ex. Décollement membrane en pied d’acrotère"
                className={fieldClass}
              />
            </Field>
            {(visit.zones ?? []).length > 0 ? (
              <Field label="Zone">
                <select
                  value={mediaZone}
                  onChange={(e) => setMediaZone(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Visite entière</option>
                  {(visit.zones ?? []).map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field label="Lier à un relevé">
              <select
                value={mediaMeasurementId}
                onChange={(e) => setMediaMeasurementId(e.target.value)}
                className={fieldClass}
              >
                <option value="">Photo générale</option>
                {visit.measurements.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.zone ? `${m.zone} — ` : ""}
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f, "PHOTO");
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-[14px] font-semibold text-[#1e3a5f]"
            >
              + Ajouter une photo
            </button>
            <ul className="mt-4 grid grid-cols-2 gap-2">
              {photos.map((p) => (
                <li
                  key={p.id}
                  className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50"
                >
                  {p.fileUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.fileUrl}
                      alt={p.caption || p.name}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-[11px] text-slate-400">
                      Photo
                    </div>
                  )}
                  <p className="truncate px-2 py-1.5 text-[11px] text-slate-600">
                    {p.caption || p.name}
                    {p.zone ? ` · ${p.zone}` : ""}
                    {p.createdAt
                      ? ` · ${new Date(p.createdAt).toLocaleDateString("fr-FR")}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Plans & documents">
            <input
              ref={docRef}
              type="file"
              accept=".pdf,image/*,.dwg,.dxf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f, "DOCUMENT");
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => docRef.current?.click()}
              className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-[14px] font-semibold text-[#1e3a5f]"
            >
              + Ajouter un document
            </button>
            <ul className="mt-3 space-y-2">
              {docs.map((d) => (
                <li
                  key={d.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[13px] text-slate-700"
                >
                  {d.name}
                </li>
              ))}
            </ul>
            {visit.documentsHref ? (
              <Link href={visit.documentsHref} className="mt-3 inline-block text-[13px] font-medium text-bework-navy hover:underline">
                Voir dans Documents
              </Link>
            ) : null}
          </Section>
        </>
      ) : null}

      {step === "missing" ? (
        <Section title="Points à compléter">
            <ul className="space-y-2">
              {visit.missingInfos.map((i) => (
                <li
                  key={i.id}
                  className="rounded-xl border border-slate-100 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-[13px]",
                        i.open ? "text-amber-800" : "text-slate-400 line-through",
                      )}
                    >
                      {i.open ? "⚠ " : "✓ "}
                      {i.label}
                    </span>
                    {i.open ? (
                      <button
                        type="button"
                        onClick={() =>
                          void action({ action: "resolve_missing", missingId: i.id })
                        }
                        className="text-[12px] font-semibold text-[#1e3a5f]"
                      >
                        Obtenu
                      </button>
                    ) : null}
                  </div>
                  {i.comment ? <p className="mt-1 text-[12px] text-slate-500">{i.comment}</p> : null}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <input
                value={missingLabel}
                onChange={(e) => setMissingLabel(e.target.value)}
                placeholder="Ex. Type exact d’isolant"
                className={cn(fieldClass, "flex-1")}
              />
              <button
                type="button"
                disabled={!missingLabel.trim() || busy}
                onClick={() =>
                  void action({ action: "add_missing", label: missingLabel })
                }
                className="shrink-0 rounded-xl bg-[#1e3a5f] px-4 text-[13px] font-semibold text-white disabled:opacity-40"
              >
                +
              </button>
            </div>
        </Section>
      ) : null}

      {step === "historique" ? (
        <Section title="Historique">
          <dl className="space-y-2 text-[13px] text-slate-700">
            {visit.createdAt ? (
              <div>
                <dt className="text-[11px] uppercase text-slate-400">Créée</dt>
                <dd>{new Date(visit.createdAt).toLocaleString("fr-FR")}</dd>
              </div>
            ) : null}
            {visit.updatedAt ? (
              <div>
                <dt className="text-[11px] uppercase text-slate-400">Dernière mise à jour</dt>
                <dd>{new Date(visit.updatedAt).toLocaleString("fr-FR")}</dd>
              </div>
            ) : null}
            {visit.scheduledAt ? (
              <div>
                <dt className="text-[11px] uppercase text-slate-400">Rendez-vous</dt>
                <dd>{new Date(visit.scheduledAt).toLocaleString("fr-FR")}</dd>
              </div>
            ) : null}
            {visit.preparedAt ? (
              <p className="text-emerald-700">✓ Visite préparée</p>
            ) : visit.status === "SCHEDULED" ? (
              <button
                type="button"
                onClick={() => void patch({ preparedAt: true })}
                className="text-[13px] font-medium text-bework-navy hover:underline"
              >
                Marquer la visite préparée
              </button>
            ) : null}
            {visit.commercialQuoteHref ? (
              <Link href={visit.commercialQuoteHref} className="font-medium text-bework-navy hover:underline">
                Issu / lié au devis {visit.commercialQuoteNumber}
              </Link>
            ) : null}
          </dl>
        </Section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setStep("metres");
              setMForm((f) => ({ ...f, zone: activeZone || f.zone }));
              setMeasureOpen(true);
            }}
            className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[#1e3a5f] text-[14px] font-semibold text-white"
          >
            <Ruler className="h-4 w-4" strokeWidth={1.75} />
            + Mesure
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("medias");
              window.setTimeout(() => photoRef.current?.click(), 0);
            }}
            className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[#1e3a5f] text-[14px] font-semibold text-white"
          >
            <Camera className="h-4 w-4" strokeWidth={1.75} />
            + Photo
          </button>
          <button
            type="button"
            onClick={() => {
              setNoteDraft(visit.comments ?? "");
              setNoteOpen(true);
            }}
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700"
          >
            <NotebookPen className="h-4 w-4" strokeWidth={1.75} />
            + Note
          </button>
          <button
            type="button"
            onClick={() => setStep("terrain")}
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700"
          >
            <ShieldAlert className="h-4 w-4" strokeWidth={1.75} />
            + Contrainte
          </button>
          {(visit.zones ?? []).length > 0 ? (
            <select
              value={activeZone}
              onChange={(e) => {
                setActiveZone(e.target.value);
                setMForm({ ...mForm, zone: e.target.value });
                setStep("metres");
              }}
              className="col-span-2 h-11 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700"
            >
              <option value="">Changer de zone</option>
              {(visit.zones ?? []).map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>
      <div className="hidden lg:block">
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg gap-2">
          <button
            type="button"
            disabled={stepIndex <= 0}
            onClick={() => setStep(VISIT_DETAIL_TABS[stepIndex - 1]!.id)}
            className="h-11 flex-1 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 disabled:opacity-30"
          >
            Précédent
          </button>
          {stepIndex < VISIT_DETAIL_TABS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(VISIT_DETAIL_TABS[stepIndex + 1]!.id)}
              className="h-11 flex-1 rounded-xl bg-[#1e3a5f] text-[13px] font-semibold text-white"
            >
              Suivant
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setFinishOpen(true)}
              className="h-11 flex-1 rounded-xl bg-[#1e3a5f] text-[13px] font-semibold text-white"
            >
              Terminer
            </button>
          )}
        </div>
      </div>
      </div>

      {measureOpen ? (
        <Modal title="Ajouter une mesure" onClose={() => setMeasureOpen(false)}>
          <div className="flex flex-wrap gap-2">
            {MEASURE_TYPES.map((t) => (
              <Chip
                key={t.id}
                active={mForm.measureType === t.id}
                onClick={() => setMForm({ ...mForm, measureType: t.id })}
                label={t.label}
              />
            ))}
          </div>
          <Field label="Zone">
            {(visit.zones ?? []).length > 0 ? (
              <select
                value={mForm.zone}
                onChange={(e) => setMForm({ ...mForm, zone: e.target.value })}
                className={fieldClass}
              >
                <option value="">Sans zone</option>
                {(visit.zones ?? []).map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={mForm.zone}
                onChange={(e) => setMForm({ ...mForm, zone: e.target.value })}
                placeholder="Ex. Terrasse principale"
                className={fieldClass}
              />
            )}
          </Field>
          <Field label="Libellé">
            <input
              value={mForm.label}
              onChange={(e) => setMForm({ ...mForm, label: e.target.value })}
              placeholder="Ex. Surface étanchéité"
              className={fieldClass}
            />
          </Field>
          <Field label="Lot">
            <select
              value={mForm.lot}
              onChange={(e) => setMForm({ ...mForm, lot: e.target.value })}
              className={fieldClass}
            >
              <option value="">Sans lot</option>
              {SITE_VISIT_LOTS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          {mForm.measureType === "SURFACE" || mForm.measureType === "VOLUME" ? (
            <>
              <Field label="Longueur (m)">
                <input
                  inputMode="decimal"
                  value={mForm.lengthM}
                  onChange={(e) => setMForm({ ...mForm, lengthM: e.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label="Largeur (m)">
                <input
                  inputMode="decimal"
                  value={mForm.widthM}
                  onChange={(e) => setMForm({ ...mForm, widthM: e.target.value })}
                  className={fieldClass}
                />
              </Field>
            </>
          ) : null}
          {mForm.measureType === "WALL" ? (
            <>
              <Field label="Longueur (m)">
                <input
                  inputMode="decimal"
                  value={mForm.lengthM}
                  onChange={(e) => setMForm({ ...mForm, lengthM: e.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label="Hauteur (m)">
                <input
                  inputMode="decimal"
                  value={mForm.heightM}
                  onChange={(e) => setMForm({ ...mForm, heightM: e.target.value })}
                  className={fieldClass}
                />
              </Field>
            </>
          ) : null}
          {mForm.measureType === "VOLUME" ? (
            <Field label="Hauteur (m)">
              <input
                inputMode="decimal"
                value={mForm.heightM}
                onChange={(e) => setMForm({ ...mForm, heightM: e.target.value })}
                className={fieldClass}
              />
            </Field>
          ) : null}
          {mForm.measureType === "LENGTH" ? (
            <>
              <Field label="Longueur (m)">
                <input
                  inputMode="decimal"
                  value={mForm.lengthM}
                  onChange={(e) => setMForm({ ...mForm, lengthM: e.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label="Quantité (nb)">
                <input
                  inputMode="decimal"
                  value={mForm.quantityValue}
                  onChange={(e) => setMForm({ ...mForm, quantityValue: e.target.value })}
                  placeholder="1"
                  className={fieldClass}
                />
              </Field>
            </>
          ) : null}
          {mForm.measureType === "QUANTITY" || mForm.measureType === "FREE" ? (
            <>
              <Field label="Quantité">
                <input
                  inputMode="decimal"
                  value={mForm.quantityValue}
                  onChange={(e) =>
                    setMForm({ ...mForm, quantityValue: e.target.value })
                  }
                  className={fieldClass}
                />
              </Field>
              <Field label="Unité">
                <select
                  value={mForm.unit}
                  onChange={(e) => setMForm({ ...mForm, unit: e.target.value })}
                  className={fieldClass}
                >
                  <option value="">Choisir</option>
                  {MEASURE_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          ) : null}
          {mForm.measureType === "SURFACE" || mForm.measureType === "WALL" ? (
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <p className="text-[12px] font-medium text-slate-500">Ouvertures / déductions</p>
              {deductions.length > 0 ? (
                <ul className="mt-2 space-y-1 text-[13px] text-slate-700">
                  {deductions.map((d, i) => (
                    <li key={`${d.label ?? "ouv"}-${i}`} className="flex justify-between gap-2">
                      <span>
                        {d.label || "Ouverture"}
                        {d.lengthM && d.widthM
                          ? ` · ${d.lengthM} × ${d.widthM}`
                          : d.lengthM
                            ? ` · ${d.lengthM}`
                            : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeductions(deductions.filter((_, j) => j !== i))}
                        className="text-[12px] text-slate-400"
                      >
                        Retirer
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-2 grid grid-cols-3 gap-2">
                <input
                  value={mForm.deductionLabel}
                  onChange={(e) => setMForm({ ...mForm, deductionLabel: e.target.value })}
                  placeholder="Porte, fenêtre…"
                  className={cn(fieldClass, "col-span-3 mt-0")}
                />
                <input
                  inputMode="decimal"
                  value={mForm.deductionL}
                  onChange={(e) => setMForm({ ...mForm, deductionL: e.target.value })}
                  placeholder="L"
                  className={cn(fieldClass, "mt-0")}
                />
                <input
                  inputMode="decimal"
                  value={mForm.deductionW}
                  onChange={(e) => setMForm({ ...mForm, deductionW: e.target.value })}
                  placeholder="l"
                  className={cn(fieldClass, "mt-0")}
                />
                <button
                  type="button"
                  onClick={() => {
                    const lengthM = mForm.deductionL
                      ? Number(mForm.deductionL.replace(",", "."))
                      : null;
                    const widthM = mForm.deductionW
                      ? Number(mForm.deductionW.replace(",", "."))
                      : null;
                    if (!lengthM && !widthM) return;
                    setDeductions([
                      ...deductions,
                      {
                        label: mForm.deductionLabel.trim() || "Ouverture",
                        lengthM,
                        widthM,
                        quantity: 1,
                      },
                    ]);
                    setMForm({
                      ...mForm,
                      deductionLabel: "",
                      deductionL: "",
                      deductionW: "",
                    });
                  }}
                  className="rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-700"
                >
                  +
                </button>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            className="mt-3 text-[12px] font-medium text-bework-navy"
          >
            {advanced ? "Masquer les options" : "Options avancées"}
          </button>
          {advanced ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Field label="Multiplicateur">
                <input
                  inputMode="decimal"
                  value={mForm.multiplier}
                  onChange={(e) => setMForm({ ...mForm, multiplier: e.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label="Coefficient">
                <input
                  inputMode="decimal"
                  value={mForm.coefficient}
                  onChange={(e) => setMForm({ ...mForm, coefficient: e.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label="Perte %">
                <input
                  inputMode="decimal"
                  value={mForm.wastePercent}
                  onChange={(e) => setMForm({ ...mForm, wastePercent: e.target.value })}
                  className={fieldClass}
                />
              </Field>
            </div>
          ) : null}
          {workItems.length > 0 || workQuery ? (
            <Field label="Associer un ouvrage">
              <input
                value={workQuery}
                onChange={(e) => setWorkQuery(e.target.value)}
                placeholder="🔎 Étanchéité bicouche"
                className={fieldClass}
              />
              <select
                value={mForm.workItemId}
                onChange={(e) => setMForm({ ...mForm, workItemId: e.target.value })}
                className={fieldClass}
              >
                <option value="">Aucun</option>
                {workItems.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                    {w.saleUnit ? ` · ${w.saleUnit}` : ""}
                    {w.family ? ` · ${w.family}` : ""}
                    {w.reference ? ` · ${w.reference}` : ""}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <div className="mt-4 rounded-2xl border border-bework-cyan/20 bg-bework-soft-cyan/50 p-4">
            {(mForm.measureType === "SURFACE" || mForm.measureType === "WALL") &&
            (mForm.lengthM || mForm.widthM || mForm.heightM) ? (
              <p className="font-mono text-[13px] text-slate-600">
                {mForm.measureType === "WALL"
                  ? `${mForm.lengthM || "—"} × ${mForm.heightM || "—"}`
                  : `${mForm.lengthM || "—"} × ${mForm.widthM || "—"}`}
              </p>
            ) : null}
            {preview.deductionTotal > 0 ? (
              <p className="mt-1 text-[13px] text-slate-600">
                Brut {preview.grossQuantity} {preview.unit}
                <span className="mx-1">−</span>
                {preview.deductionTotal} {preview.unit}
              </p>
            ) : null}
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Net</p>
            <p className="text-[28px] font-semibold tabular-nums leading-none text-[#1e3a5f]">
              {preview.computedQuantity} {preview.unit}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              disabled={busy || !mForm.label.trim()}
              onClick={() => void saveMeasurement(false)}
              className="h-12 rounded-xl bg-[#1e3a5f] text-[14px] font-semibold text-white disabled:opacity-40"
            >
              Enregistrer
            </button>
            <button
              type="button"
              disabled={busy || !mForm.label.trim()}
              onClick={() => void saveMeasurement(true)}
              className="h-11 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 disabled:opacity-40"
            >
              + Ajouter une autre mesure
            </button>
          </div>
        </Modal>
      ) : null}

      {noteOpen ? (
        <Modal title="Note de visite" onClose={() => setNoteOpen(false)}>
          <label className={visitLabelClass}>
            Observation terrain
            <textarea
              rows={5}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              className={visitFieldClass}
              placeholder="Ce qui a été vu, à confirmer, à chiffrer…"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void patch({ comments: noteDraft });
              setNoteOpen(false);
            }}
            className="mt-4 h-12 w-full rounded-xl bg-[#1e3a5f] text-[14px] font-semibold text-white"
          >
            Enregistrer la note
          </button>
        </Modal>
      ) : null}

      {finishOpen ? (
        <Modal title="Clôturer la visite" onClose={() => setFinishOpen(false)}>
          {missingOpen.length > 0 ? (
            <p className="text-[14px] text-amber-900">
              {missingOpen.length} information
              {missingOpen.length > 1 ? "s sont" : " est"} encore à confirmer.
            </p>
          ) : (
            <p className="text-[14px] text-slate-700">
              Aucune information manquante ouverte. Le dossier peut être marqué prêt
              à chiffrer.
            </p>
          )}
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void action({ action: "finish", mode: "ready" })}
              className="h-12 rounded-xl bg-[#1e3a5f] text-[14px] font-semibold text-white"
            >
              {missingOpen.length > 0
                ? "Continuer quand même (prêt à chiffrer)"
                : "Marquer prête à chiffrer"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void action({ action: "finish", mode: "incomplete" })}
              className="h-11 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700"
            >
              Conserver comme incomplet
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

const fieldClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-[15px] text-slate-900 outline-none focus:border-[#1e3a5f]/30";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-3 block text-[12px] font-medium text-slate-500">
      {label}
      {children}
    </label>
  );
}

function Section({
  title,
  hint,
  tone = "navy",
  icon: Icon,
  children,
}: {
  title: string;
  hint?: string;
  tone?: "navy" | "accent" | "cyan" | "violet" | "watch" | "ok";
  icon?: typeof Ruler;
  children: React.ReactNode;
}) {
  if (Icon) {
    return (
      <VisitSectionCard tone={tone} icon={Icon} title={title} hint={hint}>
        {children}
      </VisitSectionCard>
    );
  }
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-4">
      <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
      {hint ? <p className="mt-0.5 text-[13px] text-slate-500">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Chip({
  label,
  active,
  onClick,
  block,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  block?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-2 text-[13px] font-medium transition-colors",
        block && "w-full text-left",
        active
          ? "bg-[#1e3a5f] text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200/80",
      )}
    >
      {label}
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-[16px] font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[20px] leading-none text-slate-400"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
