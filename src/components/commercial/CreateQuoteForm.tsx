"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  FileText,
  MapPin,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/lib/cn";

export type QuoteClientOpt = {
  id: string;
  name: string;
  tradeName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  zipCode: string | null;
  siret: string | null;
  primaryContact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    jobTitle: string | null;
  } | null;
};

export type QuoteProjectOpt = {
  id: string;
  title: string;
  siteAddress: string | null;
  siteCity: string | null;
  linkedClientIds?: string[];
};

const inputClass =
  "h-12 w-full rounded-[var(--cc-radius)] border border-bework-navy/15 bg-white px-3.5 text-[15px] text-bework-ink shadow-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-bework-muted/70 focus:border-bework-accent/45 focus:shadow-[var(--cc-focus-ring)]";

const labelClass = "text-[12px] font-semibold uppercase tracking-[0.06em] text-bework-navy/70";

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatFrDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysBetweenToday(iso: string) {
  if (!iso) return null;
  const target = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function SectionCard({
  tone,
  index,
  icon: Icon,
  title,
  hint,
  children,
}: {
  tone: "accent" | "cyan" | "ok" | "violet" | "watch";
  index: string;
  icon: typeof FileText;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  const toneMap = {
    accent: {
      surface: "bw-surface-tinted-accent",
      bar: "var(--cc-accent)",
      pill: "bw-icon-pill-accent",
    },
    cyan: {
      surface: "bw-surface-tinted-cyan",
      bar: "var(--cc-cyan)",
      pill: "bw-icon-pill-cyan",
    },
    ok: {
      surface: "bw-surface-tinted-ok",
      bar: "var(--cc-ok)",
      pill: "bw-icon-pill-ok",
    },
    violet: {
      surface: "bw-surface-tinted-violet",
      bar: "var(--cc-intel)",
      pill: "bw-icon-pill-violet",
    },
    watch: {
      surface: "bw-surface-tinted-watch",
      bar: "var(--cc-watch)",
      pill: "bw-icon-pill-watch",
    },
  }[tone];

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 shadow-[var(--cc-shadow)] transition-[box-shadow,transform] duration-180 hover:shadow-[var(--cc-shadow-hover)] sm:p-6",
        toneMap.surface,
      )}
      style={{ ["--bw-card-tone" as string]: toneMap.bar }}
    >
      <span
        className="pointer-events-none absolute -right-1 top-3 select-none text-[3.5rem] font-semibold leading-none text-bework-navy/[0.06]"
        aria-hidden
      >
        {index}
      </span>
      <div className="relative mb-4 flex items-start gap-3">
        <span className={cn("bw-icon-pill", toneMap.pill)}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-tight text-bework-navy">{title}</h2>
          <p className="mt-0.5 text-[13px] text-bework-muted">{hint}</p>
        </div>
      </div>
      <div className="relative space-y-4">{children}</div>
    </section>
  );
}

