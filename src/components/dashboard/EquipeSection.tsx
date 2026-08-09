"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ACCESS_STATUS_LABELS,
  PERMISSION_PROFILE_LABELS,
  personTypesForTab,
  profilesForPersonType,
  type AccessStatus,
  type EquipeTab,
  type PersonType,
  type PermissionProfileKey,
} from "@/lib/equipe-acces/types";
import {
  ADD_PERSON_KINDS,
  INTERNAL_JOB_OPTIONS,
  PROFILE_CAPABILITIES,
  type AddPersonKind,
} from "@/lib/equipe-acces/profile-capabilities";

type ProjectOpt = { id: string; title: string; siteCity?: string | null };

type Member = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  personType: string | null;
  permissionProfile: string | null;
  accessStatus: string;
  lastLoginAt: string | null;
  isOwner: boolean;
  externalOrganization: { id: string; name: string; type: string } | null;
  projects: { id: string; title: string }[];
  allChantiers?: boolean;
  accessLabel?: string;
};

type InvitationItem = {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  createdAt?: string;
  personType?: string | null;
  permissionProfile?: string | null;
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

const TABS: { id: EquipeTab; label: string }[] = [
  { id: "personnel", label: "Personnel" },
  { id: "clients", label: "Clients" },
  { id: "fournisseurs", label: "Fournisseurs" },
  { id: "sous-traitants", label: "Sous-traitants" },
  { id: "partenaires", label: "Partenaires" },
  { id: "invitations", label: "Invitations" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.slice(0, 2) || "?").toUpperCase();
}

function statusClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "INVITED":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "SUSPENDED":
      return "bg-orange-50 text-orange-900 border-orange-200";
    case "DISABLED":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function profileLabel(p: string | null | undefined): string {
  if (!p) return "—";
  return PERMISSION_PROFILE_LABELS[p as PermissionProfileKey] ?? p;
}

function chantiersLine(m: Member): string {
  if (m.allChantiers || (m.personType === "INTERNAL" && m.projects.length === 0)) {
    return m.isOwner || m.permissionProfile === "DIRECTION"
      ? "Accès global"
      : "Tous les chantiers";
  }
  if (m.projects.length === 0) return "Aucun chantier";
  return m.projects.map((p) => p.title).join(" · ");
}

export function EquipeSection() {
  const [tab, setTab] = useState<EquipeTab>("personnel");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [acceptUrl, setAcceptUrl] = useState("");

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [addKind, setAddKind] = useState<AddPersonKind | null>(null);
  const [jobKey, setJobKey] = useState<string>("CONDUCTEUR");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitleCustom, setJobTitleCustom] = useState("");
  const [allChantiers, setAllChantiers] = useState(true);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editProfile, setEditProfile] = useState<PermissionProfileKey>("CONDUCTEUR");
  const [editProjectIds, setEditProjectIds] = useState<string[]>([]);
  const [editAllChantiers, setEditAllChantiers] = useState(false);
  const [workload, setWorkload] = useState<{
    tasks: number;
    orders: number;
    events: number;
    total: number;
  } | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  const load = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/equipe");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Impossible de charger l’équipe.");
        return;
      }
      const data = await res.json();
      setMembers(Array.isArray(data.members) ? data.members : []);
      setInvitations(Array.isArray(data.invitations) ? data.invitations : []);
      setProjects(Array.isArray(data.projects) ? data.projects : []);
      setError("");
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredMembers = useMemo(() => {
    const types = personTypesForTab(tab);
    const query = q.trim().toLowerCase();
    return members.filter((m) => {
      if (types) {
        const pt = m.personType ?? "INTERNAL";
        if (!types.includes(pt as PersonType)) return false;
      }
      if (statusFilter !== "ALL" && m.accessStatus !== statusFilter) return false;
      if (!query) return true;
      const hay = [m.name, m.email, m.company, m.jobTitle, m.externalOrganization?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [members, tab, q, statusFilter]);

  const pendingInvites = useMemo(
    () =>
      invitations.filter(
        (i) => i.status === "PENDING" && new Date(i.expiresAt) > new Date(),
      ),
    [invitations],
  );

  const selected = members.find((m) => m.id === selectedId) ?? null;
  const activeInternals = members.filter(
    (m) =>
      m.accessStatus === "ACTIVE" &&
      (m.personType ?? "INTERNAL") === "INTERNAL" &&
      m.id !== selectedId,
  );

  useEffect(() => {
    if (!selected) {
      setWorkload(null);
      return;
    }
    setEditProfile(
      (selected.permissionProfile as PermissionProfileKey) || "CONDUCTEUR",
    );
    setEditProjectIds(selected.projects.map((p) => p.id));
    setEditAllChantiers(Boolean(selected.allChantiers) || selected.projects.length === 0);
    setShowAdvanced(false);
    void fetch(`/api/equipe/${selected.id}/workload`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setWorkload(d && typeof d.total === "number" ? d : null))
      .catch(() => setWorkload(null));
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetWizard() {
    setWizardStep(1);
    setAddKind(null);
    setJobKey("CONDUCTEUR");
    setEmail("");
    setFirstName("");
    setLastName("");
    setCompanyName("");
    setPhone("");
    setJobTitleCustom("");
    setAllChantiers(true);
    setProjectIds([]);
  }

  function openWizard() {
    resetWizard();
    setWizardOpen(true);
    setError("");
    setSuccess("");
    setAcceptUrl("");
  }

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!addKind) return;
    setError("");
    setSuccess("");
    setAcceptUrl("");
    if (!email.trim()) {
      setError("Indiquez l’email.");
      return;
    }
    const kindDef = ADD_PERSON_KINDS.find((k) => k.key === addKind)!;
    const personType = kindDef.personType;
    let permissionProfile: PermissionProfileKey = profilesForPersonType(personType)[0];
    let jobTitle = "";
    if (personType === "INTERNAL") {
      const job = INTERNAL_JOB_OPTIONS.find((j) => j.key === jobKey) ?? INTERNAL_JOB_OPTIONS[1];
      permissionProfile = job.profile;
      jobTitle =
        job.key === "AUTRE" || job.key === "CHARGE_AFFAIRES"
          ? jobTitleCustom.trim() || job.label
          : job.label;
    }

    const ids =
      personType === "INTERNAL" && allChantiers
        ? []
        : projectIds;

    if (personType !== "INTERNAL" && personType !== "SUPPLIER" && ids.length === 0) {
      setError("Sélectionnez au moins un chantier accessible.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/equipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName,
          lastName,
          companyName,
          phone,
          jobTitle,
          personType,
          permissionProfile,
          projectIds: ids,
          mode: "invite",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invitation impossible.");
        setLoading(false);
        return;
      }
      setAcceptUrl(data.acceptUrl ?? "");
      setSuccess(
        data.emailSent
          ? `Invitation envoyée à ${data.email}.`
          : `Invitation prête pour ${data.email} (e-mail non envoyé — partagez le lien).`,
      );
      setWizardOpen(false);
      resetWizard();
      await load();
    } catch {
      setError("Erreur de connexion.");
    }
    setLoading(false);
  }

  async function patchMember(userId: string, body: Record<string, unknown>) {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/equipe/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Action impossible.");
      else {
        setSuccess("Mise à jour enregistrée.");
        await load();
      }
    } catch {
      setError("Erreur de connexion.");
    }
    setActionLoading(false);
  }

  async function resendInvite(id: string) {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/equipe/invitations/${id}/resend`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Renvoi impossible.");
      else {
        setAcceptUrl(data.acceptUrl ?? "");
        setSuccess(`Lien renouvelé pour ${data.email}.`);
        await load();
      }
    } catch {
      setError("Erreur de connexion.");
    }
    setActionLoading(false);
  }

  async function cancelInvite(id: string) {
    if (!window.confirm("Annuler cette invitation ? Le lien ne fonctionnera plus.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/equipe/invitations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Annulation impossible.");
      else {
        setSuccess("Invitation annulée.");
        await load();
      }
    } catch {
      setError("Erreur de connexion.");
    }
    setActionLoading(false);
  }

  async function reassignThenDisable() {
    if (!selected) return;
    if (workload && workload.total > 0 && !reassignTo) {
      setError("Choisissez à qui réaffecter les éléments ouverts, ou réaffectez d’abord.");
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      if (reassignTo && workload && workload.total > 0) {
        const res = await fetch(`/api/equipe/${selected.id}/reassign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toUserId: reassignTo }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Réaffectation impossible.");
          setActionLoading(false);
          return;
        }
      }
      await patchMember(selected.id, { accessStatus: "DISABLED" });
    } finally {
      setActionLoading(false);
    }
  }

  const caps =
    selected?.permissionProfile &&
    PROFILE_CAPABILITIES[selected.permissionProfile as PermissionProfileKey];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-full gap-1 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setSelectedId(null);
              }}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-[#1e3a5f] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
              {t.id === "invitations" && pendingInvites.length > 0 ? (
                <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-slate-900">
                  {pendingInvites.length}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        {tab !== "invitations" ? (
          <button
            type="button"
            onClick={openWizard}
            className="shrink-0 rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]"
          >
            + Ajouter
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <p>{success}</p>
          {acceptUrl ? (
            <p className="mt-2 break-all font-mono text-xs text-emerald-800">{acceptUrl}</p>
          ) : null}
        </div>
      ) : null}

      {wizardOpen ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#1e3a5f]">Ajouter quelqu’un</h2>
              <p className="mt-1 text-sm text-slate-500">
                {wizardStep === 1
                  ? "Quel type de personne souhaitez-vous ajouter ?"
                  : "Renseignez les informations, puis envoyez l’invitation."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWizardOpen(false)}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Fermer
            </button>
          </div>

          {wizardStep === 1 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ADD_PERSON_KINDS.map((k) => (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => {
                    setAddKind(k.key);
                    setAllChantiers(k.key === "collaborateur");
                    setWizardStep(2);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-left transition hover:border-[#1d4ed8]/40 hover:bg-white"
                >
                  <p className="font-semibold text-[#1e3a5f]">{k.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{k.hint}</p>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={submitInvite} className="mt-5 space-y-4">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="text-xs font-medium text-[#1d4ed8] hover:underline"
              >
                ← Changer le type
              </button>

              {addKind !== "collaborateur" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Entreprise
                  </label>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={
                      addKind === "fournisseur"
                        ? "Ex. Point.P"
                        : addKind === "client"
                          ? "Ex. Syndic Horizon Copro"
                          : "Nom de l’entreprise"
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    required={addKind === "client" || addKind === "fournisseur"}
                  />
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Prénom</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              {addKind === "collaborateur" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Fonction</label>
                  <select
                    value={jobKey}
                    onChange={(e) => setJobKey(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {INTERNAL_JOB_OPTIONS.map((j) => (
                      <option key={j.key} value={j.key}>
                        {j.label}
                      </option>
                    ))}
                  </select>
                  {jobKey === "AUTRE" || jobKey === "CHARGE_AFFAIRES" ? (
                    <input
                      value={jobTitleCustom}
                      onChange={(e) => setJobTitleCustom(e.target.value)}
                      placeholder="Précisez la fonction"
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  ) : null}
                  {jobKey && PROFILE_CAPABILITIES[
                    INTERNAL_JOB_OPTIONS.find((j) => j.key === jobKey)?.profile ?? "CONDUCTEUR"
                  ] ? (
                    <ul className="mt-3 space-y-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      {PROFILE_CAPABILITIES[
                        INTERNAL_JOB_OPTIONS.find((j) => j.key === jobKey)!.profile
                      ]
                        .filter((c) => c.allowed)
                        .slice(0, 6)
                        .map((c) => (
                          <li key={c.label}>✓ {c.label}</li>
                        ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {addKind === "fournisseur" ? (
                <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Accès limité aux commandes de cette entreprise, livraisons concernées, documents
                  explicitement partagés et conversations fournisseur — pas au planning interne.
                </p>
              ) : null}
              {addKind === "client" ? (
                <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Ce client ne verra que les données explicitement partagées avec lui.
                </p>
              ) : null}

              {addKind !== "fournisseur" ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Accès aux chantiers</p>
                  {addKind === "collaborateur" ? (
                    <div className="mb-3 space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={allChantiers}
                          onChange={() => setAllChantiers(true)}
                        />
                        Tous les chantiers
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={!allChantiers}
                          onChange={() => setAllChantiers(false)}
                        />
                        Uniquement certains chantiers
                      </label>
                    </div>
                  ) : null}
                  {!allChantiers || addKind !== "collaborateur" ? (
                    <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                      {projects.map((p) => (
                        <li key={p.id}>
                          <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={projectIds.includes(p.id)}
                              onChange={() =>
                                setProjectIds((prev) =>
                                  prev.includes(p.id)
                                    ? prev.filter((x) => x !== p.id)
                                    : [...prev, p.id],
                                )
                              }
                            />
                            {p.title}
                            {p.siteCity ? (
                              <span className="text-slate-400"> · {p.siteCity}</span>
                            ) : null}
                          </label>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWizardOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#1d4ed8] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {loading ? "Envoi…" : "Envoyer l’invitation"}
                </button>
              </div>
            </form>
          )}
        </section>
      ) : null}

      {tab === "invitations" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[#1e3a5f]">Invitations en attente</h2>
          {loadingList ? (
            <p className="mt-4 text-sm text-slate-500">Chargement…</p>
          ) : pendingInvites.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Aucune invitation en attente.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {pendingInvites.map((inv) => {
                const name = [inv.firstName, inv.lastName].filter(Boolean).join(" ") || inv.email;
                return (
                  <li
                    key={inv.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{name}</p>
                      <p className="text-sm text-slate-500">{inv.email}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {profileLabel(inv.permissionProfile)}
                        {inv.companyName ? ` · ${inv.companyName}` : ""}
                        {" · Expire le "}
                        {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => void resendInvite(inv.id)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium"
                      >
                        Renvoyer
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => void cancelInvite(inv.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700"
                      >
                        Annuler
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher…"
                className="min-w-[160px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actif</option>
                <option value="INVITED">Invitation envoyée</option>
                <option value="SUSPENDED">Suspendu</option>
                <option value="DISABLED">Désactivé</option>
              </select>
            </div>

            {loadingList ? (
              <p className="text-sm text-slate-500">Chargement…</p>
            ) : filteredMembers.length === 0 ? (
              <p className="text-sm text-slate-500">Personne dans cet onglet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredMembers.map((m) => {
                  const st = m.accessStatus as AccessStatus;
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(m.id)}
                        className={`flex w-full items-start gap-3 px-1 py-3.5 text-left transition hover:bg-slate-50 ${
                          selectedId === m.id ? "bg-blue-50/70" : ""
                        }`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-xs font-bold text-white">
                          {initials(m.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900">{m.name}</span>
                            <span
                              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${statusClass(st)}`}
                            >
                              {ACCESS_STATUS_LABELS[st] ?? st}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-sm text-slate-600">
                            {m.jobTitle || profileLabel(m.permissionProfile)}
                            {m.externalOrganization?.name
                              ? ` · ${m.externalOrganization.name}`
                              : m.company
                                ? ` · ${m.company}`
                                : ""}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-slate-400">
                            {chantiersLine(m)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            {!selected ? (
              <p className="text-sm text-slate-500">
                Sélectionnez une personne pour voir sa fiche.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white">
                    {initials(selected.name)}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#1e3a5f]">{selected.name}</h3>
                    <p className="text-sm text-slate-600">
                      {selected.jobTitle || profileLabel(selected.permissionProfile)}
                    </p>
                    <p className="truncate text-xs text-slate-400">{selected.email}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Accès
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{chantiersLine(selected)}</p>
                </div>

                {caps ? (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Ce qu’elle peut faire
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {caps.map((c) => (
                        <li key={c.label} className={c.allowed ? "" : "text-slate-400 line-through"}>
                          {c.allowed ? "✓" : "–"} {c.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {!selected.isOwner ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced((v) => !v)}
                      className="text-xs font-medium text-[#1d4ed8] hover:underline"
                    >
                      {showAdvanced ? "Masquer" : "Paramètres avancés"}
                    </button>
                    {showAdvanced ? (
                      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <label className="block text-xs font-medium text-slate-600">
                          Profil
                          <select
                            value={editProfile}
                            onChange={(e) =>
                              setEditProfile(e.target.value as PermissionProfileKey)
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                          >
                            {profilesForPersonType(
                              (selected.personType as PersonType) || "INTERNAL",
                            ).map((p) => (
                              <option key={p} value={p}>
                                {PERMISSION_PROFILE_LABELS[p]}
                              </option>
                            ))}
                          </select>
                        </label>
                        {(selected.personType ?? "INTERNAL") === "INTERNAL" ? (
                          <div className="space-y-1 text-xs">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={editAllChantiers}
                                onChange={() => setEditAllChantiers(true)}
                              />
                              Tous les chantiers
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={!editAllChantiers}
                                onChange={() => setEditAllChantiers(false)}
                              />
                              Chantiers sélectionnés
                            </label>
                          </div>
                        ) : null}
                        {!editAllChantiers ||
                        (selected.personType ?? "INTERNAL") !== "INTERNAL" ? (
                          <ul className="max-h-28 space-y-0.5 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 text-xs">
                            {projects.map((p) => (
                              <li key={p.id}>
                                <label className="flex cursor-pointer items-center gap-2 px-1 py-1">
                                  <input
                                    type="checkbox"
                                    checked={editProjectIds.includes(p.id)}
                                    onChange={() =>
                                      setEditProjectIds((prev) =>
                                        prev.includes(p.id)
                                          ? prev.filter((x) => x !== p.id)
                                          : [...prev, p.id],
                                      )
                                    }
                                  />
                                  {p.title}
                                </label>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            void patchMember(selected.id, {
                              permissionProfile: editProfile,
                              projectIds:
                                editAllChantiers &&
                                (selected.personType ?? "INTERNAL") === "INTERNAL"
                                  ? []
                                  : editProjectIds,
                            })
                          }
                          className="w-full rounded-lg bg-[#1d4ed8] px-3 py-2 text-sm font-semibold text-white"
                        >
                          Enregistrer
                        </button>
                      </div>
                    ) : null}

                    {workload && workload.total > 0 ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                        <p className="font-medium">Éléments encore rattachés</p>
                        <ul className="mt-1 text-xs">
                          {workload.tasks > 0 ? <li>{workload.tasks} tâche(s)</li> : null}
                          {workload.orders > 0 ? <li>{workload.orders} commande(s)</li> : null}
                          {workload.events > 0 ? (
                            <li>{workload.events} événement(s) futur(s)</li>
                          ) : null}
                        </ul>
                        <label className="mt-2 block text-xs font-medium">
                          Réaffecter à
                          <select
                            value={reassignTo}
                            onChange={(e) => setReassignTo(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-2 py-1.5"
                          >
                            <option value="">Choisir…</option>
                            {activeInternals.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                      {selected.accessStatus === "ACTIVE" ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            void patchMember(selected.id, { accessStatus: "SUSPENDED" })
                          }
                          className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-900"
                        >
                          Suspendre
                        </button>
                      ) : null}
                      {selected.accessStatus === "SUSPENDED" ||
                      selected.accessStatus === "DISABLED" ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            void patchMember(selected.id, { accessStatus: "ACTIVE" })
                          }
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900"
                        >
                          Réactiver
                        </button>
                      ) : null}
                      {selected.accessStatus !== "DISABLED" ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Désactiver l’accès ? L’historique est conservé.",
                              )
                            ) {
                              void reassignThenDisable();
                            }
                          }}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                        >
                          Désactiver l’accès
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
                    Compte Direction — actions limitées.
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
