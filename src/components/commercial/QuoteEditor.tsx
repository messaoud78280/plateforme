"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  COMMERCIAL_QUOTE_STATUS_LABELS,
  roundMoney,
} from "@/lib/commercial/money";
import {
  badgeClassForTone,
  DEVIS_STATUS_TONE,
} from "@/lib/design-system/semantic-colors";
import { cn } from "@/lib/cn";
import { QuoteAcceptedNextSteps } from "@/components/commercial/QuoteAcceptedNextSteps";
import { ProgressStatementsPanel } from "@/components/commercial/ProgressStatementsPanel";
import { QuoteRetentionPanel } from "@/components/commercial/QuoteRetentionPanel";
import { QuoteDepositPanel } from "@/components/commercial/QuoteDepositPanel";
import { QuoteProrataPanel } from "@/components/commercial/QuoteProrataPanel";
import { LibraryPickerModal } from "@/components/commercial/LibraryPickerModal";
import { LineCompositionDrawer } from "@/components/commercial/LineCompositionDrawer";
import { QuotePriceCheckPanel } from "@/components/commercial/QuotePriceCheckPanel";
import { QuoteStatusActions } from "@/components/commercial/QuoteStatusActions";
import { QuoteIssuanceCheckPanel } from "@/components/commercial/QuoteIssuanceCheckPanel";
import { QuotePaymentScheduleBlock } from "@/components/commercial/QuotePaymentScheduleBlock";
import type { QuoteActionDef } from "@/lib/commercial/quote-actions";
import { shouldOfferPriceCheck } from "@/lib/commercial/price-check-ui";
import {
  scheduleFromDepositPercent,
  type PaymentSchedule,
  parsePaymentSchedule,
} from "@/lib/commercial/payment-schedule";

