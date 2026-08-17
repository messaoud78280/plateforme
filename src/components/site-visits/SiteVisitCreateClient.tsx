"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  FileText,
  MapPin,
  Ruler,
  ShieldAlert,
  UserRound,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  VisitSectionCard,
  visitFieldClass,
  visitLabelClass,
} from "@/components/site-visits/VisitSectionCard";
import {
  DOCS_TO_REQUEST,
  PLANNED_MEASURES,
  PREP_CONSTRAINT_GROUPS,
  SITE_VISIT_LOTS,
  VISIT_DURATIONS,
  VISIT_NATURES,
  ZONE_MEASURE_CHIPS,
  type SiteVisitConstraints,
  type SiteVisitPrep,
} from "@/lib/site-visits/types";

type ClientOpt = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  contacts: Array<{
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    jobTitle: string | null;
    isPrimary: boolean;
  }>;
};

type ProjectOpt = {
  id: string;
  title: string;
  siteAddress: string | null;
  siteCity: string | null;
};

type UserOpt = { id: string; name: string | null; email: string };

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
        "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
        active
          ? "bg-bework-navy text-white"
          : "bg-white/80 text-slate-700 ring-1 ring-bework-navy/10 hover:bg-white",
      )}
    >
      {label}
    </button>
  );
}

