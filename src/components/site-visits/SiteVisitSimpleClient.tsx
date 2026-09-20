"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Mic, MicOff, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  SIMPLE_WORK_TYPES,
  type SiteVisitPrep,
} from "@/lib/site-visits/types";
import {
  computeMeasurement,
  type MeasureType,
} from "@/lib/site-visits/measurements";
import { emptyCommercial, type SiteVisitCommercialInfo } from "@/lib/site-visits/survey-types";

type ClientOpt = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  contacts: Array<{
    name: string;
    phone: string | null;
    email: string | null;
    isPrimary: boolean;
  }>;
};

type UserOpt = { id: string; name: string | null; email: string };

type Visit = {
  id: string;
  clientName: string;
  clientExternalOrgId?: string | null;
  siteName: string | null;
  siteAddress: string;
  contactName: string | null;
  contactPhone: string | null;
  scheduledAt: string | null;
  responsibleName: string | null;
  responsibleId?: string | null;
  subject: string;
  clientNeed: string | null;
  comments: string | null;
  lots?: string[];
  prep?: SiteVisitPrep;
  status: string;
  statusLabel: string;
  commercialQuoteHref: string | null;
  commercialQuoteNumber: string | null;
  commercial?: SiteVisitCommercialInfo;
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
  }>;
  medias: Array<{
    id: string;
    kind: string;
    name: string;
    caption: string | null;
    observation?: string | null;
    fileUrl: string | null;
  }>;
  missingInfos: Array<{ id: string; label: string; open: boolean }>;
};

const MEASURE_TYPE_OPTS: { id: MeasureType; label: string }[] = [
  { id: "SURFACE", label: "Surface" },
  { id: "LENGTH", label: "Longueur" },
  { id: "VOLUME", label: "Volume" },
  { id: "QUANTITY", label: "Quantité" },
  { id: "FREE", label: "Autre" },
];

