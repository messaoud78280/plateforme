"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  ACCESS_OPTIONS,
  OCCUPATION_OPTIONS,
  SUPPORT_STATE_OPTIONS,
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
  constraints: {
    access?: string[];
    occupation?: string[];
    supportState?: string | null;
    otherComment?: string | null;
  };
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
  stats: {
    measurementCount: number;
    photoCount: number;
    documentCount: number;
    missingOpenCount: number;
  };
};

const MEASURE_TYPES: { id: MeasureType; label: string }[] = [
  { id: "SURFACE", label: "Surface" },
  { id: "LENGTH", label: "Longueur" },
  { id: "VOLUME", label: "Volume" },
  { id: "QUANTITY", label: "Quantité" },
  { id: "FREE", label: "Mesure libre" },
];

export function SiteVisitDetailClient({
  initial,
  canCreateQuote,
}: {
  initial: Visit;
  canCreateQuote: boolean;
}) {
  const router = useRouter();
  const [visit, setVisit] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [measureOpen, setMeasureOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [missingLabel, setMissingLabel] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [mForm, setMForm] = useState({
    zone: "",
    label: "",
    measureType: "SURFACE" as MeasureType,
    lengthM: "",
    widthM: "",
    heightM: "",
    quantityValue: "",
    unit: "",
    observation: "",
  });

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

  async function saveMeasurement() {
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
      setMeasureOpen(false);
      setMForm({
        zone: "",
        label: "",
        measureType: "SURFACE",
        lengthM: "",
        widthM: "",
        heightM: "",
        quantityValue: "",
        unit: "",
        observation: "",
      });
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
      const res = await fetch(`/api/site-visits/${visit.id}/media`, {
        method: "POST",
        body: fd,
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

  async function createQuote() {
    setBusy(true);
    try {
      const res = await fetch(`/api/site-visits/${visit.id}/create-quote`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      if (data.href) window.open(data.href, "_blank", "noopener,noreferrer");
      const refreshed = await fetch(`/api/site-visits/${visit.id}`).then((r) => r.json());
      if (refreshed.visit) setVisit(refreshed.visit);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function toggleConstraint(
    group: "access" | "occupation",
    value: string,
  ) {
    const current = visit.constraints[group] ?? [];
    const next = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value];
    void patch({ constraints: { ...visit.constraints, [group]: next } });
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 px-3 py-4 pb-28 sm:px-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/dashboard/visites-metres"
          className="text-sm font-semibold text-[#1e3a5f]"
        >
          ← Visites
        </Link>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
          {visit.statusLabel}
        </span>
      </div>

      <header className="rounded-2xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-[#1e3a5f]">
          {visit.siteName || visit.clientName}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{visit.siteAddress}</p>
        <p className="mt-2 text-xs text-slate-500">
          {visit.clientName}
          {visit.contactName ? ` · ${visit.contactName}` : ""}
          {visit.contactPhone ? ` · ${visit.contactPhone}` : ""}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {visit.scheduledAt
            ? new Date(visit.scheduledAt).toLocaleString("fr-FR")
            : "Date à planifier"}
          {visit.responsibleName ? ` · ${visit.responsibleName}` : ""}
        </p>
        <p className="mt-2 text-sm font-medium text-slate-800">{visit.subject}</p>
      </header>

      {message ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{message}</p>
      ) : null}

      <Section title="Demande client">
        <textarea
          defaultValue={visit.clientNeed ?? ""}
          onBlur={(e) => {
            if (e.target.value !== (visit.clientNeed ?? "")) {
              void patch({ clientNeed: e.target.value });
            }
          }}
          rows={3}
          placeholder="Besoin / demande du client"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={visit.siteOccupied}
            onChange={(e) => void patch({ siteOccupied: e.target.checked })}
          />
          Site occupé
        </label>
        <input
          defaultValue={visit.urgencyNote ?? ""}
          onBlur={(e) => {
            if (e.target.value !== (visit.urgencyNote ?? "")) {
              void patch({ urgencyNote: e.target.value });
            }
          }}
          placeholder="Urgence"
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        <input
          defaultValue={visit.timeConstraints ?? ""}
          onBlur={(e) => {
            if (e.target.value !== (visit.timeConstraints ?? "")) {
              void patch({ timeConstraints: e.target.value });
            }
          }}
          placeholder="Contraintes horaires"
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
      </Section>

      <Section title="Relevés">
        <ul className="space-y-2">
          {visit.measurements.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <p className="font-medium text-slate-900">
                {m.zone ? `${m.zone} — ` : ""}
                {m.label}
              </p>
              <p className="text-sm tabular-nums text-[#1e3a5f]">{m.quantityLabel}</p>
              {m.modifiedAfterTransmit ? (
                <p className="text-[11px] text-amber-700">
                  Relevé modifié après transmission
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setMeasureOpen(true)}
          className="mt-3 w-full rounded-xl bg-[#1e3a5f] py-3 text-sm font-bold text-white"
        >
          + Ajouter un relevé
        </button>
      </Section>

      <Section title="Photos & documents">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => photoRef.current?.click()}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold"
          >
            Ajouter des photos
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => docRef.current?.click()}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold"
          >
            Ajouter un document
          </button>
        </div>
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f, "PHOTO");
            e.target.value = "";
          }}
        />
        <input
          ref={docRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f, "DOCUMENT");
            e.target.value = "";
          }}
        />
        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          {visit.medias.map((m) => (
            <li key={m.id}>
              {m.kind === "PHOTO" ? "📷" : "📄"} {m.name}
              {m.caption ? ` — ${m.caption}` : ""}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Contraintes chantier">
        <p className="text-[11px] font-semibold uppercase text-slate-400">Accès</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {ACCESS_OPTIONS.map((o) => (
            <Chip
              key={o}
              active={(visit.constraints.access ?? []).includes(o)}
              onClick={() => toggleConstraint("access", o)}
              label={o}
            />
          ))}
        </div>
        <p className="mt-3 text-[11px] font-semibold uppercase text-slate-400">
          Occupation
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {OCCUPATION_OPTIONS.map((o) => (
            <Chip
              key={o}
              active={(visit.constraints.occupation ?? []).includes(o)}
              onClick={() => toggleConstraint("occupation", o)}
              label={o}
            />
          ))}
        </div>
        <p className="mt-3 text-[11px] font-semibold uppercase text-slate-400">
          État du support
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {SUPPORT_STATE_OPTIONS.map((o) => (
            <Chip
              key={o}
              active={visit.constraints.supportState === o}
              onClick={() =>
                void patch({
                  constraints: { ...visit.constraints, supportState: o },
                })
              }
              label={o}
            />
          ))}
        </div>
        <input
          defaultValue={visit.constraints.otherComment ?? ""}
          onBlur={(e) =>
            void patch({
              constraints: {
                ...visit.constraints,
                otherComment: e.target.value || null,
              },
            })
          }
          placeholder="Autre / commentaire"
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
      </Section>

      <Section title="Estimation équipe">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold text-slate-600">
            Équipe (personnes)
            <input
              type="number"
              defaultValue={visit.estimatedCrewCount ?? ""}
              onBlur={(e) =>
                void patch({
                  estimatedCrewCount: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Durée estimée
            <input
              defaultValue={visit.estimatedDuration ?? ""}
              onBlur={(e) =>
                void patch({ estimatedDuration: e.target.value || null })
              }
              placeholder="ex. 3 jours"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>
        </div>
      </Section>

      <Section title="Informations manquantes">
        <ul className="space-y-2">
          {visit.missingInfos.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm"
            >
              <span className={i.open ? "text-amber-950" : "text-slate-400 line-through"}>
                {i.label}
              </span>
              {i.open ? (
                <button
                  type="button"
                  className="text-xs font-bold text-[#1e3a5f]"
                  onClick={() =>
                    void action({ action: "resolve_missing", missingId: i.id })
                  }
                >
                  OK
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <input
            value={missingLabel}
            onChange={(e) => setMissingLabel(e.target.value)}
            placeholder="À confirmer…"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <button
            type="button"
            disabled={busy || !missingLabel.trim()}
            onClick={() =>
              void action({ action: "add_missing", label: missingLabel })
            }
            className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            +
          </button>
        </div>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg gap-2">
          {visit.status === "TRANSMITTED" && visit.commercialQuoteHref ? (
            <a
              href={visit.commercialQuoteHref}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-xl bg-[#1e3a5f] py-3.5 text-center text-sm font-bold text-white"
            >
              Ouvrir {visit.commercialQuoteNumber ?? "le devis"}
            </a>
          ) : visit.status === "READY_TO_QUOTE" && canCreateQuote ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void createQuote()}
              className="flex-1 rounded-xl bg-[#1e3a5f] py-3.5 text-sm font-bold text-white"
            >
              Créer le devis →
            </button>
          ) : visit.status !== "CANCELLED" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setFinishOpen(true)}
              className="flex-1 rounded-xl bg-[#1e3a5f] py-3.5 text-sm font-bold text-white"
            >
              Terminer la visite
            </button>
          ) : null}
        </div>
      </div>

      {measureOpen ? (
        <Modal onClose={() => setMeasureOpen(false)} title="Ajouter un relevé">
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
          <input
            value={mForm.zone}
            onChange={(e) => setMForm({ ...mForm, zone: e.target.value })}
            placeholder="Zone / localisation"
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <input
            value={mForm.label}
            onChange={(e) => setMForm({ ...mForm, label: e.target.value })}
            placeholder="Libellé *"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          {(mForm.measureType === "SURFACE" ||
            mForm.measureType === "VOLUME" ||
            mForm.measureType === "LENGTH") && (
            <input
              value={mForm.lengthM}
              onChange={(e) => setMForm({ ...mForm, lengthM: e.target.value })}
              placeholder={mForm.measureType === "LENGTH" ? "Longueur (m)" : "Longueur (m)"}
              inputMode="decimal"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          )}
          {(mForm.measureType === "SURFACE" || mForm.measureType === "VOLUME") && (
            <input
              value={mForm.widthM}
              onChange={(e) => setMForm({ ...mForm, widthM: e.target.value })}
              placeholder="Largeur (m)"
              inputMode="decimal"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          )}
          {mForm.measureType === "VOLUME" && (
            <input
              value={mForm.heightM}
              onChange={(e) => setMForm({ ...mForm, heightM: e.target.value })}
              placeholder="Hauteur (m)"
              inputMode="decimal"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          )}
          {(mForm.measureType === "QUANTITY" || mForm.measureType === "FREE") && (
            <>
              <input
                value={mForm.quantityValue}
                onChange={(e) =>
                  setMForm({ ...mForm, quantityValue: e.target.value })
                }
                placeholder="Valeur"
                inputMode="decimal"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
              <input
                value={mForm.unit}
                onChange={(e) => setMForm({ ...mForm, unit: e.target.value })}
                placeholder={mForm.measureType === "QUANTITY" ? "Unité (U)" : "Unité"}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </>
          )}
          <textarea
            value={mForm.observation}
            onChange={(e) => setMForm({ ...mForm, observation: e.target.value })}
            placeholder="Observation"
            rows={2}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <p className="mt-3 text-center text-lg font-bold tabular-nums text-[#1e3a5f]">
            {preview.computedQuantity} {preview.unit}
          </p>
          <button
            type="button"
            disabled={busy || !mForm.label.trim()}
            onClick={() => void saveMeasurement()}
            className="mt-3 w-full rounded-xl bg-[#1e3a5f] py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            Enregistrer le relevé
          </button>
        </Modal>
      ) : null}

      {finishOpen ? (
        <Modal onClose={() => setFinishOpen(false)} title="Terminer la visite">
          {visit.stats.missingOpenCount > 0 ? (
            <p className="text-sm text-amber-800">
              {visit.stats.missingOpenCount} information(s) encore manquante(s).
            </p>
          ) : (
            <p className="text-sm text-slate-600">
              Vous pouvez marquer la visite prête à chiffrer.
            </p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void action({ action: "finish", mode: "incomplete" })}
            className="mt-4 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold"
          >
            Enregistrer comme incomplète
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void action({ action: "finish", mode: "ready" })}
            className="mt-2 w-full rounded-xl bg-[#1e3a5f] py-3 text-sm font-bold text-white"
          >
            Marquer prête à chiffrer
          </button>
        </Modal>
      ) : null}
    </div>
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
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold",
        active ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-700",
      )}
    >
      {label}
    </button>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#1e3a5f]">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400">
            Fermer
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
