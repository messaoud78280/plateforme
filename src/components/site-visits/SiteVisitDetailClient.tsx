"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  ACCESS_LEVEL_OPTIONS,
  ACCESS_OPTIONS,
  ASBESTOS_STATUS_OPTIONS,
  DIFFICULTY_OPTIONS,
  MEANS_OPTIONS,
  OCCUPATION_OPTIONS,
  SUPPORT_OBSERVATION_OPTIONS,
  SUPPORT_STATE_OPTIONS,
  VISIT_STEPS,
  WASTE_OPTIONS,
  type SiteVisitConstraints,
  type VisitStepId,
} from "@/lib/site-visits/types";
import { computeMeasurement, type MeasureType } from "@/lib/site-visits/measurements";

type Visit = {
  id: string;
  clientName: string;
  siteName: string | null;
  siteAddress: string;
  contactName: string | null;
  contactPhone: string | null;
  scheduledAt: string | null;
  responsibleName: string | null;
  subject: string;
  clientNeed: string | null;
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
    modifiedAfterTransmit: boolean;
  }>;
  missingInfos: Array<{ id: string; label: string; open: boolean }>;
  medias: Array<{
    id: string;
    measurementId: string | null;
    kind: string;
    name: string;
    caption: string | null;
    fileUrl: string | null;
  }>;
  impactPoints?: Array<{ id: string; label: string; severity: "info" | "warn" }>;
  summary?: {
    title: string;
    completenessLabel: string;
    ready: boolean;
    missingOpenCount: number;
    totalsByUnit: { unit: string; total: number; label: string }[];
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
  { id: "LENGTH", label: "Longueur" },
  { id: "VOLUME", label: "Volume" },
  { id: "QUANTITY", label: "Quantité" },
  { id: "FREE", label: "Mesure libre" },
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
};