export function CreateQuoteForm({
  clients: initialClients,
  projects,
  defaultValidityDays,
  defaultVatRate,
  defaultCurrency,
  defaultPaymentTerms,
  preparedByName,
}: {
  clients: QuoteClientOpt[];
  projects: QuoteProjectOpt[];
  defaultValidityDays?: number | null;
  defaultVatRate?: number;
  defaultCurrency?: string | null;
  defaultPaymentTerms?: string | null;
  preparedByName?: string | null;
}) {
  const router = useRouter();
  const validityDaysDefault =
    defaultValidityDays && defaultValidityDays > 0 ? defaultValidityDays : 30;

  const [clients, setClients] = useState(initialClients);
  const [subject, setSubject] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [manualSiteAddress, setManualSiteAddress] = useState("");
  const [validityDays, setValidityDays] = useState(validityDaysDefault);
  const [validityDate, setValidityDate] = useState(() => addDaysIso(validityDaysDefault));
  const [paymentTerms, setPaymentTerms] = useState(defaultPaymentTerms ?? "");
  const [internalNotes, setInternalNotes] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [depositPercent, setDepositPercent] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newClientBusy, setNewClientBusy] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    zipCode: "",
    city: "",
    siret: "",
    moreOpen: false,
  });

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId) ?? null,
    [clients, clientId],
  );

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clients.slice(0, 40);
    return clients
      .filter((c) => {
        const hay = [
          c.name,
          c.tradeName,
          c.city,
          c.email,
          c.phone,
          c.primaryContact
            ? `${c.primaryContact.firstName} ${c.primaryContact.lastName}`
            : "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 40);
  }, [clients, clientQuery]);

  const prioritizedProjects = useMemo(() => {
    if (!clientId) return projects;
    const linked = projects.filter((p) => p.linkedClientIds?.includes(clientId));
    const others = projects.filter((p) => !p.linkedClientIds?.includes(clientId));
    return [...linked, ...others];
  }, [projects, clientId]);

  const preferredProjects = useMemo(
    () =>
      clientId
        ? prioritizedProjects.filter((p) => p.linkedClientIds?.includes(clientId))
        : [],
    [prioritizedProjects, clientId],
  );

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  );

  useEffect(() => {
    setValidityDate(addDaysIso(validityDays));
  }, [validityDays]);

  useEffect(() => {
    if (!clientMenuOpen) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("[data-client-picker]")) return;
      setClientMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [clientMenuOpen]);

  const computedDays = daysBetweenToday(validityDate);
  const canSubmit = Boolean(subject.trim()) && !busy;

  const missingHint = !subject.trim()
    ? "Renseignez l’objet du devis pour continuer."
    : null;

  async function createClient() {
    const name = newClient.name.trim();
    if (!name) return;
    setNewClientBusy(true);
    setError(null);
    try {
      const contactParts = newClient.contactName.trim().split(/\s+/).filter(Boolean);
      const contactFirstName = contactParts[0] ?? "";
      const contactLastName = contactParts.slice(1).join(" ");

      const res = await fetch("/api/commercial/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: newClient.email.trim() || null,
          phone: newClient.phone.trim() || null,
          address: newClient.address.trim() || null,
          zipCode: newClient.zipCode.trim() || null,
          city: newClient.city.trim() || null,
          siret: newClient.siret.trim() || null,
          contactFirstName: contactFirstName || null,
          contactLastName: contactLastName || null,
          contactEmail: newClient.email.trim() || null,
          contactPhone: newClient.phone.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur création client");
      const client = data.client as QuoteClientOpt;
      setClients((prev) => {
        if (prev.some((c) => c.id === client.id)) {
          return prev.map((c) => (c.id === client.id ? { ...c, ...client } : c));
        }
        return [...prev, client].sort((a, b) =>
          (a.tradeName || a.name).localeCompare(b.tradeName || b.name, "fr"),
        );
      });
      setClientId(client.id);
      setClientQuery("");
      setDrawerOpen(false);
      setNewClient({
        name: "",
        contactName: "",
        email: "",
        phone: "",
        address: "",
        zipCode: "",
        city: "",
        siret: "",
        moreOpen: false,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setNewClientBusy(false);
    }
  }

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const project = projects.find((p) => p.id === projectId);
      const siteFromProject = project
        ? [project.siteAddress, project.siteCity].filter(Boolean).join(", ")
        : null;
      const site =
        siteFromProject ||
        (manualSiteAddress.trim() ? manualSiteAddress.trim() : null);

      const res = await fetch("/api/commercial/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          clientExternalOrgId: clientId || null,
          projectId: projectId || null,
          siteAddressSnapshot: site,
          validityDate: validityDate || null,
          paymentTerms: paymentTerms.trim() || null,
          internalNotes: internalNotes.trim() || null,
          clientNotes: clientNotes.trim() || null,
          depositPercent: depositPercent.trim() ? Number(depositPercent) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(`/dashboard/devis-facturation/devis/${data.quote.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const summaryClient =
    selectedClient?.tradeName || selectedClient?.name || "À préciser";
  const summarySite = selectedProject
    ? selectedProject.title
    : manualSiteAddress.trim()
      ? manualSiteAddress.trim()
      : "Aucun chantier pour le moment";
  const contactLabel = selectedClient?.primaryContact
    ? `${selectedClient.primaryContact.firstName} ${selectedClient.primaryContact.lastName}`.trim()
    : null;

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5 pb-28 lg:pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/devis-facturation/devis"
          className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-sm font-medium text-bework-muted transition-colors hover:bg-bework-soft-accent hover:text-bework-navy"
        >
          <span aria-hidden>←</span>
          Liste des devis
        </Link>
        <p className="badge-cc badge-cc-info">Étape 1 sur 2 · Informations du devis</p>
      </div>

      <header className="overflow-hidden rounded-2xl bw-surface-tinted-cyan px-5 py-5 shadow-[var(--cc-shadow)] sm:px-6 sm:py-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-bework-cyan">
          Devis & Facturation
        </p>
        <h1 className="mt-1 text-[1.75rem] font-semibold tracking-tight text-bework-navy sm:text-[1.9rem]">
          Nouveau devis
        </h1>
        <p className="mt-1.5 max-w-2xl text-[0.9375rem] leading-relaxed text-bework-muted">
          Préparez les informations commerciales avant de passer au chiffrage.
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[12px] font-semibold text-bework-navy ring-1 ring-bework-cyan/20">
          <Sparkles className="h-3.5 w-3.5 text-bework-cyan" />
          Étape suivante : Chiffrage
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.95fr)] lg:items-start">
        <div className="space-y-4">
          <SectionCard
            tone="accent"
            index="01"
            icon={FileText}
            title="Informations du devis"
            hint="Objet clair pour le client et pour le suivi interne."
          >
            <label className="block space-y-1.5">
              <span className={labelClass}>Objet du devis *</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Réfection de l’étanchéité terrasse — Résidence Les Lilas"
                className={inputClass}
                autoFocus
              />
            </label>
          </SectionCard>

          <SectionCard
            tone="cyan"
            index="02"
            icon={UserRound}
            title="Client"
            hint="Sélectionnez un client existant ou créez-en un rapidement."
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <div className="relative min-w-0 flex-1" data-client-picker>
                <label className="block space-y-1.5">
                  <span className={labelClass}>Rechercher ou sélectionner un client</span>
                  <input
                    value={
                      clientMenuOpen
                        ? clientQuery
                        : selectedClient
                          ? selectedClient.tradeName || selectedClient.name
                          : clientQuery
                    }
                    onChange={(e) => {
                      setClientQuery(e.target.value);
                      setClientMenuOpen(true);
                      if (clientId) setClientId("");
                    }}
                    onFocus={() => {
                      setClientMenuOpen(true);
                      setClientQuery("");
                    }}
                    placeholder="Nom, ville, contact…"
                    className={inputClass}
                    autoComplete="off"
                  />
                </label>
                {clientMenuOpen ? (
                  <ul className="absolute z-20 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-bework-navy/12 bg-white py-1 shadow-[var(--cc-shadow-hover)]">
                    <li>
                      <button
                        type="button"
                        className="w-full px-3 py-2.5 text-left text-sm text-bework-muted hover:bg-bework-soft-navy"
                        onClick={() => {
                          setClientId("");
                          setClientQuery("");
                          setClientMenuOpen(false);
                          setProjectId("");
                        }}
                      >
                        — À préciser —
                      </button>
                    </li>
                    {filteredClients.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="w-full px-3 py-2.5 text-left hover:bg-bework-soft-cyan"
                          onClick={() => {
                            setClientId(c.id);
                            setClientQuery("");
                            setClientMenuOpen(false);
                            setProjectId("");
                          }}
                        >
                          <span className="block text-sm font-semibold text-bework-ink">
                            {c.tradeName || c.name}
                          </span>
                          <span className="block text-[12px] text-bework-muted">
                            {[c.city, c.email, c.phone].filter(Boolean).join(" · ") ||
                              "Coordonnées à compléter"}
                          </span>
                        </button>
                      </li>
                    ))}
                    {filteredClients.length === 0 ? (
                      <li className="px-3 py-3 text-sm text-bework-muted">Aucun client trouvé.</li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="btn-cc-secondary mt-0 shrink-0 sm:mt-7"
              >
                + Nouveau client
              </button>
            </div>

            {selectedClient ? (
              <div className="rounded-xl border border-bework-cyan/20 bg-white/80 px-4 py-3 shadow-sm transition-colors duration-150">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-bework-navy">
                      {selectedClient.tradeName || selectedClient.name}
                    </p>
                    {contactLabel ? (
                      <p className="mt-1 text-[13px] text-bework-ink">{contactLabel}</p>
                    ) : null}
                    <p className="mt-0.5 text-[13px] text-bework-muted">
                      {[
                        selectedClient.phone || selectedClient.primaryContact?.phone,
                        selectedClient.email || selectedClient.primaryContact?.email,
                        [selectedClient.zipCode, selectedClient.city].filter(Boolean).join(" "),
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Coordonnées à compléter ultérieurement"}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/devis-facturation/clients/${selectedClient.id}`}
                    className="text-[12px] font-semibold text-bework-accent hover:underline"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            ) : (
              <p className="rounded-lg bg-white/60 px-3 py-2 text-[13px] text-bework-muted">
                Client optionnel à cette étape — rattachement possible ensuite.
              </p>
            )}
          </SectionCard>

          <SectionCard
            tone="ok"
            index="03"
            icon={MapPin}
            title="Site / Chantier"
            hint="Rattachez un chantier existant ou indiquez seulement l’adresse d’intervention."
          >
            {preferredProjects.length > 0 ? (
              <div className="space-y-2">
                <p className={labelClass}>Chantiers liés à ce client</p>
                <div className="flex flex-wrap gap-2">
                  {preferredProjects.slice(0, 6).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProjectId(p.id);
                        setManualSiteAddress("");
                      }}
                      className={cn(
                        "bw-chip",
                        projectId === p.id ? "bw-chip-active" : "bw-chip-ok",
                      )}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <label className="block space-y-1.5">
              <span className={labelClass}>Choisir un chantier</span>
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  if (e.target.value) setManualSiteAddress("");
                }}
                className={inputClass}
              >
                <option value="">Aucun chantier pour le moment</option>
                {prioritizedProjects.map((p) => {
                  const preferred = Boolean(clientId && p.linkedClientIds?.includes(clientId));
                  return (
                    <option key={p.id} value={p.id}>
                      {preferred ? "★ " : ""}
                      {p.title}
                    </option>
                  );
                })}
              </select>
            </label>

            {!projectId ? (
              <label className="block space-y-1.5">
                <span className={labelClass}>Adresse du site</span>
                <input
                  value={manualSiteAddress}
                  onChange={(e) => setManualSiteAddress(e.target.value)}
                  placeholder="Adresse d’intervention (distincte de la facturation)"
                  className={inputClass}
                />
                <p className="text-[12px] text-bework-muted">
                  Aucun chantier fantôme n’est créé — l’adresse est enregistrée sur le devis.
                </p>
              </label>
            ) : selectedProject ? (
              <p className="rounded-lg bg-white/70 px-3 py-2 text-[13px] text-bework-muted">
                {[selectedProject.siteAddress, selectedProject.siteCity]
                  .filter(Boolean)
                  .join(", ") || "Adresse chantier non renseignée"}
              </p>
            ) : null}
          </SectionCard>

          <SectionCard
            tone="violet"
            index="04"
            icon={Wallet}
            title="Paramètres commerciaux"
            hint="Valeurs par défaut de votre organisation — ajustables ensuite."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className={labelClass}>Validité</span>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setValidityDays(d)}
                      className={cn(
                        "bw-chip flex-1 justify-center",
                        validityDays === d ? "bw-chip-active" : "bw-chip-violet",
                      )}
                    >
                      {d} j
                    </button>
                  ))}
                </div>
                <p className="pt-1 text-[13px] font-medium text-bework-navy">
                  Validité : {computedDays != null ? `${computedDays} jours` : `${validityDays} jours`}
                </p>
                <p className="text-[12px] text-bework-muted">
                  Jusqu’au {formatFrDate(validityDate)}
                </p>
              </label>

              <label className="block space-y-1.5">
                <span className={labelClass}>Date de fin de validité</span>
                <input
                  type="date"
                  value={validityDate}
                  onChange={(e) => {
                    setValidityDate(e.target.value);
                    const d = daysBetweenToday(e.target.value);
                    if (d != null && d > 0) setValidityDays(d);
                  }}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-bework-intel/15 bg-white/75 px-4 py-3">
                <p className={labelClass}>TVA par défaut</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-bework-navy">
                  {(defaultVatRate ?? 20).toLocaleString("fr-FR")} %
                </p>
                <p className="mt-1 text-[12px] text-bework-muted">
                  Modifiable ligne par ligne lors du chiffrage.
                </p>
              </div>
              <div className="rounded-xl border border-bework-intel/15 bg-white/75 px-4 py-3">
                <p className={labelClass}>Devise</p>
                <p className="mt-1 text-lg font-semibold text-bework-navy">
                  {(defaultCurrency || "EUR").toUpperCase()}
                </p>
                <p className="mt-1 text-[12px] text-bework-muted">Paramètre organisation.</p>
              </div>
            </div>

            {preparedByName ? (
              <div className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2.5 text-[13px] text-bework-muted">
                <CalendarDays className="h-4 w-4 text-bework-intel" />
                Préparé par <span className="font-semibold text-bework-navy">{preparedByName}</span>
              </div>
            ) : null}
          </SectionCard>

          <section className="overflow-hidden rounded-2xl bw-surface-tinted-watch shadow-[var(--cc-shadow)]">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-white/30 sm:px-6"
            >
              <span>
                <span className="block text-[15px] font-bold text-bework-navy">Plus d’options</span>
                <span className="text-[13px] text-bework-muted">
                  Conditions, acompte et notes — uniquement des champs réellement supportés.
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-bework-watch transition-transform duration-180",
                  moreOpen && "rotate-180",
                )}
              />
            </button>
            {moreOpen ? (
              <div className="space-y-4 border-t border-bework-watch/15 px-5 py-5 sm:px-6">
                <label className="block space-y-1.5">
                  <span className={labelClass}>Conditions de règlement</span>
                  <input
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder={defaultPaymentTerms || "Ex. 30 jours fin de mois"}
                    className={inputClass}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className={labelClass}>Acompte (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={depositPercent}
                    onChange={(e) => setDepositPercent(e.target.value)}
                    placeholder="Optionnel"
                    className={inputClass}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className={labelClass}>Notes internes</span>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={3}
                    placeholder="Visibles uniquement en interne"
                    className={cn(inputClass, "h-auto min-h-[5.5rem] py-3")}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className={labelClass}>Notes client</span>
                  <textarea
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    rows={3}
                    placeholder="Mentions destinées au client"
                    className={cn(inputClass, "h-auto min-h-[5.5rem] py-3")}
                  />
                </label>
              </div>
            ) : null}
          </section>

          {error ? (
            <p className="rounded-xl border border-bework-critical/20 bg-bework-soft-critical px-4 py-3 text-sm text-bework-critical">
              {error}
            </p>
          ) : null}

          <div className="hidden space-y-2 lg:block">
            {missingHint ? (
              <p className="text-[13px] font-medium text-bework-watch">{missingHint}</p>
            ) : null}
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => void submit()}
              className="btn-cc-primary w-full !min-h-12 !text-[15px] disabled:opacity-45"
            >
              {busy ? "Création…" : "Créer et passer au chiffrage →"}
            </button>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="overflow-hidden rounded-2xl border border-bework-navy/15 bg-[linear-gradient(165deg,#132f4c_0%,#173b67_48%,#1e4d7a_100%)] p-5 text-white shadow-[var(--cc-shadow-hover)]">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-sky-300" />
              <h2 className="text-[15px] font-bold tracking-tight">Résumé du devis</h2>
            </div>
            <dl className="mt-4 space-y-3 text-[13px]">
              <div>
                <dt className="text-white/55">Client</dt>
                <dd className="mt-0.5 font-semibold text-white">{summaryClient}</dd>
              </div>
              <div>
                <dt className="text-white/55">Site</dt>
                <dd className="mt-0.5 font-semibold text-white">{summarySite}</dd>
              </div>
              <div>
                <dt className="text-white/55">Objet</dt>
                <dd className="mt-0.5 font-semibold text-white">
                  {subject.trim() || "À renseigner"}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-white/55">Validité</dt>
                  <dd className="mt-0.5 font-semibold text-white">
                    {computedDays != null ? `${computedDays} jours` : `${validityDays} jours`}
                  </dd>
                </div>
                <div>
                  <dt className="text-white/55">TVA</dt>
                  <dd className="mt-0.5 font-semibold text-white">
                    {(defaultVatRate ?? 20).toLocaleString("fr-FR")} %
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-3">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-sky-200">
                Chiffrage à compléter
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-white/80">
                Le montant sera calculé à l’étape suivante.
              </p>
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-white/8 px-3.5 py-3 ring-1 ring-white/10">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-sky-200">
                  Ensuite
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-white/85">
                  Vous ajouterez les ouvrages, quantités et prix depuis la bibliothèque.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* CTA sticky mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-bework-navy/10 bg-[color-mix(in_srgb,var(--bw-soft-navy)_35%,rgba(255,255,255,0.92))] px-4 py-3 backdrop-blur-md lg:hidden">
        {missingHint ? (
          <p className="mb-2 text-center text-[12px] font-medium text-bework-watch">{missingHint}</p>
        ) : null}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void submit()}
          className="btn-cc-primary w-full !min-h-12 disabled:opacity-45"
        >
          {busy ? "Création…" : "Créer et passer au chiffrage →"}
        </button>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Nouveau client"
        description="Ajoutez une entreprise à votre référentiel clients."
        widthClass="max-w-lg"
        footer={
          <div className="flex gap-2">
            <button type="button" className="btn-cc-secondary flex-1" onClick={() => setDrawerOpen(false)}>
              Annuler
            </button>
            <button
              type="button"
              className="btn-cc-primary flex-1"
              disabled={newClientBusy || !newClient.name.trim()}
              onClick={() => void createClient()}
            >
              {newClientBusy ? "Création…" : "Créer le client"}
            </button>
          </div>
        }
      >
        <div className="space-y-4 p-5">
          <label className="block space-y-1.5">
            <span className={labelClass}>Raison sociale *</span>
            <input
              value={newClient.name}
              onChange={(e) => setNewClient((s) => ({ ...s, name: e.target.value }))}
              className={inputClass}
              placeholder="Syndic Horizon Copro"
            />
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>Nom du contact</span>
            <input
              value={newClient.contactName}
              onChange={(e) => setNewClient((s) => ({ ...s, contactName: e.target.value }))}
              className={inputClass}
              placeholder="Claire Morel"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className={labelClass}>Email</span>
              <input
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient((s) => ({ ...s, email: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className={labelClass}>Téléphone</span>
              <input
                value={newClient.phone}
                onChange={(e) => setNewClient((s) => ({ ...s, phone: e.target.value }))}
                className={inputClass}
              />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className={labelClass}>Adresse</span>
            <input
              value={newClient.address}
              onChange={(e) => setNewClient((s) => ({ ...s, address: e.target.value }))}
              className={inputClass}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className={labelClass}>Code postal</span>
              <input
                value={newClient.zipCode}
                onChange={(e) => setNewClient((s) => ({ ...s, zipCode: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className={labelClass}>Ville</span>
              <input
                value={newClient.city}
                onChange={(e) => setNewClient((s) => ({ ...s, city: e.target.value }))}
                className={inputClass}
              />
            </label>
          </div>

          <button
            type="button"
            className="text-[13px] font-semibold text-bework-accent hover:underline"
            onClick={() => setNewClient((s) => ({ ...s, moreOpen: !s.moreOpen }))}
          >
            {newClient.moreOpen ? "Masquer" : "Plus d’informations"}
          </button>
          {newClient.moreOpen ? (
            <label className="block space-y-1.5">
              <span className={labelClass}>SIRET</span>
              <input
                value={newClient.siret}
                onChange={(e) => setNewClient((s) => ({ ...s, siret: e.target.value }))}
                className={inputClass}
              />
            </label>
          ) : null}
          <p className="text-[12px] text-bework-muted">
            La raison sociale seule suffit pour créer — le reste peut être complété ensuite.
          </p>
        </div>
      </Drawer>
    </div>
  );
}