export function SiteVisitCreateClient({
  clients,
  projects,
  users,
  currentUserId,
}: {
  clients: ClientOpt[];
  projects: ProjectOpt[];
  users: UserOpt[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [clientQuery, setClientQuery] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [clientName, setClientName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [address, setAddress] = useState("");
  const [complement, setComplement] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [contactId, setContactId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [nature, setNature] = useState("Relevé avant devis");
  const [description, setDescription] = useState("");
  const [lots, setLots] = useState<string[]>([]);
  const [planned, setPlanned] = useState<string[]>([]);
  const [zonesOnSite, setZonesOnSite] = useState(false);
  const [zoneDraft, setZoneDraft] = useState("");
  const [zonePlans, setZonePlans] = useState<Array<{ name: string; measures: string[] }>>([]);
  const [constraintTags, setConstraintTags] = useState<string[]>([]);
  const [quoteImpact, setQuoteImpact] = useState<string[]>([]);
  const [customConstraint, setCustomConstraint] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [customDuration, setCustomDuration] = useState(false);
  const [responsibleId, setResponsibleId] = useState(currentUserId);
  const [floor, setFloor] = useState("");
  const [building, setBuilding] = useState("");
  const [code, setCode] = useState("");
  const [parking, setParking] = useState("");
  const [accessNotes, setAccessNotes] = useState("");
  const [docsRequest, setDocsRequest] = useState<string[]>([]);
  const [addToAgenda, setAddToAgenda] = useState(true);

  const selectedClient = clients.find((c) => c.id === clientId) ?? null;
  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, clientQuery]);

  function applyClient(id: string) {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    setClientName(c.name);
    if (c.address && !address) setAddress(c.address);
    if (c.city && !city) setCity(c.city);
    if (c.zipCode && !zipCode) setZipCode(c.zipCode);
    const primary = c.contacts.find((ct) => ct.isPrimary) ?? c.contacts[0];
    if (primary) {
      setContactId(primary.id);
      setContactName(primary.name);
      setContactPhone(primary.phone ?? "");
      setContactEmail(primary.email ?? "");
      setContactRole(primary.jobTitle ?? "");
      setContactCompany(c.name);
    }
  }

  function applyContact(ct: ClientOpt["contacts"][number]) {
    setContactId(ct.id);
    setContactName(ct.name);
    setContactPhone(ct.phone ?? "");
    setContactEmail(ct.email ?? "");
    setContactRole(ct.jobTitle ?? "");
    setContactCompany(selectedClient?.name || clientName);
  }

  function applyProject(id: string) {
    setProjectId(id);
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setSiteName(p.title);
    if (p.siteAddress) setAddress(p.siteAddress);
    if (p.siteCity) setCity(p.siteCity);
  }

  const siteAddress = useMemo(() => {
    return [address, complement, [zipCode, city].filter(Boolean).join(" ")]
      .filter((x) => x.trim())
      .join(", ");
  }, [address, complement, zipCode, city]);

  const prepItems = [
    { id: "client", label: "Client", done: Boolean(clientName.trim()), required: true },
    { id: "address", label: "Adresse", done: Boolean(address.trim() || city.trim()), required: true },
    { id: "subject", label: "Objet", done: Boolean(nature.trim() || description.trim()), required: true },
    { id: "contact", label: "Contact", done: Boolean(contactName.trim() || contactPhone.trim()), required: false },
    { id: "date", label: "Date", done: Boolean(date), required: false },
    { id: "lots", label: "Lots", done: lots.length > 0, required: false },
    { id: "measures", label: "Relevés", done: planned.length > 0, required: false },
    { id: "docs", label: "Documents", done: docsRequest.length > 0, required: false },
    { id: "constraints", label: "Contraintes", done: constraintTags.length > 0, required: false },
  ];
  const prepDone = prepItems.filter((i) => i.done).length;
  const canCreate = prepItems.filter((i) => i.required).every((i) => i.done);

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  function buildPayload(schedule: boolean) {
    const constraints: SiteVisitConstraints = {
      access: constraintTags.filter((t) =>
        (PREP_CONSTRAINT_GROUPS.find((g) => g.id === "access")?.items ?? []).includes(t),
      ),
      occupation: constraintTags.filter((t) =>
        (PREP_CONSTRAINT_GROUPS.find((g) => g.id === "occupation")?.items ?? []).includes(t),
      ),
      means: constraintTags.filter((t) =>
        ["Nacelle", "Échafaudage", "Levage"].includes(t),
      ),
      waste: constraintTags.filter((t) =>
        (PREP_CONSTRAINT_GROUPS.find((g) => g.id === "waste")?.items ?? []).includes(t),
      ),
      asbestosStatus: constraintTags.includes("Amiante connu")
        ? "Présence potentielle à vérifier"
        : null,
      accessLevel: constraintTags.includes("Accès difficile") ? "Difficile" : null,
      quoteImpact,
      otherComment: customConstraint.trim() || null,
    };
    const prep: SiteVisitPrep = {
      nature,
      plannedMeasures: planned,
      zonesOnSite,
      zonePlans,
      duration: duration || null,
      contactCompany: contactCompany || null,
      contactRole: contactRole || null,
      contactEmail: contactEmail || null,
      addressComplement: complement || null,
      zipCode: zipCode || null,
      city: city || null,
      access: {
        floor: floor || null,
        building: building || null,
        code: code || null,
        parking: parking || null,
        notes: accessNotes || null,
      },
      customConstraints: customConstraint.trim() ? [customConstraint.trim()] : [],
      docsToRequest: docsRequest,
      addToAgenda: schedule && addToAgenda,
    };
    const scheduledAt =
      schedule && date
        ? new Date(`${date}T${time || "09:00"}`).toISOString()
        : null;
    return {
      clientName,
      clientExternalOrgId: clientId || null,
      projectId: projectId || null,
      siteName: siteName || null,
      siteAddress: siteAddress || address || city,
      contactName: contactName || null,
      contactPhone: contactPhone || null,
      subject: nature || "Visite",
      clientNeed: description || null,
      scheduledAt,
      responsibleId: responsibleId || null,
      estimatedDuration: duration || null,
      lots,
      zones: zonePlans.map((z) => z.name),
      constraints,
      prep,
      missingLabels: docsRequest,
    };
  }

  async function submit(schedule: boolean) {
    if (!canCreate) {
      setMessage("Client, adresse et objet sont indispensables.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/site-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(schedule)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      router.push(`/dashboard/visites-metres/${data.visit.id}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const responsibleLabel =
    users.find((u) => u.id === responsibleId)?.name ||
    users.find((u) => u.id === responsibleId)?.email ||
    "Responsable";

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/dashboard/visites-metres" className="text-[13px] font-medium text-bework-navy hover:underline">
            ← Visites & métrés
          </Link>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-bework-ink">
            Nouvelle visite
          </h1>
          <p className="mt-1 max-w-xl text-[14px] text-bework-muted">
            Préparez le rendez-vous, les relevés et les informations nécessaires au chiffrage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !canCreate}
            onClick={() => void submit(false)}
            className="rounded-full border border-bework-navy/20 bg-white px-4 py-2 text-[13px] font-medium text-bework-navy disabled:opacity-40"
          >
            Enregistrer en brouillon
          </button>
          <button
            type="button"
            disabled={busy || !canCreate}
            onClick={() => void submit(true)}
            className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40"
          >
            Programmer la visite
          </button>
        </div>
      </div>

      {message ? (
        <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-[13px] text-amber-900">{message}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <VisitSectionCard tone="navy" icon={Building2} title="Client & affaire" hint="Réutilisez un client ou un chantier déjà connu.">
            <label className={visitLabelClass}>
              Client / prospect
              <input
                value={clientQuery}
                onChange={(e) => setClientQuery(e.target.value)}
                placeholder="Rechercher un client…"
                className={visitFieldClass}
              />
              <select
                value={clientId}
                onChange={(e) => applyClient(e.target.value)}
                className={visitFieldClass}
              >
                <option value="">Saisie libre ou choisir…</option>
                {filteredClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={visitLabelClass}>
              Nom du client
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Syndic Horizon Copro"
                className={visitFieldClass}
              />
            </label>
            <label className={visitLabelClass}>
              Chantier existant
              <select
                value={projectId}
                onChange={(e) => applyProject(e.target.value)}
                className={visitFieldClass}
              >
                <option value="">Aucun — nouvelle affaire</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={visitLabelClass}>
              Site / nom de l’affaire
              <input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Résidence Les Peupliers"
                className={visitFieldClass}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={cn(visitLabelClass, "sm:col-span-2")}>
                Adresse
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="12 Allée des Peupliers"
                  className={visitFieldClass}
                />
              </label>
              <label className={visitLabelClass}>
                Complément
                <input value={complement} onChange={(e) => setComplement(e.target.value)} className={visitFieldClass} />
              </label>
              <label className={visitLabelClass}>
                Code postal
                <input value={zipCode} onChange={(e) => setZipCode(e.target.value)} className={visitFieldClass} />
              </label>
              <label className={cn(visitLabelClass, "sm:col-span-2")}>
                Ville
                <input value={city} onChange={(e) => setCity(e.target.value)} className={visitFieldClass} />
              </label>
            </div>
          </VisitSectionCard>

          <VisitSectionCard tone="accent" icon={UserRound} title="Contact sur place" hint="Personne qui accueille sur le site.">
            {selectedClient && selectedClient.contacts.length > 0 ? (
              <label className={visitLabelClass}>
                Contact existant
                <select
                  value={contactId}
                  onChange={(e) => {
                    const ct = selectedClient.contacts.find((c) => c.id === e.target.value);
                    if (ct) applyContact(ct);
                  }}
                  className={visitFieldClass}
                >
                  <option value="">Choisir…</option>
                  {selectedClient.contacts.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name}
                      {ct.isPrimary ? " (principal)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={visitLabelClass}>
                Nom
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} className={visitFieldClass} />
              </label>
              <label className={visitLabelClass}>
                Société
                <input value={contactCompany} onChange={(e) => setContactCompany(e.target.value)} className={visitFieldClass} />
              </label>
              <label className={visitLabelClass}>
                Fonction
                <input value={contactRole} onChange={(e) => setContactRole(e.target.value)} className={visitFieldClass} />
              </label>
              <label className={visitLabelClass}>
                Téléphone
                <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={visitFieldClass} />
              </label>
              <label className={cn(visitLabelClass, "sm:col-span-2")}>
                Email
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={visitFieldClass} />
              </label>
            </div>
          </VisitSectionCard>

          <VisitSectionCard tone="cyan" icon={Ruler} title="Objet de la visite" hint="Nature de la demande et ce qu’il faudra relever.">
            <p className={visitLabelClass}>Nature de la demande</p>
            <div className="flex flex-wrap gap-2">
              {VISIT_NATURES.map((n) => (
                <Chip key={n} label={n} active={nature === n} onClick={() => setNature(n)} />
              ))}
            </div>
            <label className={visitLabelClass}>
              Description
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrire les travaux demandés, attentes du client et éléments à relever."
                className={visitFieldClass}
              />
            </label>
          </VisitSectionCard>

          <VisitSectionCard tone="violet" icon={Layers} title="Lots concernés" hint="Corps d’état à préparer pour le relevé.">
            <div className="flex flex-wrap gap-2">
              {SITE_VISIT_LOTS.map((l) => (
                <Chip key={l} label={l} active={lots.includes(l)} onClick={() => toggle(lots, l, setLots)} />
              ))}
            </div>
          </VisitSectionCard>

          <VisitSectionCard tone="cyan" icon={Ruler} title="Relevés prévus" hint="Préparez les mesures à effectuer sur place — pas les valeurs.">
            <div className="flex flex-wrap gap-2">
              {PLANNED_MEASURES.map((m) => (
                <Chip key={m} label={m} active={planned.includes(m)} onClick={() => toggle(planned, m, setPlanned)} />
              ))}
            </div>
          </VisitSectionCard>

          <VisitSectionCard tone="cyan" icon={MapPin} title="Zones / secteurs" hint="Toiture, façade, RDC… ou à définir sur place.">
            <label className="flex items-center gap-2 text-[13px] text-slate-700">
              <input
                type="checkbox"
                checked={zonesOnSite}
                onChange={(e) => setZonesOnSite(e.target.checked)}
              />
              Je les définirai sur place
            </label>
            {!zonesOnSite ? (
              <>
                <div className="flex gap-2">
                  <input
                    value={zoneDraft}
                    onChange={(e) => setZoneDraft(e.target.value)}
                    placeholder="Toiture terrasse, Façade Nord…"
                    className={visitFieldClass}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const name = zoneDraft.trim();
                      if (!name) return;
                      setZonePlans([...zonePlans, { name, measures: [] }]);
                      setZoneDraft("");
                    }}
                    className="shrink-0 rounded-xl bg-bework-navy px-3 text-[13px] font-semibold text-white"
                  >
                    + Zone
                  </button>
                </div>
                {zonePlans.map((z, i) => (
                  <div key={`${z.name}-${i}`} className="rounded-xl border border-bework-navy/10 bg-white/70 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-semibold text-bework-navy">{z.name}</p>
                      <button
                        type="button"
                        className="text-[12px] text-slate-400"
                        onClick={() => setZonePlans(zonePlans.filter((_, j) => j !== i))}
                      >
                        Retirer
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">À relever</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {ZONE_MEASURE_CHIPS.map((m) => (
                        <Chip
                          key={m}
                          label={m}
                          active={z.measures.includes(m)}
                          onClick={() => {
                            const next = [...zonePlans];
                            const cur = next[i]!;
                            cur.measures = cur.measures.includes(m)
                              ? cur.measures.filter((x) => x !== m)
                              : [...cur.measures, m];
                            setZonePlans(next);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : null}
          </VisitSectionCard>

          <VisitSectionCard tone="watch" icon={ShieldAlert} title="Contraintes connues" hint="Marquez celles à intégrer au chiffrage.">
            {PREP_CONSTRAINT_GROUPS.map((g) => (
              <div key={g.id}>
                <p className="mb-1.5 text-[12px] font-semibold text-bework-navy">{g.label}</p>
                <div className="flex flex-wrap gap-2">
                  {g.items.map((item) => (
                    <Chip
                      key={item}
                      label={item}
                      active={constraintTags.includes(item)}
                      onClick={() => toggle(constraintTags, item, setConstraintTags)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {constraintTags.length > 0 ? (
              <div>
                <p className="mb-1.5 text-[12px] font-semibold text-amber-800">À intégrer au chiffrage</p>
                <div className="flex flex-wrap gap-2">
                  {constraintTags.map((item) => (
                    <Chip
                      key={`qi-${item}`}
                      label={item}
                      active={quoteImpact.includes(item)}
                      onClick={() => toggle(quoteImpact, item, setQuoteImpact)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex gap-2">
              <input
                value={customConstraint}
                onChange={(e) => setCustomConstraint(e.target.value)}
                placeholder="Contrainte personnalisée"
                className={visitFieldClass}
              />
              <button
                type="button"
                onClick={() => {
                  const v = customConstraint.trim();
                  if (!v) return;
                  if (!constraintTags.includes(v)) setConstraintTags([...constraintTags, v]);
                  setCustomConstraint("");
                }}
                className="shrink-0 rounded-xl border border-bework-navy/15 px-3 text-[13px] font-semibold text-bework-navy"
              >
                + Ajouter
              </button>
            </div>
          </VisitSectionCard>

          <VisitSectionCard tone="ok" icon={CalendarDays} title="Rendez-vous" hint="Date, durée et responsable BeWork.">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={visitLabelClass}>
                Date
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={visitFieldClass} />
              </label>
              <label className={visitLabelClass}>
                Heure
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={visitFieldClass} />
              </label>
            </div>
            <p className={visitLabelClass}>Durée estimée</p>
            <div className="flex flex-wrap gap-2">
              {VISIT_DURATIONS.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  active={!customDuration && duration === d}
                  onClick={() => {
                    setCustomDuration(false);
                    setDuration(d);
                  }}
                />
              ))}
              <Chip
                label="Personnalisée"
                active={customDuration}
                onClick={() => {
                  setCustomDuration(true);
                  if ((VISIT_DURATIONS as readonly string[]).includes(duration)) setDuration("");
                }}
              />
            </div>
            {customDuration ? (
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex. 45 min, 3 h…"
                className={visitFieldClass}
              />
            ) : null}
            <label className={visitLabelClass}>
              Responsable BeWork
              <select
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className={visitFieldClass}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[13px] text-slate-700">
              <input type="checkbox" checked={addToAgenda} onChange={(e) => setAddToAgenda(e.target.checked)} />
              ✓ Ajouter à l’Agenda
            </label>
          </VisitSectionCard>

          <VisitSectionCard tone="navy" icon={MapPin} title="Accès au site" hint="Notes utiles pour arriver au bon endroit.">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={visitLabelClass}>
                Bâtiment
                <input value={building} onChange={(e) => setBuilding(e.target.value)} className={visitFieldClass} />
              </label>
              <label className={visitLabelClass}>
                Étage
                <input value={floor} onChange={(e) => setFloor(e.target.value)} className={visitFieldClass} />
              </label>
              <label className={visitLabelClass}>
                Code / badge
                <input value={code} onChange={(e) => setCode(e.target.value)} className={visitFieldClass} />
              </label>
              <label className={visitLabelClass}>
                Parking
                <input value={parking} onChange={(e) => setParking(e.target.value)} className={visitFieldClass} />
              </label>
              <label className={cn(visitLabelClass, "sm:col-span-2")}>
                Notes d’accès
                <textarea rows={2} value={accessNotes} onChange={(e) => setAccessNotes(e.target.value)} className={visitFieldClass} />
              </label>
            </div>
          </VisitSectionCard>

          <VisitSectionCard tone="violet" icon={FileText} title="Documents" hint="Pièces utiles et pièces encore à obtenir.">
            <Link
              href="/dashboard/documents"
              className="inline-flex text-[13px] font-medium text-bework-navy hover:underline"
            >
              Ajouter depuis Documents
            </Link>
            <p className="text-[12px] font-semibold text-bework-navy">Documents à obtenir</p>
            <div className="flex flex-wrap gap-2">
              {DOCS_TO_REQUEST.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  active={docsRequest.includes(d)}
                  onClick={() => toggle(docsRequest, d, setDocsRequest)}
                />
              ))}
            </div>
          </VisitSectionCard>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-bework-navy/10 bg-white p-4 shadow-[var(--cc-shadow)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-bework-navy/60">Résumé</p>
            <p className="mt-2 text-[16px] font-semibold text-bework-ink">
              {siteName || clientName || "Nouvelle visite"}
            </p>
            {clientName ? <p className="text-[13px] text-slate-600">{clientName}</p> : null}
            {siteAddress ? <p className="mt-1 text-[13px] text-slate-500">{siteAddress}</p> : null}
            <dl className="mt-4 space-y-2 text-[13px]">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Rendez-vous</dt>
                <dd>
                  {date
                    ? `${new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR")}${time ? ` · ${time}` : ""}`
                    : "À planifier"}
                  {responsibleLabel ? ` · ${responsibleLabel}` : ""}
                </dd>
              </div>
              {lots.length ? (
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">Lots</dt>
                  <dd>{lots.join(" · ")}</dd>
                </div>
              ) : null}
              {planned.length ? (
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">Relevés prévus</dt>
                  <dd>{planned.length}</dd>
                </div>
              ) : null}
              {zonePlans.length ? (
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">Zones</dt>
                  <dd>{zonePlans.length}</dd>
                </div>
              ) : null}
              {docsRequest.length ? (
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">Documents à obtenir</dt>
                  <dd>{docsRequest.length}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-4">
              <p className="text-[12px] font-semibold text-bework-navy">
                Préparation · {prepDone} / {prepItems.length} éléments préparés
              </p>
              <ul className="mt-2 space-y-1 text-[13px]">
                {prepItems.map((i) => (
                  <li key={i.id} className={i.done ? "text-emerald-700" : "text-slate-500"}>
                    {i.done ? "✓" : "◌"} {i.label}
                    {i.required ? "" : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={busy || !canCreate}
                onClick={() => void submit(false)}
                className="h-11 rounded-xl border border-bework-navy/20 text-[13px] font-semibold text-bework-navy disabled:opacity-40"
              >
                Enregistrer en brouillon
              </button>
              <button
                type="button"
                disabled={busy || !canCreate}
                onClick={() => void submit(true)}
                className="h-11 rounded-xl bg-[#1e3a5f] text-[13px] font-semibold text-white disabled:opacity-40"
              >
                Programmer la visite
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