const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-[15px] text-slate-900 outline-none focus:border-[#1e3a5f]/40";
const label = "block text-[12px] font-semibold uppercase tracking-wide text-slate-500";

function useSpeechDictation(onText: (chunk: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);

  const supported =
    typeof window !== "undefined" &&
    Boolean(
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition,
    );

  const toggle = useCallback(() => {
    if (!supported) return;
    if (listening && recRef.current) {
      recRef.current.stop();
      setListening(false);
      return;
    }
    const SR =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => {
      const last = event.results[event.results.length - 1];
      const t = last?.[0]?.transcript?.trim();
      if (t) onText(t);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening, onText, supported]);

  useEffect(() => () => recRef.current?.stop(), []);

  return { supported, listening, toggle };
}

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function MicButton({
  supported,
  listening,
  onClick,
}: {
  supported: boolean;
  listening: boolean;
  onClick: () => void;
}) {
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      title={listening ? "Arrêter la dictée" : "Dicter (micro)"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border",
        listening
          ? "border-red-300 bg-red-50 text-red-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      )}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}

export function SiteVisitSimpleClient({
  initial,
  clients,
  users,
  canCreateQuote,
}: {
  initial: Visit;
  clients: ClientOpt[];
  users: UserOpt[];
  canCreateQuote: boolean;
}) {
  const [visit, setVisit] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [chatgptPreview, setChatgptPreview] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; caption: string } | null>(null);
  const [measureOpen, setMeasureOpen] = useState(false);
  const [clientQuery, setClientQuery] = useState("");
  const dirty = useRef(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [clientName, setClientName] = useState(initial.clientName);
  const [clientCivility, setClientCivility] = useState(initial.prep?.clientCivility ?? "");
  const [linkedClientId, setLinkedClientId] = useState(initial.clientExternalOrgId ?? "");
  const [phone, setPhone] = useState(() => {
    // Si contact sur place distinct, le tél. visite était parfois le contact :
    // on privilégie le téléphone client côté fiche liée, sinon contactPhone.
    if (initial.contactName && initial.contactName !== initial.clientName) {
      return initial.contactPhone ?? "";
    }
    return initial.contactPhone ?? "";
  });
  const [email, setEmail] = useState(initial.prep?.contactEmail ?? "");
  const [address, setAddress] = useState(initial.siteAddress);
  const [zipCode, setZipCode] = useState(initial.prep?.zipCode ?? "");
  const [city, setCity] = useState(initial.prep?.city ?? "");
  const [billingSameAsSite, setBillingSameAsSite] = useState(
    initial.prep?.billingSameAsSite !== false &&
      !initial.prep?.clientAddress?.trim(),
  );
  const [clientAddress, setClientAddress] = useState(initial.prep?.clientAddress ?? "");
  const [clientZipCode, setClientZipCode] = useState(initial.prep?.clientZipCode ?? "");
  const [clientCity, setClientCity] = useState(initial.prep?.clientCity ?? "");
  const [clientCountry, setClientCountry] = useState(
    initial.prep?.clientCountry ?? "France",
  );
  const [contactName, setContactName] = useState(
    initial.contactName && initial.contactName !== initial.clientName
      ? (initial.contactName ?? "")
      : "",
  );
  const [contactPhone, setContactPhone] = useState(
    initial.prep?.siteContactPhone ??
      (initial.contactName && initial.contactName !== initial.clientName
        ? (initial.contactPhone ?? "")
        : ""),
  );
  const [siteContactEmail, setSiteContactEmail] = useState(
    initial.prep?.siteContactEmail ?? "",
  );
  const [scheduledAt, setScheduledAt] = useState(
    initial.scheduledAt ? initial.scheduledAt.slice(0, 16) : "",
  );
  const [responsibleId, setResponsibleId] = useState(initial.responsibleId ?? "");
  const [works, setWorks] = useState(initial.clientNeed ?? "");
  const [lots, setLots] = useState<string[]>(initial.lots ?? []);
  const [fieldNotes, setFieldNotes] = useState(initial.prep?.fieldNotes ?? "");
  const [observations, setObservations] = useState(initial.comments ?? "");
  const fieldNotesRef = useRef<HTMLTextAreaElement>(null);
  const [materials, setMaterials] = useState(initial.commercial?.supplyByClient ?? "");
  const [budget, setBudget] = useState(initial.commercial?.budgetAnnounced ?? "");
  const [delay, setDelay] = useState(initial.commercial?.desiredDelay ?? "");

  const [mForm, setMForm] = useState({
    label: "",
    measureType: "SURFACE" as MeasureType,
    lengthM: "",
    widthM: "",
    heightM: "",
    quantityValue: "",
    unit: "",
    observation: "",
  });

  const photos = visit.medias.filter((m) => m.kind === "PHOTO");
  const previewCalc = computeMeasurement({
    measureType: mForm.measureType,
    lengthM: mForm.lengthM ? Number(mForm.lengthM.replace(",", ".")) : null,
    widthM: mForm.widthM ? Number(mForm.widthM.replace(",", ".")) : null,
    heightM: mForm.heightM ? Number(mForm.heightM.replace(",", ".")) : null,
    quantityValue: mForm.quantityValue
      ? Number(mForm.quantityValue.replace(",", "."))
      : null,
    unit: mForm.unit || null,
  });

  const dossier = {
    client: Boolean(clientName.trim() && address.trim()),
    works: Boolean(works.trim()),
    measures: visit.measurements.length,
    fieldNotes: Boolean(fieldNotes.trim()),
    photos: photos.length,
    observations: Boolean(observations.trim()),
  };

  const markDirty = () => {
    dirty.current = true;
  };

  const buildPayload = useCallback(() => {
    const subject =
      works.trim().slice(0, 80) ||
      visit.subject ||
      "Compte rendu de visite";
    const prep: SiteVisitPrep = {
      ...(visit.prep ?? {}),
      contactEmail: email.trim() || null,
      zipCode: zipCode.trim() || null,
      city: city.trim() || null,
      fieldNotes: fieldNotes.trim() || null,
      clientCivility: clientCivility.trim() || null,
      clientCompany: null,
      clientAddress: billingSameAsSite ? null : clientAddress.trim() || null,
      clientZipCode: billingSameAsSite ? null : clientZipCode.trim() || null,
      clientCity: billingSameAsSite ? null : clientCity.trim() || null,
      clientCountry: clientCountry.trim() || "France",
      billingSameAsSite,
      siteCountry: "France",
      siteContactEmail: siteContactEmail.trim() || null,
      siteContactPhone: contactName.trim()
        ? contactPhone.trim() || null
        : null,
    };
    const commercial: SiteVisitCommercialInfo = {
      ...(visit.commercial ?? emptyCommercial()),
      supplyByClient: materials.trim() || null,
      budgetAnnounced: budget.trim() || null,
      desiredDelay: delay.trim() || null,
    };
    return {
      clientName: clientName.trim(),
      siteAddress: address.trim(),
      contactName: contactName.trim() || null,
      contactPhone: phone.trim() || null,
      clientExternalOrgId: linkedClientId || null,
      subject,
      clientNeed: works.trim() || null,
      comments: observations.trim() || null,
      lots,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      responsibleId: responsibleId || null,
      prep,
      commercial,
      surveyStage: "SYNTHESIS",
    };
  }, [
    address,
    billingSameAsSite,
    budget,
    city,
    clientAddress,
    clientCity,
    clientCivility,
    clientCountry,
    clientName,
    clientZipCode,
    contactName,
    contactPhone,
    delay,
    email,
    fieldNotes,
    linkedClientId,
    lots,
    materials,
    observations,
    phone,
    responsibleId,
    scheduledAt,
    siteContactEmail,
    visit.commercial,
    visit.prep,
    visit.subject,
    works,
    zipCode,
  ]);

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
      if (!res.ok) throw new Error(json.error || "Échec enregistrement");
      setVisit(json.visit);
      dirty.current = false;
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1800);
      return json.visit as Visit;
    } catch (e) {
      setSaveState("error");
      setMessage(e instanceof Error ? e.message : "Erreur");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!dirty.current) return;
    const t = window.setTimeout(() => {
      void patch(buildPayload()).catch(() => undefined);
    }, 1400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    clientName,
    clientCivility,
    linkedClientId,
    phone,
    email,
    address,
    zipCode,
    city,
    billingSameAsSite,
    clientAddress,
    clientZipCode,
    clientCity,
    clientCountry,
    contactName,
    contactPhone,
    siteContactEmail,
    scheduledAt,
    responsibleId,
    works,
    lots,
    fieldNotes,
    observations,
    materials,
    budget,
    delay,
  ]);

  const worksSpeech = useSpeechDictation((chunk) => {
    markDirty();
    setWorks((w) => (w ? `${w.trim()} ${chunk}` : chunk));
  });
  const fieldNotesSpeech = useSpeechDictation((chunk) => {
    markDirty();
    setFieldNotes((n) => (n ? `${n.trim()} ${chunk}` : chunk));
  });
  const obsSpeech = useSpeechDictation((chunk) => {
    markDirty();
    setObservations((o) => (o ? `${o.trim()} ${chunk}` : chunk));
  });

  function autoGrowFieldNotes() {
    const el = fieldNotesRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(220, el.scrollHeight)}px`;
  }

  useEffect(() => {
    autoGrowFieldNotes();
  }, [fieldNotes]);

  const filteredClients = clients.filter((c) => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.city ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q)
    );
  });

  function pickClient(c: ClientOpt) {
    const primary = c.contacts.find((x) => x.isPrimary) ?? c.contacts[0];
    markDirty();
    setLinkedClientId(c.id);
    setClientName(c.name);
    setPhone(c.phone || primary?.phone || "");
    setEmail(c.email || primary?.email || "");
    const addr = c.address || "";
    const zip = c.zipCode || "";
    const ville = c.city || "";
    if (!address.trim()) {
      setAddress(addr);
      setZipCode(zip);
      setCity(ville);
      setBillingSameAsSite(true);
    } else {
      setClientAddress(addr);
      setClientZipCode(zip);
      setClientCity(ville);
      setBillingSameAsSite(false);
    }
    setClientQuery("");
  }

  async function saveDraft() {
    await patch(buildPayload());
    setMessage("Brouillon enregistré");
  }

  async function addMeasurement() {
    if (!mForm.label.trim()) {
      setMessage("Indiquez une désignation pour la mesure");
      return;
    }
    setBusy(true);
    try {
      await patch(buildPayload());
      const res = await fetch(`/api/site-visits/${visit.id}/measurements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: mForm.label.trim(),
          measureType: mForm.measureType,
          lengthM: mForm.lengthM ? Number(mForm.lengthM.replace(",", ".")) : null,
          widthM: mForm.widthM ? Number(mForm.widthM.replace(",", ".")) : null,
          heightM: mForm.heightM ? Number(mForm.heightM.replace(",", ".")) : null,
          quantityValue: mForm.quantityValue
            ? Number(mForm.quantityValue.replace(",", "."))
            : null,
          unit: mForm.unit || null,
          observation: mForm.observation.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Mesure impossible");
      setVisit(json.visit);
      setMeasureOpen(false);
      setMForm({
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
      setMessage(e instanceof Error ? e.message : "Erreur mesure");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMeasurement(id: string) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/site-visits/${visit.id}/measurements?measurementId=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Suppression impossible");
      setVisit(json.visit);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      await patch(buildPayload());
      let latest = visit;
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("kind", "PHOTO");
        const res = await fetch(`/api/site-visits/${visit.id}/media`, {
          method: "POST",
          body: fd,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Upload photo impossible");
        latest = json.visit;
      }
      setVisit(latest);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur photo");
    } finally {
      setBusy(false);
    }
  }

  async function updateCaption(mediaId: string, caption: string) {
    const res = await fetch(`/api/site-visits/${visit.id}/media`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId, caption }),
    });
    const json = await res.json();
    if (res.ok) setVisit(json.visit);
  }

  async function deletePhoto(mediaId: string) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/site-visits/${visit.id}/media?mediaId=${encodeURIComponent(mediaId)}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Suppression impossible");
      setVisit(json.visit);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function openPreview() {
    try {
      await patch(buildPayload());
      setPreviewOpen(true);
      setChatgptPreview(null);
    } catch {
      /* message déjà posé */
    }
  }

  async function downloadPdf() {
    setBusy(true);
    try {
      await patch(buildPayload());
      const res = await fetch(`/api/site-visits/${visit.id}/export-survey?format=pdf`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "PDF impossible");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "compte-rendu-visite.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur PDF");
    } finally {
      setBusy(false);
    }
  }

  async function copyChatgpt() {
    setBusy(true);
    try {
      await patch(buildPayload());
      const res = await fetch(`/api/site-visits/${visit.id}/export-survey?format=prompt`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export impossible");
      await navigator.clipboard.writeText(data.prompt);
      setChatgptPreview(data.prompt);
      setMessage("Instructions ChatGPT copiées");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function downloadZip() {
    try {
      await patch(buildPayload());
      window.location.href = `/api/site-visits/${visit.id}/export-survey?format=zip`;
    } catch {
      /* */
    }
  }

  function toggleLot(lot: string) {
    markDirty();
    setLots((prev) =>
      prev.includes(lot) ? prev.filter((x) => x !== lot) : [...prev, lot],
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-3 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:pb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/dashboard/visites-metres"
          className="min-h-11 inline-flex items-center text-sm font-semibold text-[#1e3a5f]"
        >
          ← Visites
        </Link>
        <div className="flex items-center gap-3 text-[12px]">
          {saveState === "saving" ? (
            <span className="text-slate-500">Enregistrement…</span>
          ) : saveState === "saved" ? (
            <span className="text-emerald-700">Enregistré</span>
          ) : saveState === "error" ? (
            <span className="text-red-700">Erreur sauvegarde</span>
          ) : null}
          <Link
            href={`/dashboard/visites-metres/${visit.id}?vue=avancee`}
            className="min-h-11 inline-flex items-center text-slate-500 hover:underline"
          >
            Vue avancée
          </Link>
        </div>
      </div>

      <header className="mb-4 rounded-2xl border border-[#1e3a5f]/10 bg-[#1e3a5f]/5 px-4 py-4">
        <h1 className="text-[20px] font-semibold leading-tight text-[#1e3a5f]">
          Compte rendu de visite
        </h1>
        <p className="mt-1 text-[13px] text-slate-600">
          5 étapes · puis générez le document pour ChatGPT / devis estimatif
        </p>
      </header>

      {/* Résumé compact mobile */}
      <div className="mb-4 rounded-2xl border border-[#1e3a5f]/15 bg-white p-3 lg:hidden">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#1e3a5f]">
          Dossier
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[12px]">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-medium",
              dossier.client ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900",
            )}
          >
            Client {dossier.client ? "OK" : "…"}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-medium",
              dossier.works ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900",
            )}
          >
            Travaux {dossier.works ? "OK" : "…"}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-medium",
              dossier.fieldNotes || dossier.measures > 0
                ? "bg-emerald-50 text-emerald-800"
                : "bg-amber-50 text-amber-900",
            )}
          >
            {dossier.fieldNotes
              ? "Relevés OK"
              : dossier.measures > 0
                ? `${dossier.measures} mesure${dossier.measures > 1 ? "s" : ""}`
                : "Relevés …"}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
            {dossier.photos} photo{dossier.photos > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {message ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
          {message}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {/* BLOC 1 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-[16px] font-semibold text-[#1e3a5f]">1. Client & chantier</h2>
            <div className="mt-3">
              <label className={label}>Client existant (recherche)</label>
              <input
                className={field}
                value={clientQuery}
                onChange={(e) => setClientQuery(e.target.value)}
                placeholder="Rechercher un client BeWork…"
              />
              {clientQuery.trim() ? (
                <ul className="mt-2 max-h-40 overflow-auto rounded-xl border border-slate-100 bg-slate-50">
                  {filteredClients.slice(0, 8).map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-[13px] hover:bg-white"
                        onClick={() => pickClient(c)}
                      >
                        <span className="font-medium text-slate-800">{c.name}</span>
                        <span className="block text-[12px] text-slate-500">
                          {[c.city, c.phone].filter(Boolean).join(" · ")}
                        </span>
                      </button>
                    </li>
                  ))}
                  {filteredClients.length === 0 ? (
                    <li className="px-3 py-2 text-[12px] text-slate-500">
                      Aucun client — saisissez les infos ci-dessous
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label>
                <span className={label}>Civilité</span>
                <select
                  className={field}
                  value={clientCivility}
                  onChange={(e) => {
                    markDirty();
                    setClientCivility(e.target.value);
                  }}
                >
                  <option value="">—</option>
                  <option value="M.">M.</option>
                  <option value="Mme">Mme</option>
                  <option value="Mlle">Mlle</option>
                  <option value="Société">Société</option>
                </select>
              </label>
              <label>
                <span className={label}>Nom du client / société</span>
                <input
                  className={field}
                  value={clientName}
                  onChange={(e) => {
                    markDirty();
                    setClientName(e.target.value);
                    if (linkedClientId) setLinkedClientId("");
                  }}
                />
              </label>
              <label>
                <span className={label}>Téléphone</span>
                <input
                  className={field}
                  value={phone}
                  onChange={(e) => {
                    markDirty();
                    setPhone(e.target.value);
                  }}
                />
              </label>
              <label>
                <span className={label}>Email</span>
                <input
                  className={field}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    markDirty();
                    setEmail(e.target.value);
                  }}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={label}>Adresse du chantier</span>
                <input
                  className={field}
                  value={address}
                  onChange={(e) => {
                    markDirty();
                    setAddress(e.target.value);
                  }}
                />
              </label>
              <label>
                <span className={label}>Code postal</span>
                <input
                  className={field}
                  value={zipCode}
                  onChange={(e) => {
                    markDirty();
                    setZipCode(e.target.value);
                  }}
                />
              </label>
              <label>
                <span className={label}>Ville</span>
                <input
                  className={field}
                  value={city}
                  onChange={(e) => {
                    markDirty();
                    setCity(e.target.value);
                  }}
                />
              </label>
              <label className="sm:col-span-2 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={billingSameAsSite}
                  onChange={(e) => {
                    markDirty();
                    setBillingSameAsSite(e.target.checked);
                    if (e.target.checked) {
                      setClientAddress("");
                      setClientZipCode("");
                      setClientCity("");
                    }
                  }}
                />
                <span className="text-[13px] text-slate-700">
                  L’adresse du client est identique à celle du chantier
                </span>
              </label>
              {!billingSameAsSite ? (
                <>
                  <label className="sm:col-span-2">
                    <span className={label}>Adresse de facturation</span>
                    <input
                      className={field}
                      value={clientAddress}
                      onChange={(e) => {
                        markDirty();
                        setClientAddress(e.target.value);
                      }}
                    />
                  </label>
                  <label>
                    <span className={label}>CP facturation</span>
                    <input
                      className={field}
                      value={clientZipCode}
                      onChange={(e) => {
                        markDirty();
                        setClientZipCode(e.target.value);
                      }}
                    />
                  </label>
                  <label>
                    <span className={label}>Ville facturation</span>
                    <input
                      className={field}
                      value={clientCity}
                      onChange={(e) => {
                        markDirty();
                        setClientCity(e.target.value);
                      }}
                    />
                  </label>
                  <label className="sm:col-span-2">
                    <span className={label}>Pays</span>
                    <input
                      className={field}
                      value={clientCountry}
                      onChange={(e) => {
                        markDirty();
                        setClientCountry(e.target.value);
                      }}
                    />
                  </label>
                </>
              ) : null}
              <label>
                <span className={label}>Contact sur place (facultatif)</span>
                <input
                  className={field}
                  value={contactName}
                  onChange={(e) => {
                    markDirty();
                    setContactName(e.target.value);
                  }}
                  placeholder="Si différent du client"
                />
              </label>
              <label>
                <span className={label}>Tél. contact (facultatif)</span>
                <input
                  className={field}
                  value={contactPhone}
                  onChange={(e) => {
                    markDirty();
                    setContactPhone(e.target.value);
                  }}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={label}>Email contact sur place (facultatif)</span>
                <input
                  className={field}
                  type="email"
                  value={siteContactEmail}
                  onChange={(e) => {
                    markDirty();
                    setSiteContactEmail(e.target.value);
                  }}
                />
              </label>
              <label>
                <span className={label}>Date de visite</span>
                <input
                  className={field}
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => {
                    markDirty();
                    setScheduledAt(e.target.value);
                  }}
                />
              </label>
              <label>
                <span className={label}>Commercial / responsable</span>
                <select
                  className={field}
                  value={responsibleId}
                  onChange={(e) => {
                    markDirty();
                    setResponsibleId(e.target.value);
                  }}
                >
                  <option value="">—</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* BLOC 2 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[16px] font-semibold text-[#1e3a5f]">2. Travaux demandés</h2>
              <MicButton
                supported={worksSpeech.supported}
                listening={worksSpeech.listening}
                onClick={worksSpeech.toggle}
              />
            </div>
            <label className="mt-3 block">
              <span className={label}>Décrivez les travaux demandés</span>
              <textarea
                className={cn(field, "min-h-[140px] resize-y")}
                value={works}
                onChange={(e) => {
                  markDirty();
                  setWorks(e.target.value);
                }}
                placeholder="Ex. Le client souhaite refaire son allée de 45 m². Revêtement détérioré. Nouveau pavé. Prévoir dépose et préparation du terrain."
              />
            </label>
            <p className="mt-3 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
              Type de travaux (facultatif)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SIMPLE_WORK_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleLot(t)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[13px] font-medium",
                    lots.includes(t)
                      ? "bg-[#1e3a5f] text-white"
                      : "bg-slate-100 text-slate-700",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          {/* BLOC 3 */}
          <section
            id="bloc-metres"
            className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-[16px] font-semibold text-[#1e3a5f]">
                  3. Relevés & métrés de chantier
                </h2>
                <p className="mt-1 text-[13px] text-slate-500">
                  Décrivez simplement ce que vous avez relevé : dimensions, surfaces,
                  ouvrages existants et travaux à prévoir.
                </p>
              </div>
              <MicButton
                supported={fieldNotesSpeech.supported}
                listening={fieldNotesSpeech.listening}
                onClick={fieldNotesSpeech.toggle}
              />
            </div>

            <label className="mt-3 block">
              <span className={label}>Vos relevés sur le chantier</span>
              <textarea
                ref={fieldNotesRef}
                className={cn(field, "min-h-[220px] resize-none overflow-hidden")}
                value={fieldNotes}
                onChange={(e) => {
                  markDirty();
                  setFieldNotes(e.target.value);
                }}
                placeholder={`Exemple : La terrasse mesure 8 m de long sur 5 m de large, soit 40 m². La dalle existante présente plusieurs fissures. Le client souhaite remplacer le carrelage par un revêtement extérieur adapté.

Prévoir la dépose du revêtement, la préparation du support et la pose du nouveau revêtement.

L'accès au chantier se fait par un passage de 95 cm de large…`}
              />
            </label>

            {visit.measurements.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {visit.measurements.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-slate-800">{m.label}</p>
                      <p className="text-[13px] text-slate-600">
                        {[
                          m.lengthM != null ? `L ${m.lengthM}` : null,
                          m.widthM != null ? `l ${m.widthM}` : null,
                          m.heightM != null ? `H/P ${m.heightM}` : null,
                        ]
                          .filter(Boolean)
                          .join(" × ") || "—"}
                        {" → "}
                        <strong>
                          {m.computedQuantity > 0
                            ? `${m.quantityLabel || `${m.computedQuantity} ${m.unit}`}`
                            : "à confirmer"}
                        </strong>
                      </p>
                      {m.observation ? (
                        <p className="mt-0.5 text-[12px] text-slate-500">{m.observation}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteMeasurement(m.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-600"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {!measureOpen ? (
              <button
                type="button"
                onClick={() => setMeasureOpen(true)}
                className="mt-3 text-[13px] font-semibold text-[#1e3a5f] hover:underline"
              >
                + Ajouter une mesure détaillée
              </button>
            ) : (
              <div className="mt-3 space-y-3 rounded-xl border border-[#1e3a5f]/15 bg-slate-50 p-3">
                <p className="text-[12px] font-medium text-slate-600">
                  Mesure structurée (facultatif) — calcul automatique si dimensions renseignées
                </p>
                <label>
                  <span className={label}>Désignation</span>
                  <input
                    className={field}
                    value={mForm.label}
                    onChange={(e) => setMForm({ ...mForm, label: e.target.value })}
                    placeholder="Ex. Terrasse"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {MEASURE_TYPE_OPTS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMForm({ ...mForm, measureType: t.id })}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-[13px] font-medium",
                        mForm.measureType === t.id
                          ? "bg-[#1e3a5f] text-white"
                          : "bg-white text-slate-700 ring-1 ring-slate-200",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <label>
                    <span className={label}>Longueur</span>
                    <input
                      className={field}
                      inputMode="decimal"
                      value={mForm.lengthM}
                      onChange={(e) => setMForm({ ...mForm, lengthM: e.target.value })}
                    />
                  </label>
                  <label>
                    <span className={label}>Largeur</span>
                    <input
                      className={field}
                      inputMode="decimal"
                      value={mForm.widthM}
                      onChange={(e) => setMForm({ ...mForm, widthM: e.target.value })}
                    />
                  </label>
                  <label>
                    <span className={label}>Ép. / Prof.</span>
                    <input
                      className={field}
                      inputMode="decimal"
                      value={mForm.heightM}
                      onChange={(e) => setMForm({ ...mForm, heightM: e.target.value })}
                    />
                  </label>
                  <label>
                    <span className={label}>Quantité</span>
                    <input
                      className={field}
                      inputMode="decimal"
                      value={mForm.quantityValue}
                      onChange={(e) =>
                        setMForm({ ...mForm, quantityValue: e.target.value })
                      }
                    />
                  </label>
                </div>
                {previewCalc.computedQuantity > 0 ? (
                  <p className="text-[14px] font-semibold text-emerald-800">
                    Calculé : {previewCalc.computedQuantity} {previewCalc.unit}
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void addMeasurement()}
                    className="h-11 flex-1 rounded-xl bg-[#1e3a5f] text-[14px] font-semibold text-white"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeasureOpen(false)}
                    className="h-11 rounded-xl border border-slate-200 px-4 text-[13px] font-semibold text-slate-600"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* BLOC 4 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-[16px] font-semibold text-[#1e3a5f]">4. Photos du chantier</h2>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                void uploadPhotos(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                void uploadPhotos(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => cameraRef.current?.click()}
                className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] text-[15px] font-semibold text-white"
              >
                <Camera className="h-5 w-5" /> Prendre une photo
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => galleryRef.current?.click()}
                className="flex h-14 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[15px] font-semibold text-[#1e3a5f]"
              >
                Importer des images
              </button>
            </div>
            {photos.length > 0 ? (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((p) => (
                  <li key={p.id} className="overflow-hidden rounded-xl border border-slate-100">
                    <button
                      type="button"
                      className="block w-full"
                      onClick={() =>
                        p.fileUrl &&
                        setLightbox({ url: p.fileUrl, caption: p.caption || p.name })
                      }
                    >
                      {p.fileUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.fileUrl}
                          alt={p.caption || p.name}
                          className="aspect-square w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-slate-50 text-[11px] text-slate-400">
                          Photo
                        </div>
                      )}
                    </button>
                    <div className="space-y-1 p-2">
                      <input
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[12px]"
                        defaultValue={p.caption ?? ""}
                        placeholder="Légende…"
                        onBlur={(e) => {
                          if (e.target.value !== (p.caption ?? "")) {
                            void updateCaption(p.id, e.target.value);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => void deletePhoto(p.id)}
                        className="text-[11px] font-medium text-red-600"
                      >
                        Supprimer
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-center text-[13px] text-slate-500">
                Aucune photo — prenez-en sur place pour le compte rendu.
              </p>
            )}
          </section>

          {/* BLOC 5 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[16px] font-semibold text-[#1e3a5f]">
                5. Observations & contraintes
              </h2>
              <MicButton
                supported={obsSpeech.supported}
                listening={obsSpeech.listening}
                onClick={obsSpeech.toggle}
              />
            </div>
            <textarea
              className={cn(field, "mt-3 min-h-[120px] resize-y")}
              value={observations}
              onChange={(e) => {
                markDirty();
                setObservations(e.target.value);
              }}
              placeholder="Accès, réseaux, stationnement, demandes client…"
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label>
                <span className={label}>Matériaux souhaités</span>
                <input
                  className={field}
                  value={materials}
                  onChange={(e) => {
                    markDirty();
                    setMaterials(e.target.value);
                  }}
                />
              </label>
              <label>
                <span className={label}>Budget communiqué</span>
                <input
                  className={field}
                  value={budget}
                  onChange={(e) => {
                    markDirty();
                    setBudget(e.target.value);
                  }}
                />
              </label>
              <label>
                <span className={label}>Délai souhaité</span>
                <input
                  className={field}
                  value={delay}
                  onChange={(e) => {
                    markDirty();
                    setDelay(e.target.value);
                  }}
                />
              </label>
            </div>
          </section>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveDraft()}
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-700"
            >
              Enregistrer en brouillon
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void openPreview()}
              className="h-14 flex-1 rounded-2xl bg-[#1e3a5f] text-[16px] font-semibold text-white shadow-sm"
            >
              ✨ Générer le compte rendu
            </button>
          </div>

          {canCreateQuote && visit.commercialQuoteHref ? (
            <Link
              href={visit.commercialQuoteHref}
              className="block text-center text-[13px] font-medium text-[#1e3a5f] hover:underline"
            >
              Ouvrir le devis {visit.commercialQuoteNumber}
            </Link>
          ) : null}
        </div>

        {/* Sidebar desktop */}
        <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
          <div className="rounded-2xl border border-[#1e3a5f]/15 bg-white p-4 shadow-sm">
            <h3 className="text-[14px] font-semibold text-[#1e3a5f]">Dossier de visite</h3>
            <ul className="mt-3 space-y-2 text-[13px]">
              <li className={dossier.client ? "text-emerald-700" : "text-amber-800"}>
                Client : {dossier.client ? "renseigné" : "à compléter"}
              </li>
              <li className={dossier.works ? "text-emerald-700" : "text-amber-800"}>
                Travaux : {dossier.works ? "renseignés" : "à compléter"}
              </li>
              <li className={dossier.fieldNotes || dossier.measures > 0 ? "text-emerald-700" : "text-amber-800"}>
                Relevés :{" "}
                {dossier.fieldNotes
                  ? "texte renseigné"
                  : dossier.measures > 0
                    ? `${dossier.measures} mesure${dossier.measures > 1 ? "s" : ""}`
                    : "à compléter"}
              </li>
              <li className="text-slate-700">
                Photos : {dossier.photos} photo{dossier.photos > 1 ? "s" : ""}
              </li>
              <li className={dossier.observations ? "text-emerald-700" : "text-slate-500"}>
                Observations : {dossier.observations ? "renseignées" : "facultatif"}
              </li>
            </ul>
            <button
              type="button"
              disabled={busy}
              onClick={() => void openPreview()}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#1e3a5f] text-[14px] font-semibold text-white"
            >
              Générer le compte rendu
            </button>
          </div>
        </aside>
      </div>

      {/* Barre sticky mobile chantier */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 pt-2 backdrop-blur lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => cameraRef.current?.click()}
            className="flex h-12 flex-col items-center justify-center rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-700"
          >
            <Camera className="mb-0.5 h-4 w-4" />
            Photo
          </button>
          <button
            type="button"
            onClick={() => {
              document.getElementById("bloc-metres")?.scrollIntoView({ behavior: "smooth" });
              window.setTimeout(() => fieldNotesRef.current?.focus(), 300);
            }}
            className="flex h-12 flex-col items-center justify-center rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-700"
          >
            <Plus className="mb-0.5 h-4 w-4" />
            Relevés
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void openPreview()}
            className="flex h-12 items-center justify-center rounded-xl bg-[#1e3a5f] text-[12px] font-semibold text-white"
          >
            ✨ CR
          </button>
        </div>
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[17px] font-semibold text-[#1e3a5f]">
                Compte rendu prêt
              </h2>
              <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Fermer">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 text-[13px] text-slate-700">
              <p>
                <strong>{clientName}</strong>
                {phone ? ` · ${phone}` : ""}
              </p>
              <p>{[address, zipCode, city].filter(Boolean).join(", ")}</p>
              {works ? <p className="whitespace-pre-wrap">{works.slice(0, 280)}{works.length > 280 ? "…" : ""}</p> : null}
              {fieldNotes ? (
                <p className="whitespace-pre-wrap text-slate-700">
                  {fieldNotes.slice(0, 320)}
                  {fieldNotes.length > 320 ? "…" : ""}
                </p>
              ) : null}
              <p>
                {fieldNotes ? "Relevés texte · " : ""}
                {visit.measurements.length} mesure(s) · {photos.length} photo(s)
              </p>
              {observations ? (
                <p className="text-slate-600">{observations.slice(0, 160)}{observations.length > 160 ? "…" : ""}</p>
              ) : null}
            </div>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void downloadPdf()}
                className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 text-[14px] font-semibold text-slate-800"
              >
                Télécharger le compte rendu PDF
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void copyChatgpt()}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1e3a5f] text-[14px] font-semibold text-white"
              >
                ✨ Préparer pour ChatGPT (copier)
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void downloadZip()}
                className="flex h-11 w-full items-center justify-center rounded-xl text-[13px] font-medium text-[#1e3a5f] hover:underline"
              >
                Télécharger ZIP (PDF + JSON + photos)
              </button>
            </div>
            {chatgptPreview ? (
              <textarea
                readOnly
                rows={6}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono text-[10px]"
                value={chatgptPreview.slice(0, 3500) + (chatgptPreview.length > 3500 ? "\n…" : "")}
              />
            ) : null}
            <p className="mt-3 text-[12px] text-slate-500">
              Ensuite : collez dans ChatGPT → récupérez un JSON{" "}
              <code>bework_quote_bundle_v1</code> → importez-le dans Devis
              (pas ce prompt, pas le compte rendu de visite).
            </p>
          </div>
        </div>
      ) : null}

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.url}
              alt={lightbox.caption}
              className="max-h-[80vh] rounded-xl object-contain"
            />
            <p className="mt-2 text-center text-[13px] text-white">{lightbox.caption}</p>
            <button
              type="button"
              className="mx-auto mt-2 block text-[13px] text-white/80 underline"
              onClick={() => setLightbox(null)}
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