export function SiteVisitDetailClient({
  initial,
  canCreateQuote,
}: {
  initial: Visit;
  canCreateQuote: boolean;
}) {
  const router = useRouter();
  const [visit, setVisit] = useState(initial);
  const [step, setStep] = useState<VisitStepId>("infos");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [measureOpen, setMeasureOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [missingLabel, setMissingLabel] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaMeasurementId, setMediaMeasurementId] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [mForm, setMForm] = useState(emptyMeasureForm);

  const stepIndex = VISIT_STEPS.findIndex((s) => s.id === step);
  const preview = computeMeasurement({
    measureType: mForm.measureType,
    lengthM: mForm.lengthM ? Number(mForm.lengthM.replace(",", ".")) : null,
    widthM: mForm.widthM ? Number(mForm.widthM.replace(",", ".")) : null,
    heightM: mForm.heightM ? Number(mForm.heightM.replace(",", ".")) : null,
    quantityValue: mForm.quantityValue
      ? Number(mForm.quantityValue.replace(",", "."))
      : null,
    unit: mForm.unit || null,
  });

  const surfaceTotal = useMemo(() => {
    return visit.measurements
      .filter((m) => m.unit === "m²")
      .reduce((s, m) => s + m.computedQuantity, 0);
  }, [visit.measurements]);

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
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
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
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
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec");
      setVisit(json.visit);
      if (keepOpen) {
        setMForm({
          ...emptyMeasureForm,
          measureType: mForm.measureType,
          zone: mForm.zone,
        });
      } else {
        setMeasureOpen(false);
        setMForm(emptyMeasureForm);
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
    <div className="mx-auto max-w-lg space-y-4 px-3 py-4 pb-32 sm:px-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/dashboard/visites-metres"
          className="text-sm font-semibold text-[#1e3a5f]"
        >
          ← Visites
        </Link>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
          {visit.statusLabel}
        </span>
      </div>

      <header className="rounded-2xl border border-slate-200/90 bg-white p-4">
        <h1 className="text-xl font-semibold tracking-tight text-[#1e3a5f]">
          {visit.siteName || visit.clientName}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{visit.siteAddress}</p>
        <p className="mt-2 text-xs text-slate-500">
          {visit.scheduledAt
            ? new Date(visit.scheduledAt).toLocaleString("fr-FR")
            : "Date à planifier"}
          {visit.responsibleName ? ` · ${visit.responsibleName}` : ""}
        </p>
        {summary ? (
          <p
            className={cn(
              "mt-3 text-[13px] font-medium",
              summary.ready ? "text-emerald-700" : "text-amber-800",
            )}
          >
            {summary.completenessLabel}
          </p>
        ) : null}
      </header>

      <nav
        className="sticky top-0 z-10 -mx-1 overflow-x-auto rounded-xl border border-slate-200/80 bg-white/95 p-1 backdrop-blur"
        aria-label="Étapes de la visite"
      >
        <div className="flex gap-0.5">
          {VISIT_STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-2 text-left transition-colors",
                step === s.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <span className="block text-[10px] font-medium opacity-70">
                {i + 1}/6
              </span>
              <span className="block text-[12px] font-semibold leading-tight">
                {s.short}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <p className="text-[12px] font-medium text-slate-500">
        {stepIndex + 1}/6 · {VISIT_STEPS[stepIndex]?.label}
      </p>

      {message ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{message}</p>
      ) : null}

      {step === "infos" ? (
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
        </Section>
      ) : null}

      {step === "metres" ? (
        <Section title="Métrés">
          <ul className="space-y-2">
            {visit.measurements.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {m.zone || m.label}
                    </p>
                    {m.zone ? (
                      <p className="text-[12px] text-slate-500">{m.label}</p>
                    ) : null}
                    <p className="mt-1 text-[15px] font-medium tabular-nums text-[#1e3a5f]">
                      {m.quantityLabel}
                    </p>
                    {m.modifiedAfterTransmit ? (
                      <p className="mt-1 text-[11px] text-amber-700">
                        Relevé modifié après création du devis
                      </p>
                    ) : null}
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
            ))}
          </ul>
          {surfaceTotal > 0 ? (
            <p className="mt-3 text-[13px] font-medium text-slate-700">
              Total surfaces : {surfaceTotal.toFixed(2).replace(/\.?0+$/, "")} m²
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setMeasureOpen(true)}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#1e3a5f] text-[15px] font-semibold text-white"
          >
            + Ajouter une mesure
          </button>
        </Section>
      ) : null}

      {step === "existant" ? (
        <Section title="État de l’existant">
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

      {step === "logistique" ? (
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
            <Field label="Lier à une zone / relevé">
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
          </Section>
          <Section title="Informations à obtenir">
            <ul className="space-y-2">
              {visit.missingInfos.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2.5"
                >
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
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <input
                value={missingLabel}
                onChange={(e) => setMissingLabel(e.target.value)}
                placeholder="Ex. Diagnostic amiante manquant"
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
        </>
      ) : null}

      {step === "synthese" ? (
        <Section title="Synthèse / Prêt à chiffrer">
          {summary ? (
            <div className="space-y-4 text-[14px]">
              <p
                className={cn(
                  "rounded-xl px-3 py-2.5 text-[13px] font-semibold",
                  summary.ready
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-amber-50 text-amber-900",
                )}
              >
                {summary.completenessLabel}
              </p>
              {summary.totalsByUnit.length > 0 ? (
                <Block title="Relevés">
                  {summary.totalsByUnit.map((t) => (
                    <p key={t.unit} className="font-medium text-[#1e3a5f]">
                      {t.label}
                    </p>
                  ))}
                  {summary.measurementLines.map((l) => (
                    <p key={l} className="text-[13px] text-slate-600">
                      {l}
                    </p>
                  ))}
                </Block>
              ) : null}
              {summary.stateLines.length > 0 ? (
                <Block title="État">
                  {summary.stateLines.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </Block>
              ) : null}
              {summary.logisticsLines.length > 0 ? (
                <Block title="Logistique">
                  {summary.logisticsLines.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </Block>
              ) : null}
              {summary.orgLines.length > 0 ? (
                <Block title="Organisation">
                  <p>{summary.orgLines.join(" · ")}</p>
                </Block>
              ) : null}
              {summary.docsLines.length > 0 ? (
                <Block title="Documents">
                  <p>{summary.docsLines.join(" · ")}</p>
                </Block>
              ) : null}
              {summary.confirmLines.length > 0 ? (
                <Block title="À confirmer">
                  {summary.confirmLines.map((l) => (
                    <p key={l} className="text-amber-800">
                      ⚠ {l}
                    </p>
                  ))}
                </Block>
              ) : null}
              {(visit.impactPoints ?? []).length > 0 ? (
                <Block title="Points à intégrer au devis">
                  {(visit.impactPoints ?? []).map((p) => (
                    <p
                      key={p.id}
                      className={
                        p.severity === "warn" ? "text-amber-800" : "text-slate-700"
                      }
                    >
                      {p.severity === "warn" ? "⚠ " : "☑ "}
                      {p.label}
                    </p>
                  ))}
                </Block>
              ) : null}
            </div>
          ) : null}

          {visit.status === "TRANSMITTED" && visit.commercialQuoteHref ? (
            <div className="mt-5 space-y-2">
              <p className="text-[13px] text-slate-600">
                Transmise au devis {visit.commercialQuoteNumber}
              </p>
              <Link
                href={visit.commercialQuoteHref}
                className="flex h-12 items-center justify-center rounded-xl bg-[#1e3a5f] text-[14px] font-semibold text-white"
              >
                Ouvrir le devis
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setFinishOpen(true)}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1e3a5f] text-[14px] font-semibold text-white disabled:opacity-50"
              >
                Marquer prête à chiffrer
              </button>
              {canCreateQuote && visit.status === "READY_TO_QUOTE" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void createQuote()}
                  className="flex h-12 w-full items-center justify-center rounded-xl border border-[#1e3a5f] text-[14px] font-semibold text-[#1e3a5f]"
                >
                  Créer le devis →
                </button>
              ) : null}
            </div>
          )}
        </Section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg gap-2">
          <button
            type="button"
            disabled={stepIndex <= 0}
            onClick={() => setStep(VISIT_STEPS[stepIndex - 1]!.id)}
            className="h-11 flex-1 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 disabled:opacity-30"
          >
            Précédent
          </button>
          {stepIndex < VISIT_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(VISIT_STEPS[stepIndex + 1]!.id)}
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
            <input
              value={mForm.zone}
              onChange={(e) => setMForm({ ...mForm, zone: e.target.value })}
              placeholder="Ex. Terrasse principale"
              className={fieldClass}
            />
          </Field>
          <Field label="Libellé">
            <input
              value={mForm.label}
              onChange={(e) => setMForm({ ...mForm, label: e.target.value })}
              placeholder="Ex. Surface étanchéité"
              className={fieldClass}
            />
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
            <Field label="Longueur (m)">
              <input
                inputMode="decimal"
                value={mForm.lengthM}
                onChange={(e) => setMForm({ ...mForm, lengthM: e.target.value })}
                className={fieldClass}
              />
            </Field>
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
                <input
                  value={mForm.unit}
                  onChange={(e) => setMForm({ ...mForm, unit: e.target.value })}
                  placeholder="U"
                  className={fieldClass}
                />
              </Field>
            </>
          ) : null}
          <p className="mt-3 text-[15px] font-semibold tabular-nums text-[#1e3a5f]">
            Résultat : {preview.computedQuantity} {preview.unit}
          </p>
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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-4">
      <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {title}
      </h3>
      <div className="mt-1.5 space-y-0.5 text-slate-800">{children}</div>
    </div>
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