function fmtMoney(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

type IssuerSnapshot = {
  name?: string | null;
  tradeName?: string | null;
  siret?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  zipCode?: string | null;
  postalCode?: string | null;
  logoPath?: string | null;
};

type ClientOrg = {
  id: string;
  name: string;
  tradeName: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  zipCode?: string | null;
  siret?: string | null;
};

type Line = {
  id: string;
  sectionId: string | null;
  kind: string;
  reference: string | null;
  designation: string;
  description?: string | null;
  quantity: number;
  unit: string;
  unitCostHt: number;
  unitSellHt: number;
  discountPercent: number;
  vatRate: number;
  lineSellHt: number;
  lineCostHt: number;
  sortOrder: number;
  isOptional: boolean;
  commercialWorkItemId?: string | null;
  compositionSnapshotJson?: unknown;
};

type Section = { id: string; title: string; sortOrder: number };

type QuoteDetail = {
  id: string;
  number: string;
  subject: string;
  status: string;
  issueDate?: string | Date | null;
  validityDate?: string | Date | null;
  paymentTerms?: string | null;
  clientNotes?: string | null;
  paymentScheduleJson?: PaymentSchedule | null;
  depositPercent?: number | null;
  issuerSnapshotJson?: IssuerSnapshot | null;
  clientSnapshotJson?: IssuerSnapshot | null;
  siteAddressSnapshot?: string | null;
  totalCostHt: number;
  totalSellHt: number;
  totalVat: number;
  totalTtc: number;
  marginAmount: number;
  marginPercent: number;
  currentVersion: {
    id: string;
    versionNumber: number;
    lockState: string;
    sections: Section[];
    lines: Line[];
  } | null;
  versions?: Array<{
    id: string;
    versionNumber: number;
    label: string | null;
    lockState: string;
  }>;
  clientExternalOrg: ClientOrg | null;
  project: { id: string; title: string } | null;
};

type ClientOption = { id: string; name: string; tradeName: string | null };
type ProjectOption = { id: string; title: string };

type MetaDraft = {
  subject: string;
  paymentTerms: string;
  clientNotes: string;
  paymentScheduleJson: PaymentSchedule | null;
  validityDate: string;
  clientExternalOrgId: string | null;
  projectId: string | null;
};

function metaFromQuote(q: QuoteDetail): MetaDraft {
  return {
    subject: q.subject ?? "",
    paymentTerms: q.paymentTerms ?? "",
    clientNotes: q.clientNotes ?? "",
    paymentScheduleJson: parsePaymentSchedule(q.paymentScheduleJson) ?? q.paymentScheduleJson ?? null,
    validityDate: toDateInputValue(q.validityDate),
    clientExternalOrgId: q.clientExternalOrg?.id ?? null,
    projectId: q.project?.id ?? null,
  };
}

function snapshotAddress(s: IssuerSnapshot | null | undefined): string[] {
  if (!s) return [];
  const lines: string[] = [];
  const addr = s.addressLine1 || s.address;
  if (addr) lines.push(addr);
  if (s.addressLine2) lines.push(s.addressLine2);
  const city = [s.postalCode || s.zipCode, s.city].filter(Boolean).join(" ");
  if (city) lines.push(city);
  return lines;
}

export function QuoteEditor({
  initial,
  canEdit,
  acceptedPdfAvailable = false,
  minMarginPercent = 15,
}: {
  initial: QuoteDetail;
  canEdit: boolean;
  acceptedPdfAvailable?: boolean;
  /** Seuil d’alerte marge (taux de marque). Défaut 15 % si réglages non passés. */
  minMarginPercent?: number;
}) {
  const router = useRouter();
  const [quote, setQuote] = useState(initial);
  const [meta, setMeta] = useState<MetaDraft>(() => metaFromQuote(initial));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [busyStatus, setBusyStatus] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [librarySectionId, setLibrarySectionId] = useState<string | null>(null);
  const [compositionLine, setCompositionLine] = useState<Line | null>(null);
  const [priceCheckOpen, setPriceCheckOpen] = useState(false);
  const [issuanceOpen, setIssuanceOpen] = useState(false);
  const [pendingEmitStatus, setPendingEmitStatus] = useState<string | null>(null);
  const [priceCheckSessionBadge, setPriceCheckSessionBadge] = useState<string | null>(null);
  const [marginOpen, setMarginOpen] = useState(false);
  const [addMenuFor, setAddMenuFor] = useState<string | null>(null);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientCreating, setClientCreating] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const mutationSeq = useRef(0);
  const metaSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const metaDirty = useRef(false);
  const metaRef = useRef(meta);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    metaRef.current = meta;
  }, [meta]);

  useEffect(() => {
    if (quote.number) document.title = `${quote.number} — BeWork`;
  }, [quote.number]);

  const version = quote.currentVersion;
  const lines = version?.lines ?? [];
  const sections = useMemo(
    () => [...(version?.sections ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [version?.sections],
  );

  const issuer = (quote.issuerSnapshotJson ?? null) as IssuerSnapshot | null;
  const clientSnap = (quote.clientSnapshotJson ?? null) as IssuerSnapshot | null;
  const depositPct =
    quote.depositPercent != null && Number.isFinite(Number(quote.depositPercent))
      ? Number(quote.depositPercent)
      : 0;

  const refreshQuote = useCallback(
    async (seq?: number) => {
      const detail = await fetch(`/api/commercial/quotes/${quote.id}`).then((r) => r.json());
      if (seq != null && seq !== mutationSeq.current) return;
      if (detail.quote) {
        setQuote(detail.quote);
        if (!metaDirty.current) {
          setMeta(metaFromQuote(detail.quote));
        }
      }
    },
    [quote.id],
  );

  const patchMeta = useCallback(
    async (draft: MetaDraft, seq?: number) => {
      if (!canEdit) return;
      const runSeq = seq ?? ++mutationSeq.current;
      setSaveState("saving");
      setError(null);
      try {
        const res = await fetch(`/api/commercial/quotes/${quote.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: draft.subject,
            paymentTerms: draft.paymentTerms || null,
            clientNotes: draft.clientNotes || null,
            paymentScheduleJson: draft.paymentScheduleJson,
            validityDate: draft.validityDate || null,
            clientExternalOrgId: draft.clientExternalOrgId,
            projectId: draft.projectId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        metaDirty.current = false;
        await refreshQuote(runSeq);
        if (runSeq === mutationSeq.current) setSaveState("saved");
      } catch (e) {
        if (runSeq === mutationSeq.current) {
          setSaveState("error");
          setError(e instanceof Error ? e.message : "Erreur");
        }
      }
    },
    [canEdit, quote.id, refreshQuote],
  );

  const scheduleMetaSave = useCallback(
    (patch: Partial<MetaDraft> | ((prev: MetaDraft) => MetaDraft)) => {
      if (!canEdit) return;
      const prev = metaRef.current;
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      metaDirty.current = true;
      metaRef.current = next;
      setMeta(next);
      if (metaSaveTimer.current) clearTimeout(metaSaveTimer.current);
      metaSaveTimer.current = setTimeout(() => {
        void patchMeta(metaRef.current);
      }, 600);
    },
    [canEdit, patchMeta],
  );

  useEffect(() => {
    return () => {
      if (metaSaveTimer.current) clearTimeout(metaSaveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (saveState !== "saved") return;
    const t = setTimeout(() => setSaveState("idle"), 1500);
    return () => clearTimeout(t);
  }, [saveState]);

  useEffect(() => {
    if (!addMenuFor) return;
    const onDoc = (e: MouseEvent) => {
      if (addMenuRef.current?.contains(e.target as Node)) return;
      setAddMenuFor(null);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [addMenuFor]);

  const patchLine = useCallback(
    async (lineId: string, patch: Record<string, unknown>) => {
      if (!canEdit) return;
      const seq = ++mutationSeq.current;
      setSaveState("saving");
      setError(null);
      try {
        const res = await fetch(`/api/commercial/quotes/${quote.id}/lines/${lineId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        await refreshQuote(seq);
        if (seq === mutationSeq.current) setSaveState("saved");
      } catch (e) {
        if (seq === mutationSeq.current) {
          setSaveState("error");
          setError(e instanceof Error ? e.message : "Erreur");
        }
      }
    },
    [canEdit, quote.id, refreshQuote],
  );

  async function patchSectionTitle(sectionId: string, title: string) {
    if (!canEdit) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    const seq = ++mutationSeq.current;
    setSaveState("saving");
    setError(null);
    try {
      const res = await fetch(`/api/commercial/quotes/${quote.id}/sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, title: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      await refreshQuote(seq);
      if (seq === mutationSeq.current) setSaveState("saved");
    } catch (e) {
      if (seq === mutationSeq.current) {
        setSaveState("error");
        setError(e instanceof Error ? e.message : "Erreur");
      }
    }
  }

  async function addSection(title?: string) {
    const t = title ?? prompt("Titre du chapitre", "Nouveau chapitre");
    if (!t?.trim()) return;
    const seq = ++mutationSeq.current;
    setSaveState("saving");
    const res = await fetch(`/api/commercial/quotes/${quote.id}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (seq === mutationSeq.current) {
        setSaveState("error");
        setError(data.error || "Erreur");
      }
      return;
    }
    await refreshQuote(seq);
    if (seq === mutationSeq.current) setSaveState("saved");
  }

  async function addLine(
    sectionId: string | null,
    opts?: { kind?: string; designation?: string; isOptional?: boolean },
  ) {
    const seq = ++mutationSeq.current;
    setSaveState("saving");
    const kind = opts?.kind ?? "WORK";
    const res = await fetch(`/api/commercial/quotes/${quote.id}/lines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId,
        kind,
        designation:
          opts?.designation ??
          (kind === "COMMENT"
            ? "Commentaire"
            : kind === "OPTION"
              ? "Option"
              : kind === "SUBTOTAL"
                ? "Sous-total"
                : "Nouvelle ligne"),
        quantity: kind === "COMMENT" || kind === "SUBTOTAL" ? 0 : 1,
        unit: "U",
        unitSellHt: 0,
        isOptional: opts?.isOptional ?? kind === "OPTION",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (seq === mutationSeq.current) {
        setSaveState("error");
        setError(data.error || "Erreur");
      }
      return;
    }
    await refreshQuote(seq);
    if (seq === mutationSeq.current) setSaveState("saved");
  }

  async function handleStatusAction(action: QuoteActionDef) {
    if (action.id === "preview_pdf") {
      window.open(`/api/commercial/quotes/${quote.id}/pdf`, "_blank", "noreferrer");
      return;
    }
    if (action.id === "accepted_pdf") {
      window.open(
        `/api/commercial/quotes/${quote.id}/accepted-pdf`,
        "_blank",
        "noreferrer",
      );
      return;
    }
    if (action.id === "price_check") {
      if (shouldOfferPriceCheck(quote.status)) setPriceCheckOpen(true);
      return;
    }
    if (action.id === "new_version") {
      void createNewVersion();
      return;
    }
    if (action.id === "prepare_invoice") {
      router.push(`/dashboard/devis-facturation/factures/preparer?quoteId=${quote.id}`);
      return;
    }
    if (action.id === "link_project") {
      document
        .getElementById("quote-accepted-next-steps")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action.toStatus) {
      if (action.destructive) {
        const ok = window.confirm(
          action.id === "refuse"
            ? "Marquer ce devis comme refusé ?"
            : "Annuler ce devis ? Il ne sera plus modifiable comme un brouillon actif.",
        );
        if (!ok) return;
      }
      if (action.id === "accept") {
        const ok = window.confirm(
          "Accepter ce devis ? Le PDF de la version courante sera figé. Cette action est irréversible sur le document accepté.",
        );
        if (!ok) return;
      }
      if (action.id === "validate" || action.id === "mark_sent") {
        setPendingEmitStatus(action.toStatus);
        setIssuanceOpen(true);
        return;
      }
      void setStatus(action.toStatus);
    }
  }

  async function duplicateLine(line: Line) {
    if (!canEdit) return;
    const seq = ++mutationSeq.current;
    setSaveState("saving");
    setError(null);
    const res = await fetch(`/api/commercial/quotes/${quote.id}/lines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId: line.sectionId,
        kind: line.kind,
        reference: line.reference,
        designation: line.designation,
        description: line.description ?? null,
        quantity: line.quantity,
        unit: line.unit,
        unitCostHt: line.unitCostHt,
        unitSellHt: line.unitSellHt,
        discountPercent: line.discountPercent,
        vatRate: line.vatRate,
        commercialWorkItemId: line.commercialWorkItemId ?? null,
        compositionSnapshotJson: line.compositionSnapshotJson ?? undefined,
        isOptional: line.isOptional,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (seq === mutationSeq.current) {
        setSaveState("error");
        setError(data.error || "Erreur");
      }
      return;
    }
    await refreshQuote(seq);
    if (seq === mutationSeq.current) setSaveState("saved");
  }

  async function deleteLine(lineId: string) {
    if (!confirm("Supprimer cette ligne ?")) return;
    const seq = ++mutationSeq.current;
    setSaveState("saving");
    const res = await fetch(`/api/commercial/quotes/${quote.id}/lines/${lineId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      if (seq === mutationSeq.current) {
        setSaveState("error");
        setError(data.error || "Erreur");
      }
      return;
    }
    await refreshQuote(seq);
    if (seq === mutationSeq.current) setSaveState("saved");
  }

  async function setStatus(toStatus: string) {
    if (busyStatus) return;
    setBusyStatus(true);
    if (toStatus === "ACCEPTED") setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/quotes/${quote.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (data.pdfArchiveError) {
        setError(`Devis accepté — archivage PDF à finaliser : ${data.pdfArchiveError}`);
      }
      const detail = await fetch(`/api/commercial/quotes/${quote.id}`).then((r) => r.json());
      if (detail.quote) {
        setQuote(detail.quote);
        setMeta(metaFromQuote(detail.quote));
        metaDirty.current = false;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyStatus(false);
      setAccepting(false);
    }
  }

  async function createNewVersion() {
    if (
      !confirm(
        "Créer une nouvelle version brouillon ? La version actuelle reste figée.",
      )
    ) {
      return;
    }
    setBusyStatus(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "newVersion" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const detail = await fetch(`/api/commercial/quotes/${quote.id}`).then((r) => r.json());
      if (detail.quote) {
        setQuote(detail.quote);
        setMeta(metaFromQuote(detail.quote));
        metaDirty.current = false;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyStatus(false);
    }
  }

  async function openClientPicker() {
    if (!canEdit) return;
    setClientPickerOpen(true);
    setClientSearch("");
    try {
      const res = await fetch("/api/commercial/clients");
      const data = await res.json();
      setClients(Array.isArray(data.clients) ? data.clients : []);
    } catch {
      setClients([]);
    }
  }

  async function selectClient(c: ClientOption) {
    setClientPickerOpen(false);
    scheduleMetaSave({ clientExternalOrgId: c.id });
    setQuote((q) => ({
      ...q,
      clientExternalOrg: {
        id: c.id,
        name: c.name,
        tradeName: c.tradeName,
      },
    }));
  }

  async function createClientQuick() {
    const name = newClientName.trim();
    if (!name || clientCreating) return;
    setClientCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const created = data.client as ClientOption;
      setNewClientName("");
      await selectClient(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setClientCreating(false);
    }
  }

  async function openProjectPicker() {
    if (!canEdit) return;
    setProjectPickerOpen(true);
    try {
      const res = await fetch("/api/projets");
      const data = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data.projects) ? data.projects : [];
      setProjects(
        list.map((p: { id: string; title: string }) => ({
          id: p.id,
          title: p.title,
        })),
      );
    } catch {
      setProjects([]);
    }
  }

  function selectProject(p: ProjectOption | null) {
    setProjectPickerOpen(false);
    scheduleMetaSave({ projectId: p?.id ?? null });
    setQuote((q) => ({
      ...q,
      project: p ? { id: p.id, title: p.title } : null,
    }));
  }

  function initScheduleFromDeposit() {
    if (!canEdit || depositPct <= 0) return;
    scheduleMetaSave({
      paymentScheduleJson: scheduleFromDepositPercent(depositPct),
    });
  }

  function openAddMenu(key: string) {
    setAddMenuFor((cur) => (cur === key ? null : key));
  }

  function runAddAction(
    action:
      | "library"
      | "free"
      | "section"
      | "comment"
      | "option"
      | "subtotal",
  ) {
    const key = addMenuFor;
    setAddMenuFor(null);
    const secId =
      key && key !== "__footer__"
        ? key
        : sections[0]?.id ?? null;
    if (action === "library") {
      setLibrarySectionId(secId);
      setLibraryOpen(true);
      return;
    }
    if (action === "section") {
      void addSection();
      return;
    }
    if (action === "free") {
      void addLine(secId, { kind: "WORK" });
      return;
    }
    if (action === "comment") {
      void addLine(secId, { kind: "COMMENT" });
      return;
    }
    if (action === "option") {
      void addLine(secId, { kind: "OPTION", isOptional: true });
      return;
    }
    if (action === "subtotal") {
      void addLine(secId, { kind: "SUBTOTAL" });
    }
  }

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.tradeName ?? "").toLowerCase().includes(q),
    );
  }, [clients, clientSearch]);

  const clientDisplay =
    quote.clientExternalOrg?.tradeName ||
    quote.clientExternalOrg?.name ||
    clientSnap?.tradeName ||
    clientSnap?.name ||
    null;

  const saveLabel =
    saveState === "saving"
      ? "Enregistrement…"
      : saveState === "saved"
        ? "Enregistré"
        : saveState === "error"
          ? "Erreur"
          : "";

  const showInitSchedule =
    canEdit &&
    meta.paymentScheduleJson == null &&
    depositPct > 0;

  return (
    <div className="relative pb-24">
      {/* Barre sticky */}
      <div className="sticky top-12 z-30 -mx-1 mb-4 border-b border-slate-200/80 bg-white/95 px-1 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                badgeClassForTone(
                  DEVIS_STATUS_TONE[quote.status] ?? "neutral",
                ),
              )}
            >
              {COMMERCIAL_QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
            </span>
            {saveLabel ? (
              <span
                className={
                  saveState === "error"
                    ? "text-xs font-medium text-red-600"
                    : saveState === "saving"
                      ? "text-xs font-medium text-slate-500"
                      : "text-xs font-medium text-emerald-700"
                }
              >
                {saveLabel}
              </span>
            ) : null}
            {priceCheckSessionBadge ? (
              <span className="text-[10px] font-medium text-slate-500">
                Prix · {priceCheckSessionBadge}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMarginOpen((v) => !v)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {marginOpen ? "Fermer marge" : "Analyse marge"}
            </button>
            <QuoteStatusActions
              status={quote.status}
              canEdit={canEdit}
              hasAcceptedPdf={acceptedPdfAvailable}
              hasProject={Boolean(quote.project)}
              busy={busyStatus || accepting}
              onAction={(a) => void handleStatusAction(a)}
            />
          </div>
        </div>
      </div>

      {error ? (
        <p className="mx-auto mb-3 max-w-[1500px] text-sm text-red-700">{error}</p>
      ) : null}

      {!canEdit ? (
        <p className="mx-auto mb-3 max-w-[1500px] rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          {version?.lockState && version.lockState !== "DRAFT"
            ? "Version figée — utilisez « Nouvelle version » (menu •••) ou un avenant. Ne modifiez jamais silencieusement une version envoyée ou acceptée."
            : "Document non modifiable dans cet état — créez une nouvelle version ou un avenant si besoin."}
        </p>
      ) : null}

      {/* Document */}
      <div className="mx-auto max-w-[1500px]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Émetteur ↔ Client */}
          <div className="grid gap-6 border-b border-slate-100 px-5 py-6 sm:grid-cols-2 sm:px-8">
            <div className="space-y-1 text-sm text-slate-700">
              {issuer?.logoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={issuer.logoPath}
                  alt=""
                  className="mb-2 h-10 w-auto object-contain"
                />
              ) : null}
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Émetteur
              </p>
              <p className="font-bold text-[#1e3a5f]">
                {issuer?.tradeName || issuer?.name || "—"}
              </p>
              {issuer?.siret ? (
                <p className="text-xs text-slate-500">SIRET {issuer.siret}</p>
              ) : null}
              {snapshotAddress(issuer).map((l) => (
                <p key={l} className="text-xs text-slate-600">
                  {l}
                </p>
              ))}
              {issuer?.email ? (
                <p className="text-xs text-slate-600">{issuer.email}</p>
              ) : null}
              {issuer?.phone ? (
                <p className="text-xs text-slate-600">{issuer.phone}</p>
              ) : null}
            </div>

            <div className="space-y-1 text-sm text-slate-700 sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Client
              </p>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => void openClientPicker()}
                  className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-left hover:border-[#1e3a5f] hover:bg-slate-50 sm:text-right"
                >
                  <p className="font-bold text-[#1e3a5f]">
                    {clientDisplay || "Sélectionner un client"}
                  </p>
                  {quote.clientExternalOrg?.siret || clientSnap?.siret ? (
                    <p className="text-xs text-slate-500">
                      SIRET {quote.clientExternalOrg?.siret || clientSnap?.siret}
                    </p>
                  ) : null}
                  {(quote.clientExternalOrg?.address ||
                    clientSnap?.addressLine1 ||
                    clientSnap?.address) && (
                    <p className="text-xs text-slate-600">
                      {quote.clientExternalOrg?.address ||
                        clientSnap?.addressLine1 ||
                        clientSnap?.address}
                    </p>
                  )}
                  {(quote.clientExternalOrg?.city || clientSnap?.city) && (
                    <p className="text-xs text-slate-600">
                      {[
                        quote.clientExternalOrg?.zipCode ||
                          clientSnap?.postalCode ||
                          clientSnap?.zipCode,
                        quote.clientExternalOrg?.city || clientSnap?.city,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] font-semibold text-[#1d4ed8]">
                    Changer le client
                  </p>
                </button>
              ) : (
                <>
                  <p className="font-bold text-[#1e3a5f]">
                    {clientDisplay || "Client à préciser"}
                  </p>
                  {snapshotAddress(clientSnap).map((l) => (
                    <p key={l} className="text-xs text-slate-600">
                      {l}
                    </p>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Métadonnées document */}
          <div className="space-y-4 border-b border-slate-100 px-5 py-5 sm:px-8">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Objet
              </label>
              {canEdit ? (
                <input
                  value={meta.subject}
                  onChange={(e) => scheduleMetaSave({ subject: e.target.value })}
                  className="mt-1 w-full border-0 border-b border-transparent bg-transparent text-xl font-extrabold text-slate-950 outline-none focus:border-[#1e3a5f]"
                  placeholder="Objet du devis"
                />
              ) : (
                <h1 className="mt-1 text-xl font-extrabold text-slate-950">
                  {meta.subject}
                </h1>
              )}
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">{quote.number}</span>
                {" — "}
                <span className="font-bold text-[#1e3a5f]">
                  V{version?.versionNumber ?? 1}
                </span>
                {version?.lockState && version.lockState !== "DRAFT"
                  ? ` · ${version.lockState === "ACCEPTED_SNAPSHOT" ? "figée" : "verrouillée"}`
                  : ""}
              </p>
              <p>
                Émission :{" "}
                <span className="font-medium text-slate-800">
                  {formatDisplayDate(quote.issueDate)}
                </span>
              </p>
              <div className="flex items-center gap-1.5">
                <span>Validité :</span>
                {canEdit ? (
                  <input
                    type="date"
                    value={meta.validityDate}
                    onChange={(e) =>
                      scheduleMetaSave({ validityDate: e.target.value })
                    }
                    className="rounded border border-slate-200 px-1.5 py-0.5 text-xs"
                  />
                ) : (
                  <span className="font-medium text-slate-800">
                    {formatDisplayDate(quote.validityDate)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span>Chantier :</span>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => void openProjectPicker()}
                    className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-[#1e3a5f] hover:bg-slate-100"
                  >
                    {quote.project?.title || "Lier un chantier"}
                  </button>
                ) : (
                  <span className="font-medium text-slate-800">
                    {quote.project?.title || "—"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Lignes */}
          <div className="px-2 py-2 sm:px-4">
            {/* En-tête table desktop */}
            <div className="mb-1 hidden grid-cols-[72px_minmax(0,1fr)_56px_48px_72px_48px_80px_56px] gap-1 border-b border-slate-100 px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 md:grid">
              <div>Réf</div>
              <div>Désignation</div>
              <div className="text-right">Qté</div>
              <div>Unité</div>
              <div className="text-right">PU HT</div>
              <div className="text-right">TVA</div>
              <div className="text-right">Total HT</div>
              <div />
            </div>

            {sections.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">
                Aucun chapitre. Ajoutez une section pour commencer.
              </p>
            ) : (
              sections.map((sec) => {
                const secLines = lines
                  .filter((l) => l.sectionId === sec.id)
                  .sort((a, b) => a.sortOrder - b.sortOrder);
                return (
                  <div key={sec.id} className="mb-3">
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50/90 px-3 py-2">
                      {canEdit ? (
                        <SectionTitleInput
                          title={sec.title}
                          onCommit={(t) => void patchSectionTitle(sec.id, t)}
                        />
                      ) : (
                        <h3 className="text-sm font-bold text-slate-900">{sec.title}</h3>
                      )}
                      {canEdit ? (
                        <div
                          className="relative"
                          ref={addMenuFor === sec.id ? addMenuRef : undefined}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddMenu(sec.id);
                            }}
                            className="text-[11px] font-semibold text-[#1d4ed8]"
                          >
                            + Ajouter
                          </button>
                          {addMenuFor === sec.id ? (
                            <AddMenu onSelect={runAddAction} />
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    {secLines.map((line) => (
                      <LineRow
                        key={line.id}
                        line={line}
                        canEdit={canEdit}
                        onPatch={(p) => void patchLine(line.id, p)}
                        onDelete={() => void deleteLine(line.id)}
                        onDuplicate={() => void duplicateLine(line)}
                        onOpenComposition={() => setCompositionLine(line)}
                      />
                    ))}
                  </div>
                );
              })
            )}

            {lines.some((l) => !l.sectionId) ? (
              <div className="mb-3">
                <div className="px-3 py-2 text-xs font-bold text-slate-500">
                  Sans chapitre
                </div>
                {lines
                  .filter((l) => !l.sectionId)
                  .map((line) => (
                    <LineRow
                      key={line.id}
                      line={line}
                      canEdit={canEdit}
                      onPatch={(p) => void patchLine(line.id, p)}
                      onDelete={() => void deleteLine(line.id)}
                      onDuplicate={() => void duplicateLine(line)}
                      onOpenComposition={() => setCompositionLine(line)}
                    />
                  ))}
              </div>
            ) : null}

            {canEdit ? (
              <div
                className="relative px-2 py-3"
                ref={addMenuFor === "__footer__" ? addMenuRef : undefined}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openAddMenu("__footer__");
                  }}
                  className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-[#1d4ed8] hover:border-[#1e3a5f] hover:bg-slate-50"
                >
                  + Ajouter
                </button>
                {addMenuFor === "__footer__" ? (
                  <AddMenu onSelect={runAddAction} />
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Échéancier + conditions */}
          <div className="space-y-5 border-t border-slate-100 px-5 py-6 sm:px-8">
            {showInitSchedule ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
                <p className="text-xs text-amber-900">
                  Aucun échéancier structuré — acompte historique {depositPct} %.
                </p>
                <button
                  type="button"
                  onClick={initScheduleFromDeposit}
                  className="rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1e3a5f] ring-1 ring-slate-200"
                >
                  Initialiser depuis l’acompte {depositPct} %
                </button>
              </div>
            ) : null}

            <QuotePaymentScheduleBlock
              schedule={meta.paymentScheduleJson}
              totalTtc={quote.totalTtc}
              canEdit={canEdit}
              onChange={(next) =>
                scheduleMetaSave({ paymentScheduleJson: next })
              }
            />

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Conditions complémentaires
              </label>
              <textarea
                disabled={!canEdit}
                value={meta.paymentTerms}
                onChange={(e) =>
                  scheduleMetaSave({ paymentTerms: e.target.value })
                }
                rows={3}
                placeholder="Délais, modalités particulières…"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Observations (client)
              </label>
              <textarea
                disabled={!canEdit}
                value={meta.clientNotes}
                onChange={(e) =>
                  scheduleMetaSave({ clientNotes: e.target.value })
                }
                rows={2}
                placeholder="Notes visibles sur le devis…"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Totaux + bon pour accord */}
          <div className="grid gap-6 border-t border-slate-100 px-5 py-6 sm:grid-cols-2 sm:px-8">
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Bon pour accord
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Date · Signature client · Cachet
              </p>
              <div className="mt-6 h-16 rounded-lg border border-slate-200 bg-white" />
              <p className="mt-2 text-[10px] text-slate-400">
                Emplacement figé sur le PDF — aperçu document.
              </p>
            </div>

            <div className="space-y-2 self-end">
              <TotRow label="Total HT" value={`${fmtMoney(quote.totalSellHt)} €`} />
              <TotRow label="TVA" value={`${fmtMoney(quote.totalVat)} €`} />
              <TotRow
                label="Total TTC"
                value={`${fmtMoney(quote.totalTtc)} €`}
                bold
              />
              <p className="pt-2 text-[10px] leading-relaxed text-slate-400">
                Mentions légales et mentions devis : générées sur le PDF depuis les
                réglages organisation — non éditables ici.
              </p>
            </div>
          </div>
        </article>

        {quote.status === "ACCEPTED" ? (
          <div className="mt-4 space-y-4">
            <div id="quote-accepted-next-steps">
              <QuoteAcceptedNextSteps
                quoteId={quote.id}
                subject={quote.subject}
                siteAddressSnapshot={quote.siteAddressSnapshot}
                project={quote.project}
              />
            </div>
            <QuoteRetentionPanel quoteId={quote.id} />
            <QuoteProrataPanel quoteId={quote.id} />
            <QuoteDepositPanel quoteId={quote.id} />
            <ProgressStatementsPanel quoteId={quote.id} />
            <AcceptedActions quoteId={quote.id} />
          </div>
        ) : null}
      </div>

      {/* Panneau marge collapsible */}
      {marginOpen ? (
        <>
          <button
            type="button"
            aria-label="Fermer analyse marge"
            className="fixed inset-0 z-40 bg-slate-900/20"
            onClick={() => setMarginOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Analyse marge
              </p>
              <button
                type="button"
                onClick={() => setMarginOpen(false)}
                className="text-xs font-semibold text-slate-500"
              >
                ✕
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-600">
              Version courante{" "}
              <span className="font-bold text-[#1e3a5f]">
                V{version?.versionNumber ?? 1}
              </span>
              {version?.lockState === "DRAFT" ? " · modifiable" : " · verrouillée"}
            </p>
            {(quote.versions?.length ?? 0) > 1 ? (
              <ul className="mb-4 space-y-1 border-b border-slate-100 pb-3 text-xs text-slate-600">
                {quote.versions!.map((v) => (
                  <li key={v.id} className="flex justify-between gap-2">
                    <span>
                      V{v.versionNumber}
                      {v.id === version?.id ? " · courante" : ""}
                    </span>
                    <span className="text-slate-400">{v.lockState}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="space-y-2">
              <TotRow label="Déboursé" value={`${fmtMoney(quote.totalCostHt)} €`} />
              <TotRow label="Marge" value={`${fmtMoney(quote.marginAmount)} €`} />
              <TotRow
                label="Taux de marque"
                value={`${fmtMoney(quote.marginPercent)} %`}
              />
            </div>
            {quote.marginPercent < minMarginPercent ? (
              <p className="mt-3 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
                Taux de marque inférieur à votre objectif ({minMarginPercent} %)
              </p>
            ) : null}
            <p className="mt-auto pt-6 text-[10px] leading-relaxed text-slate-400">
              Module Devis & Facturation — pas la bibliothèque Analyses.
            </p>
          </aside>
        </>
      ) : null}

      {/* Picker client */}
      {clientPickerOpen ? (
        <ModalShell title="Choisir un client" onClose={() => setClientPickerOpen(false)}>
          <input
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            placeholder="Rechercher…"
            className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            autoFocus
          />
          <ul className="max-h-56 space-y-1 overflow-y-auto">
            {filteredClients.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => void selectClient(c)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span className="font-semibold text-slate-900">
                    {c.tradeName || c.name}
                  </span>
                  {c.tradeName ? (
                    <span className="ml-2 text-xs text-slate-500">{c.name}</span>
                  ) : null}
                </button>
              </li>
            ))}
            {filteredClients.length === 0 ? (
              <li className="px-2 py-3 text-xs text-slate-500">Aucun client trouvé.</li>
            ) : null}
          </ul>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              + Ajouter un client
            </p>
            <div className="flex gap-2">
              <input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Nom du client"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={clientCreating || !newClientName.trim()}
                onClick={() => void createClientQuick()}
                className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                Créer
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {/* Picker chantier */}
      {projectPickerOpen ? (
        <ModalShell title="Lier un chantier" onClose={() => setProjectPickerOpen(false)}>
          <button
            type="button"
            onClick={() => selectProject(null)}
            className="mb-2 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
          >
            Aucun chantier
          </button>
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => selectProject(p)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span className="font-semibold text-slate-900">{p.title}</span>
                </button>
              </li>
            ))}
            {projects.length === 0 ? (
              <li className="px-2 py-3 text-xs text-slate-500">Aucun chantier.</li>
            ) : null}
          </ul>
        </ModalShell>
      ) : null}

      <LibraryPickerModal
        quoteId={quote.id}
        sectionId={librarySectionId ?? undefined}
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onAdded={() => {
          const seq = ++mutationSeq.current;
          void refreshQuote(seq).then(() => {
            if (seq === mutationSeq.current) setSaveState("saved");
          });
        }}
      />
      {compositionLine ? (
        <LineCompositionDrawer
          quoteId={quote.id}
          line={{
            id: compositionLine.id,
            designation: compositionLine.designation,
            compositionSnapshotJson: compositionLine.compositionSnapshotJson,
            unitSellHt: compositionLine.unitSellHt,
            unitCostHt: compositionLine.unitCostHt,
          }}
          canEdit={canEdit}
          onClose={() => setCompositionLine(null)}
          onSaved={() => {
            void refreshQuote();
          }}
        />
      ) : null}

      <QuotePriceCheckPanel
        open={priceCheckOpen}
        onClose={() => setPriceCheckOpen(false)}
        quoteId={quote.id}
        canEdit={canEdit}
        quoteStatus={quote.status}
        onSessionBadge={setPriceCheckSessionBadge}
        onRequestNewVersion={() => {
          setPriceCheckOpen(false);
          void createNewVersion();
        }}
        onApplied={() => {
          mutationSeq.current += 1;
          void refreshQuote(mutationSeq.current);
          router.refresh();
        }}
      />

      <QuoteIssuanceCheckPanel
        quoteId={quote.id}
        open={issuanceOpen}
        onClose={() => {
          setIssuanceOpen(false);
          setPendingEmitStatus(null);
        }}
        onDownloadDraft={() => {
          window.open(
            `/api/commercial/quotes/${quote.id}/pdf`,
            "_blank",
            "noreferrer",
          );
        }}
        onEmit={() => {
          const st = pendingEmitStatus;
          setIssuanceOpen(false);
          setPendingEmitStatus(null);
          if (st) void setStatus(st);
        }}
      />
    </div>
  );
}

function AddMenu({
  onSelect,
}: {
  onSelect: (
    action: "library" | "free" | "section" | "comment" | "option" | "subtotal",
  ) => void;
}) {
  const items: Array<{
    id: "library" | "free" | "section" | "comment" | "option" | "subtotal";
    label: string;
  }> = [
    { id: "library", label: "Ouvrage référentiel" },
    { id: "free", label: "Ligne libre" },
    { id: "section", label: "Section" },
    { id: "comment", label: "Commentaire" },
    { id: "option", label: "Option" },
    { id: "subtotal", label: "Sous-total" },
  ];
  return (
    <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onSelect(it.id)}
          className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Fermer"
        className="fixed inset-0 z-40 bg-slate-900/30"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-[#1e3a5f]">{title}</p>
          <button type="button" onClick={onClose} className="text-xs text-slate-500">
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

function TotRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span
        className={
          bold
            ? "font-bold tabular-nums text-[#1e3a5f]"
            : "tabular-nums text-slate-800"
        }
      >
        {value}
      </span>
    </div>
  );
}

function SectionTitleInput({
  title,
  onCommit,
}: {
  title: string;
  onCommit: (t: string) => void;
}) {
  const [value, setValue] = useState(title);
  useEffect(() => setValue(title), [title]);
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value.trim() && value.trim() !== title) onCommit(value);
      }}
      className="w-full min-w-0 flex-1 border-0 bg-transparent text-sm font-bold text-slate-900 outline-none focus:ring-0"
    />
  );
}

function LineRow({
  line,
  canEdit,
  onPatch,
  onDelete,
  onDuplicate,
  onOpenComposition,
}: {
  line: Line;
  canEdit: boolean;
  onPatch: (p: Record<string, unknown>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onOpenComposition: () => void;
}) {
  const [ref, setRef] = useState(line.reference ?? "");
  const [des, setDes] = useState(line.designation);
  const [desc, setDesc] = useState(line.description ?? "");
  const [qty, setQty] = useState(String(line.quantity));
  const [unit, setUnit] = useState(line.unit);
  const [pu, setPu] = useState(String(line.unitSellHt));
  const [vat, setVat] = useState(String(line.vatRate));
  const hasComposition = Boolean(
    line.compositionSnapshotJson || line.commercialWorkItemId,
  );
  const isSpecial =
    line.kind === "COMMENT" || line.kind === "SUBTOTAL" || line.kind === "OPTION";

  useEffect(() => {
    setRef(line.reference ?? "");
    setDes(line.designation);
    setDesc(line.description ?? "");
    setQty(String(line.quantity));
    setUnit(line.unit);
    setPu(String(line.unitSellHt));
    setVat(String(line.vatRate));
  }, [line]);

  function commit() {
    onPatch({
      reference: ref.trim() || null,
      designation: des,
      description: desc.trim() || null,
      quantity: Number(qty),
      unit,
      unitSellHt: Number(pu),
      vatRate: Number(vat),
    });
  }

  const inputClass =
    "w-full rounded border border-slate-200 px-2 py-1.5 text-sm disabled:bg-slate-50";

  return (
    <div
      className={`border-t border-slate-50 px-2 py-3 md:grid md:grid-cols-[72px_minmax(0,1fr)_56px_48px_72px_48px_80px_56px] md:items-start md:gap-1 md:px-2 md:py-2 ${
        line.kind === "COMMENT"
          ? "bg-slate-50/40 italic"
          : line.kind === "SUBTOTAL"
            ? "bg-slate-50/70 font-semibold"
            : line.isOptional || line.kind === "OPTION"
              ? "bg-amber-50/30"
              : ""
      }`}
    >
      {/* Mobile card labels */}
      <div className="space-y-2 md:contents">
        <div className="md:contents">
          <div className="flex items-center gap-2 md:block">
            <span className="w-14 shrink-0 text-[10px] font-bold uppercase text-slate-400 md:hidden">
              Réf
            </span>
            <input
              disabled={!canEdit || line.kind === "COMMENT" || line.kind === "SUBTOTAL"}
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              onBlur={commit}
              className={inputClass}
              placeholder="—"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-start gap-2 md:block">
              <span className="mt-2 w-14 shrink-0 text-[10px] font-bold uppercase text-slate-400 md:hidden">
                Désig.
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                {isSpecial && line.kind !== "OPTION" ? (
                  <span className="mr-1 text-[10px] font-bold uppercase text-slate-400">
                    {line.kind === "COMMENT"
                      ? "Commentaire"
                      : line.kind === "SUBTOTAL"
                        ? "Sous-total"
                        : ""}
                  </span>
                ) : null}
                {(line.isOptional || line.kind === "OPTION") && (
                  <span className="mr-1 text-[10px] font-bold uppercase text-amber-700">
                    Option
                  </span>
                )}
                <input
                  disabled={!canEdit}
                  value={des}
                  onChange={(e) => setDes(e.target.value)}
                  onBlur={commit}
                  className={inputClass}
                />
                {line.kind !== "COMMENT" && line.kind !== "SUBTOTAL" ? (
                  <input
                    disabled={!canEdit}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    onBlur={commit}
                    placeholder="Description"
                    className="w-full border-0 bg-transparent px-2 text-[11px] text-slate-500 outline-none placeholder:text-slate-300"
                  />
                ) : null}
                {hasComposition ? (
                  <button
                    type="button"
                    onClick={onOpenComposition}
                    className="text-[11px] font-semibold text-[#1d4ed8]"
                  >
                    Sous-détail
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {line.kind === "COMMENT" ? (
          <div className="hidden md:block md:col-span-5" />
        ) : (
          <>
            <div className="flex items-center gap-2 md:block">
              <span className="w-14 shrink-0 text-[10px] font-bold uppercase text-slate-400 md:hidden">
                Qté
              </span>
              <input
                disabled={!canEdit || line.kind === "SUBTOTAL"}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                onBlur={commit}
                className={`${inputClass} text-right`}
              />
            </div>
            <div className="flex items-center gap-2 md:block">
              <span className="w-14 shrink-0 text-[10px] font-bold uppercase text-slate-400 md:hidden">
                Unité
              </span>
              <input
                disabled={!canEdit || line.kind === "SUBTOTAL"}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                onBlur={commit}
                className={inputClass}
              />
            </div>
            <div className="flex items-center gap-2 md:block">
              <span className="w-14 shrink-0 text-[10px] font-bold uppercase text-slate-400 md:hidden">
                PU HT
              </span>
              <input
                disabled={!canEdit || line.kind === "SUBTOTAL"}
                value={pu}
                onChange={(e) => setPu(e.target.value)}
                onBlur={commit}
                className={`${inputClass} text-right`}
              />
            </div>
            <div className="flex items-center gap-2 md:block">
              <span className="w-14 shrink-0 text-[10px] font-bold uppercase text-slate-400 md:hidden">
                TVA %
              </span>
              <input
                disabled={!canEdit || line.kind === "SUBTOTAL"}
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                onBlur={commit}
                className={`${inputClass} text-right`}
              />
            </div>
            <div className="flex items-center justify-between gap-2 md:justify-end md:pt-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 md:hidden">
                Total HT
              </span>
              <div className="tabular-nums text-sm font-semibold text-slate-800">
                {fmtMoney(line.lineSellHt)} €
              </div>
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1 md:justify-end md:pt-1.5">
          {canEdit ? (
            <>
              <button
                type="button"
                onClick={onDuplicate}
                title="Dupliquer"
                className="text-[11px] font-semibold text-slate-600"
              >
                Dupliquer
              </button>
              <button type="button" onClick={onDelete} className="text-xs text-red-600">
                ✕
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AcceptedActions({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function createInvoice(
    body: Record<string, unknown>,
    confirmLabel: string,
  ) {
    if (!confirm(confirmLabel)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/commercial/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(`/dashboard/devis-facturation/factures/${data.invoice.id}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function createDeposit() {
    await createInvoice(
      { type: "DEPOSIT", quoteId, issue: false },
      "Créer un brouillon de facture d’acompte depuis l’échéancier du devis (ou % historique) ?",
    );
  }

  async function createProgress() {
    await createInvoice(
      {
        type: "PROGRESS",
        quoteId,
        fromQuote: true,
        useSchedule: true,
        issue: false,
      },
      "Créer un brouillon de situation depuis l’échéance PROGRESS de l’échéancier ?",
    );
  }

  async function createFinal() {
    await createInvoice(
      {
        type: "FINAL",
        quoteId,
        fromQuote: true,
        useRemaining: true,
        issue: false,
      },
      "Créer un brouillon de solde pour le reste à facturer ?",
    );
  }

  async function createAmendment() {
    const subject = prompt("Objet de l’avenant", "Travaux supplémentaires");
    if (!subject) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/commercial/amendments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, subject }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(`/dashboard/devis-facturation/avenants/${data.amendment.id}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
      <p className="text-sm font-bold text-emerald-950">Facturer ce devis</p>
      <p className="mt-1 text-xs text-slate-600">
        Brouillon créé → contrôlez → émettez depuis la facture. Acompte pris sur
        l’échéancier structuré (ligne DEPOSIT) si présent.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void createDeposit()}
          className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          Facturer l’acompte
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void createProgress()}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
        >
          Facturer une situation
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void createFinal()}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
        >
          Facturer le solde
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void createAmendment()}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
        >
          Avenant
        </button>
        <a
          href={`/dashboard/devis-facturation/factures?quoteId=${quoteId}`}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
        >
          Factures liées
        </a>
      </div>
      {msg ? <p className="mt-2 text-xs text-red-700">{msg}</p> : null}
    </div>
  );
}
