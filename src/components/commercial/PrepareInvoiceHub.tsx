"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  FileText,
  MapPin,
  Receipt,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/lib/cn";
import { calculateDocumentTotals, calculateLine, roundMoney } from "@/lib/commercial/money";
import type { PrepareInvoiceSource } from "@/lib/commercial/prepare-invoice-hub";

type ClientOpt = {
  id: string;
  name: string;
  tradeName: string | null;
  city: string | null;
};

type ProjectOpt = {
  id: string;
  title: string;
};

const inputClass =
  "h-12 w-full rounded-[var(--cc-radius)] border border-bework-navy/15 bg-white px-3.5 text-[15px] text-bework-ink shadow-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-bework-muted/70 focus:border-bework-accent/45 focus:shadow-[var(--cc-focus-ring)]";

const labelClass =
  "text-[12px] font-semibold uppercase tracking-[0.06em] text-bework-navy/70";

type LineDraft = {
  designation: string;
  quantity: string;
  unit: string;
  unitSellHt: string;
  vatRate: string;
};

const emptyLine = (): LineDraft => ({
  designation: "",
  quantity: "1",
  unit: "U",
  unitSellHt: "",
  vatRate: "20",
});

export function PrepareInvoiceHub({
  sources,
  clients: initialClients,
  projects,
  defaultVatRate,
  defaultCurrency,
}: {
  sources: PrepareInvoiceSource[];
  clients: ClientOpt[];
  projects: ProjectOpt[];
  defaultVatRate: number;
  defaultCurrency: string;
}) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [mode, setMode] = useState<"context" | "direct">("context");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([
    { ...emptyLine(), vatRate: String(defaultVatRate) },
  ]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientBusy, setNewClientBusy] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clients.slice(0, 40);
    return clients
      .filter((c) =>
        [c.name, c.tradeName, c.city]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 40);
  }, [clients, clientQuery]);

  const selectedClient = clients.find((c) => c.id === clientId) ?? null;

  const totals = useMemo(() => {
    const prepared = lines
      .map((l) => {
        const quantity = Number(l.quantity);
        const unitSellHt = Number(l.unitSellHt);
        const vatRate = Number(l.vatRate || defaultVatRate);
        if (!l.designation.trim() || !Number.isFinite(quantity) || !Number.isFinite(unitSellHt)) {
          return null;
        }
        return calculateLine({
          kind: "WORK",
          quantity,
          unitSellHt,
          vatRate: Number.isFinite(vatRate) ? vatRate : defaultVatRate,
        });
      })
      .filter(Boolean) as ReturnType<typeof calculateLine>[];
    if (!prepared.length) {
      return { totalSellHt: 0, totalVat: 0, totalTtc: 0 };
    }
    return calculateDocumentTotals(
      prepared.map((p) => ({ ...p, includedInTotals: true })),
    );
  }, [lines, defaultVatRate]);

  const canCreateDirect =
    Boolean(subject.trim()) &&
    Boolean(clientId) &&
    lines.some(
      (l) =>
        l.designation.trim() &&
        Number(l.quantity) > 0 &&
        Number.isFinite(Number(l.unitSellHt)),
    );

  async function prepareAnnual(source: PrepareInvoiceSource) {
    if (source.kind !== "annual") return;
    if (source.meta.startsWith("Continuer") && source.href.startsWith("/dashboard")) {
      router.push(source.href);
      return;
    }
    setBusyId(source.id);
    setError(null);
    try {
      const res = await fetch(
        `/api/annual-contracts/interventions/${source.id}/prepare-invoice`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const href =
        typeof data.href === "string"
          ? data.href
          : `/dashboard/devis-facturation/factures/${data.invoiceId}`;
      router.push(href);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  async function invoiceSituation(source: PrepareInvoiceSource) {
    if (source.kind !== "situation") return;
    setBusyId(source.id);
    setError(null);
    try {
      const res = await fetch(
        `/api/commercial/progress-statements/${source.id}/invoice`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const id = data.invoice?.id;
      if (!id) throw new Error("Facture introuvable");
      router.push(`/dashboard/devis-facturation/factures/${id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  async function createClientQuick() {
    const name = newClientName.trim();
    if (!name) return;
    setNewClientBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const client = data.client as ClientOpt;
      setClients((prev) => {
        if (prev.some((c) => c.id === client.id)) return prev;
        return [...prev, client].sort((a, b) =>
          (a.tradeName || a.name).localeCompare(b.tradeName || b.name, "fr"),
        );
      });
      setClientId(client.id);
      setDrawerOpen(false);
      setNewClientName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setNewClientBusy(false);
    }
  }

  async function createDirectDraft() {
    if (!canCreateDirect) return;
    setCreateBusy(true);
    setError(null);
    try {
      const payloadLines = lines
        .filter((l) => l.designation.trim() && Number.isFinite(Number(l.unitSellHt)))
        .map((l) => ({
          designation: l.designation.trim(),
          quantity: Number(l.quantity) || 1,
          unit: l.unit.trim() || "U",
          unitSellHt: Number(l.unitSellHt),
          vatRate: Number(l.vatRate) || defaultVatRate,
        }));
      const res = await fetch("/api/commercial/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "STANDARD",
          subject: subject.trim(),
          clientExternalOrgId: clientId,
          projectId: projectId || null,
          dueDate: dueDate || null,
          lines: payloadLines,
          issue: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(`/dashboard/devis-facturation/factures/${data.invoice.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setCreateBusy(false);
    }
  }

  const toneFor = (kind: PrepareInvoiceSource["kind"]) => {
    if (kind === "situation") return "bw-surface-tinted-accent";
    if (kind === "annual") return "bw-surface-tinted-ok";
    return "bw-surface-tinted-watch";
  };

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5 pb-24 lg:pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/devis-facturation/factures"
          className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-sm font-medium text-bework-muted transition-colors hover:bg-bework-soft-accent hover:text-bework-navy"
        >
          <span aria-hidden>←</span>
          Liste des factures
        </Link>
        <p className="badge-cc badge-cc-info">Brouillon Commercial · validation humaine</p>
      </div>

      <header className="overflow-hidden rounded-2xl bw-surface-tinted-cyan px-5 py-5 shadow-[var(--cc-shadow)] sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-bework-cyan">
          Devis & Facturation
        </p>
        <h1 className="mt-1 text-[1.75rem] font-semibold tracking-tight text-bework-navy sm:text-[1.9rem]">
          Préparer une facture
        </h1>
        <p className="mt-1.5 max-w-2xl text-[0.9375rem] leading-relaxed text-bework-muted">
          Créez une facture client à partir d’un contexte existant ou directement.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("context")}
          className={cn("bw-chip", mode === "context" ? "bw-chip-active" : "bw-chip-idle")}
        >
          Depuis un contexte
        </button>
        <button
          type="button"
          onClick={() => setMode("direct")}
          className={cn("bw-chip", mode === "direct" ? "bw-chip-active" : "bw-chip-idle")}
        >
          Facture directe
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-bework-critical/20 bg-bework-soft-critical px-4 py-3 text-sm text-bework-critical">
          {error}
        </p>
      ) : null}

      {mode === "context" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.9fr)] lg:items-start">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-bework-accent" />
              <h2 className="text-[15px] font-bold text-bework-navy">
                Que souhaitez-vous facturer ?
              </h2>
            </div>

            {sources.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-bework-navy/15 bg-bework-soft-navy/40 px-5 py-10 text-center">
                <p className="text-sm font-medium text-bework-navy">
                  Aucun élément prêt à facturer pour le moment.
                </p>
                <p className="mt-1 text-[13px] text-bework-muted">
                  Validez une situation, terminez une intervention annuelle, ou passez en facture
                  directe.
                </p>
                <button
                  type="button"
                  className="btn-cc-primary mt-4"
                  onClick={() => setMode("direct")}
                >
                  Créer une facture directe
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {sources.map((s) => (
                  <li
                    key={`${s.kind}-${s.id}`}
                    className={cn(
                      "rounded-2xl p-4 shadow-[var(--cc-shadow)] transition-[box-shadow] duration-150 hover:shadow-[var(--cc-shadow-hover)]",
                      toneFor(s.kind),
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-bework-navy">{s.title}</p>
                        <p className="mt-0.5 text-[13px] text-bework-muted">
                          {[s.clientName, s.siteLabel].filter(Boolean).join(" · ") ||
                            "Contexte commercial"}
                        </p>
                        <p className="mt-2 text-[12px] font-medium text-bework-navy/80">{s.meta}</p>
                        <p className="mt-1 text-[14px] font-semibold tabular-nums text-bework-ink">
                          {s.amountLabel}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2">
                        {s.kind === "situation" ? (
                          <>
                            <button
                              type="button"
                              disabled={busyId === s.id}
                              onClick={() => void invoiceSituation(s)}
                              className="btn-cc-primary !min-h-10 !text-[13px]"
                            >
                              {busyId === s.id ? "…" : "Préparer →"}
                            </button>
                            <Link
                              href={s.href}
                              className="text-center text-[12px] font-semibold text-bework-accent hover:underline"
                            >
                              Voir la situation
                            </Link>
                          </>
                        ) : null}
                        {s.kind === "annual" ? (
                          <button
                            type="button"
                            disabled={busyId === s.id}
                            onClick={() => void prepareAnnual(s)}
                            className="btn-cc-primary !min-h-10 !text-[13px]"
                          >
                            {busyId === s.id ? "…" : "Préparer →"}
                          </button>
                        ) : null}
                        {s.kind === "followup" ? (
                          <Link href={s.href} className="btn-cc-primary !min-h-10 !text-[13px]">
                            Préparer →
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-20">
            <div className="rounded-2xl border border-bework-navy/15 bg-[linear-gradient(165deg,#132f4c_0%,#173b67_55%,#1e4d7a_100%)] p-5 text-white shadow-[var(--cc-shadow-hover)]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-300" />
                <h2 className="text-[15px] font-bold">Parcours</h2>
              </div>
              <ol className="mt-4 space-y-2.5 text-[13px] text-white/85">
                <li>1. Choisir le contexte à facturer</li>
                <li>2. Créer un brouillon CommercialInvoice</li>
                <li>3. Vérifier, puis émettre</li>
                <li>4. PDF · GED · paiement</li>
              </ol>
              <p className="mt-4 rounded-xl bg-white/10 px-3 py-2.5 text-[12px] leading-relaxed text-white/80">
                Aucun montant n’est inventé ici — les chiffres viennent des situations, contrats
                annuels ou lignes que vous saisissez.
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.9fr)] lg:items-start">
          <div className="space-y-4">
            <section className="rounded-2xl bw-surface-tinted-cyan p-5 shadow-[var(--cc-shadow)] sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="bw-icon-pill bw-icon-pill-cyan">
                  <UserRound className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[15px] font-bold text-bework-navy">Client *</h2>
                  <p className="text-[13px] text-bework-muted">Référentiel clients Commercial</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="min-w-0 flex-1">
                  <input
                    list="prepare-invoice-clients"
                    value={
                      selectedClient
                        ? selectedClient.tradeName || selectedClient.name
                        : clientQuery
                    }
                    onChange={(e) => {
                      setClientQuery(e.target.value);
                      setClientId("");
                      const match = clients.find(
                        (c) =>
                          (c.tradeName || c.name).toLowerCase() ===
                          e.target.value.trim().toLowerCase(),
                      );
                      if (match) setClientId(match.id);
                    }}
                    placeholder="Rechercher un client…"
                    className={inputClass}
                  />
                  <datalist id="prepare-invoice-clients">
                    {filteredClients.map((c) => (
                      <option key={c.id} value={c.tradeName || c.name} />
                    ))}
                  </datalist>
                </div>
                <button
                  type="button"
                  className="btn-cc-secondary shrink-0"
                  onClick={() => setDrawerOpen(true)}
                >
                  + Nouveau client
                </button>
              </div>
              {!clientId ? (
                <p className="mt-2 text-[12px] text-bework-watch">Sélectionnez un client pour continuer.</p>
              ) : null}
            </section>

            <section className="rounded-2xl bw-surface-tinted-accent p-5 shadow-[var(--cc-shadow)] sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="bw-icon-pill bw-icon-pill-accent">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[15px] font-bold text-bework-navy">Objet / libellé *</h2>
                </div>
              </div>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex. Prestations de maintenance — mars 2026"
                className={inputClass}
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className={labelClass}>Échéance</span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className={labelClass}>Chantier (optionnel)</span>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Aucun chantier</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-2xl bw-surface-tinted-violet p-5 shadow-[var(--cc-shadow)] sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="bw-icon-pill bw-icon-pill-violet">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[15px] font-bold text-bework-navy">Lignes de facture</h2>
                  <p className="text-[13px] text-bework-muted">
                    Calculs via le moteur Commercial (`calculateLine`).
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="grid gap-2 rounded-xl border border-bework-intel/15 bg-white/75 p-3 sm:grid-cols-12"
                  >
                    <input
                      className={cn(inputClass, "sm:col-span-5")}
                      placeholder="Désignation"
                      value={line.designation}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === idx ? { ...l, designation: e.target.value } : l,
                          ),
                        )
                      }
                    />
                    <input
                      className={cn(inputClass, "sm:col-span-2")}
                      placeholder="Qté"
                      value={line.quantity}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === idx ? { ...l, quantity: e.target.value } : l,
                          ),
                        )
                      }
                    />
                    <input
                      className={cn(inputClass, "sm:col-span-2")}
                      placeholder="PU HT"
                      value={line.unitSellHt}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === idx ? { ...l, unitSellHt: e.target.value } : l,
                          ),
                        )
                      }
                    />
                    <input
                      className={cn(inputClass, "sm:col-span-2")}
                      placeholder="TVA %"
                      value={line.vatRate}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === idx ? { ...l, vatRate: e.target.value } : l,
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      className="btn-cc-ghost sm:col-span-1"
                      onClick={() =>
                        setLines((prev) =>
                          prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx),
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-cc-secondary"
                  onClick={() =>
                    setLines((prev) => [
                      ...prev,
                      { ...emptyLine(), vatRate: String(defaultVatRate) },
                    ])
                  }
                >
                  + Ajouter une ligne
                </button>
              </div>
            </section>

            <div className="hidden space-y-2 lg:block">
              {!canCreateDirect ? (
                <p className="text-[13px] font-medium text-bework-watch">
                  {!clientId
                    ? "Sélectionnez un client pour continuer."
                    : !subject.trim()
                      ? "Renseignez l’objet de la facture."
                      : "Ajoutez au moins une ligne avec montant."}
                </p>
              ) : null}
              <button
                type="button"
                disabled={!canCreateDirect || createBusy}
                onClick={() => void createDirectDraft()}
                className="btn-cc-primary w-full !min-h-12 !text-[15px] disabled:opacity-45"
              >
                {createBusy ? "Création…" : "Créer le brouillon"}
              </button>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20">
            <div className="rounded-2xl border border-bework-navy/15 bg-[linear-gradient(165deg,#132f4c_0%,#173b67_55%,#1e4d7a_100%)] p-5 text-white shadow-[var(--cc-shadow-hover)]">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-sky-300" />
                <h2 className="text-[15px] font-bold">Résumé</h2>
              </div>
              <dl className="mt-4 space-y-3 text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-white/55">Total HT</dt>
                  <dd className="font-semibold tabular-nums">
                    {roundMoney(totals.totalSellHt, 2).toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    €
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/55">TVA</dt>
                  <dd className="font-semibold tabular-nums">
                    {roundMoney(totals.totalVat, 2).toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    €
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-white/15 pt-3">
                  <dt className="text-white/70">Total TTC</dt>
                  <dd className="text-base font-bold tabular-nums">
                    {roundMoney(totals.totalTtc, 2).toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    €
                  </dd>
                </div>
              </dl>
              <p className="mt-4 flex items-center gap-2 text-[12px] text-white/70">
                <CalendarDays className="h-3.5 w-3.5" />
                Devise {defaultCurrency} · TVA défaut {defaultVatRate} %
              </p>
              <p className="mt-3 rounded-xl bg-white/10 px-3 py-2.5 text-[12px] leading-relaxed text-white/80">
                Le brouillon pourra être vérifié puis émis. PDF, GED et paiement restent sur les
                parcours existants.
              </p>
            </div>
          </aside>
        </div>
      )}

      {mode === "direct" ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-bework-navy/10 bg-[color-mix(in_srgb,var(--bw-soft-navy)_35%,rgba(255,255,255,0.92))] px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            disabled={!canCreateDirect || createBusy}
            onClick={() => void createDirectDraft()}
            className="btn-cc-primary w-full !min-h-12 disabled:opacity-45"
          >
            {createBusy ? "Création…" : "Créer le brouillon"}
          </button>
        </div>
      ) : null}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Nouveau client"
        description="Raison sociale seule suffisante pour démarrer."
        footer={
          <div className="flex gap-2">
            <button type="button" className="btn-cc-secondary flex-1" onClick={() => setDrawerOpen(false)}>
              Annuler
            </button>
            <button
              type="button"
              className="btn-cc-primary flex-1"
              disabled={newClientBusy || !newClientName.trim()}
              onClick={() => void createClientQuick()}
            >
              {newClientBusy ? "…" : "Créer"}
            </button>
          </div>
        }
      >
        <div className="space-y-3 p-5">
          <label className="block space-y-1.5">
            <span className={labelClass}>Raison sociale *</span>
            <input
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className={inputClass}
              placeholder="Syndic Horizon Copro"
            />
          </label>
        </div>
      </Drawer>
    </div>
  );
}
