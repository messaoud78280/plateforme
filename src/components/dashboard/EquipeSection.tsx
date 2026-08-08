"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ACCESS_STATUS_LABELS,
  PERSON_TYPE_LABELS,
  PERMISSION_PROFILE_LABELS,
  PERSON_TYPES,
  defaultProfileForPersonType,
  personTypesForTab,
  profilesForPersonType,
  type AccessStatus,
  type EquipeTab,
  type PersonType,
  type PermissionProfileKey,
} from "@/lib/equipe-acces/types";

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
  teamRole: string | null;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
  createdAt: string;
  invitedById: string | null;
  isOwner: boolean;
  externalOrganization: { id: string; name: string; type: string } | null;
  projects: { id: string; title: string }[];
};

type InvitationItem = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  personType?: string | null;
  permissionProfile?: string | null;
  companyName?: string | null;
};

const TABS: { id: EquipeTab; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "personnel", label: "Personnel" },
  { id: "clients", label: "Clients" },
  { id: "fournisseurs", label: "Fournisseurs" },
  { id: "sous-traitants", label: "Sous-traitants" },
  { id: "partenaires", label: "Partenaires" },
  { id: "invitations", label: "Invitations" },
];

function statusBadgeClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "INVITED":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "SUSPENDED":
      return "bg-orange-50 text-orange-800 border-orange-200";
    case "DISABLED":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export function EquipeSection() {
  const [tab, setTab] = useState<EquipeTab>("tous");
  const [q, setQ] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Formulaire ajout
  const [personType, setPersonType] = useState<PersonType>("INTERNAL");
  const [permissionProfile, setPermissionProfile] = useState<PermissionProfileKey>("CONDUCTEUR");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [mode, setMode] = useState<"invite" | "create">("invite");
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [acceptUrl, setAcceptUrl] = useState("");

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
    load();
  }, [load]);

  useEffect(() => {
    setPermissionProfile(defaultProfileForPersonType(personType));
  }, [personType]);

  const filteredMembers = useMemo(() => {
    const types = personTypesForTab(tab);
    const query = q.trim().toLowerCase();
    return members.filter((m) => {
      if (types) {
        const pt = m.personType ?? (m.isOwner || !m.invitedById ? "INTERNAL" : "INTERNAL");
        if (!types.includes(pt as PersonType)) return false;
      }
      if (!query) return true;
      const hay = [
        m.name,
        m.email,
        m.company,
        m.jobTitle,
        m.externalOrganization?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [members, tab, q]);

  const pendingInvites = useMemo(
    () =>
      invitations.filter(
        (i) => i.status === "PENDING" && new Date(i.expiresAt) > new Date()
      ),
    [invitations]
  );

  const selected = members.find((m) => m.id === selectedId) ?? null;

  function resetForm() {
    setEmail("");
    setFirstName("");
    setLastName("");
    setCompanyName("");
    setPhone("");
    setJobTitle("");
    setProjectIds([]);
    setMode("invite");
    setPersonType("INTERNAL");
    setTempPassword("");
    setAcceptUrl("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setTempPassword("");
    setAcceptUrl("");
    if (!email.trim()) {
      setError("Indiquez l’email.");
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
          projectIds,
          mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l’ajout.");
        setLoading(false);
        return;
      }
      if (data.kind === "create" && data.temporaryPassword) {
        setTempPassword(data.temporaryPassword);
        setSuccess(data.message ?? "Compte créé.");
      } else {
        setAcceptUrl(data.acceptUrl ?? "");
        setSuccess(`Invitation prête pour ${data.email}.`);
      }
      resetForm();
      setShowForm(false);
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
      if (!res.ok) {
        setError(data.error ?? "Action impossible.");
      } else {
        setSuccess("Mise à jour enregistrée.");
        await load();
      }
    } catch {
      setError("Erreur de connexion.");
    }
    setActionLoading(false);
  }

  async function resetPassword(userId: string) {
    setActionLoading(true);
    setError("");
    setTempPassword("");
    try {
      const res = await fetch(`/api/equipe/${userId}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Réinitialisation impossible.");
      } else {
        setTempPassword(data.temporaryPassword ?? "");
        setSuccess(data.message ?? "Mot de passe réinitialisé.");
      }
    } catch {
      setError("Erreur de connexion.");
    }
    setActionLoading(false);
  }

  async function resendInvite(id: string) {
    setActionLoading(true);
    setError("");
    setAcceptUrl("");
    try {
      const res = await fetch(`/api/equipe/invitations/${id}/resend`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Renvoi impossible.");
      } else {
        setAcceptUrl(data.acceptUrl ?? "");
        setSuccess(`Lien renouvelé pour ${data.email}.`);
        await load();
      }
    } catch {
      setError("Erreur de connexion.");
    }
    setActionLoading(false);
  }

  function toggleProject(id: string) {
    setProjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const profileOptions = profilesForPersonType(personType);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-[#1e3a5f] text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t.label}
              {t.id === "invitations" && pendingInvites.length > 0 ? (
                <span className="ml-1.5 rounded-full bg-amber-400/90 px-1.5 text-xs text-slate-900">
                  {pendingInvites.length}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        {tab !== "invitations" ? (
          <button
            type="button"
            onClick={() => {
              setShowForm((v) => !v);
              setError("");
              setSuccess("");
            }}
            className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]"
          >
            {showForm ? "Fermer" : "+ Ajouter"}
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <p>{success}</p>
          {acceptUrl ? (
            <>
              <p className="mt-2 font-medium">Lien à partager :</p>
              <p className="mt-1 break-all font-mono text-xs">{acceptUrl}</p>
            </>
          ) : null}
          {tempPassword ? (
            <>
              <p className="mt-2 font-medium">Mot de passe temporaire (à copier maintenant) :</p>
              <p className="mt-1 break-all font-mono text-sm font-semibold">{tempPassword}</p>
            </>
          ) : null}
        </div>
      ) : null}

      {showForm ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">Ajouter un utilisateur</h2>
          <p className="mt-1 text-sm text-slate-500">
            Type → infos → profil → chantiers partagés. Les externes ne voient que les chantiers
            sélectionnés.
          </p>
          <form onSubmit={handleAdd} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select
                value={personType}
                onChange={(e) => setPersonType(e.target.value as PersonType)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
              >
                {PERSON_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PERSON_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Profil</label>
              <select
                value={permissionProfile}
                onChange={(e) => setPermissionProfile(e.target.value as PermissionProfileKey)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
              >
                {profileOptions.map((p) => (
                  <option key={p} value={p}>
                    {PERMISSION_PROFILE_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Prénom</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Organisation / entreprise
              </label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={personType === "INTERNAL" ? "Optionnel" : "Ex. Point.P, ABC Promotion"}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fonction</label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Téléphone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Mode d’accès</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "invite" | "create")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="invite">Invitation par lien</option>
                <option value="create">Créer + mot de passe temporaire</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Chantiers partagés
                {personType !== "INTERNAL" ? (
                  <span className="ml-1 text-amber-700">(obligatoire pour externe)</span>
                ) : (
                  <span className="ml-1 text-slate-400">(optionnel — sinon accès org)</span>
                )}
              </p>
              {projects.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun chantier — créez-en un d’abord.</p>
              ) : (
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={projectIds.includes(p.id)}
                          onChange={() => toggleProject(p.id)}
                        />
                        <span>
                          {p.title}
                          {p.siteCity ? (
                            <span className="text-slate-400"> · {p.siteCity}</span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-[#1d4ed8] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Enregistrement…" : mode === "invite" ? "Envoyer l’invitation" : "Créer le compte"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {tab === "invitations" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">Invitations en attente</h2>
          {loadingList ? (
            <p className="mt-4 text-slate-500">Chargement…</p>
          ) : pendingInvites.length === 0 ? (
            <p className="mt-4 text-slate-500">Aucune invitation en attente.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {pendingInvites.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-800">{inv.email}</p>
                    <p className="text-sm text-slate-500">
                      {inv.personType
                        ? PERSON_TYPE_LABELS[inv.personType as PersonType] ?? inv.personType
                        : "Personnel"}
                      {inv.companyName ? ` · ${inv.companyName}` : ""}
                      {" · Expire le "}
                      {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => resendInvite(inv.id)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Renvoyer le lien
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-[#1e3a5f]">Utilisateurs</h2>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher nom, email, org…"
                className="ml-auto min-w-[200px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            {loadingList ? (
              <p className="text-slate-500">Chargement…</p>
            ) : filteredMembers.length === 0 ? (
              <p className="text-slate-500">Aucun utilisateur dans cet onglet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-2 font-medium">Nom</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Profil</th>
                      <th className="pb-2 font-medium">Statut</th>
                      <th className="pb-2 font-medium">Chantiers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((m) => {
                      const pt = (m.personType as PersonType) || "INTERNAL";
                      const st = m.accessStatus as AccessStatus;
                      return (
                        <tr
                          key={m.id}
                          onClick={() => setSelectedId(m.id)}
                          className={`cursor-pointer border-b border-slate-50 hover:bg-slate-50 ${
                            selectedId === m.id ? "bg-blue-50/60" : ""
                          }`}
                        >
                          <td className="py-3 pr-2">
                            <p className="font-medium text-slate-800">
                              {m.name}
                              {m.isOwner ? (
                                <span className="ml-1 text-xs text-slate-400">(compte)</span>
                              ) : null}
                            </p>
                            <p className="text-xs text-slate-500">{m.email}</p>
                          </td>
                          <td className="py-3 pr-2 text-slate-600">
                            {PERSON_TYPE_LABELS[pt] ?? pt}
                          </td>
                          <td className="py-3 pr-2 text-slate-600">
                            {m.permissionProfile
                              ? PERMISSION_PROFILE_LABELS[
                                  m.permissionProfile as PermissionProfileKey
                                ] ?? m.permissionProfile
                              : "—"}
                          </td>
                          <td className="py-3 pr-2">
                            <span
                              className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(st)}`}
                            >
                              {ACCESS_STATUS_LABELS[st] ?? st}
                            </span>
                          </td>
                          <td className="py-3 text-slate-600">
                            {pt === "INTERNAL" && m.projects.length === 0
                              ? "Org"
                              : m.projects.length}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-4 lg:self-start">
            {!selected ? (
              <p className="text-sm text-slate-500">
                Sélectionnez un utilisateur pour voir la fiche et les actions.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-[#1e3a5f]">{selected.name}</h3>
                  <p className="text-sm text-slate-500">{selected.email}</p>
                  {selected.externalOrganization ? (
                    <p className="mt-1 text-sm text-slate-600">
                      {selected.externalOrganization.name}
                    </p>
                  ) : selected.company ? (
                    <p className="mt-1 text-sm text-slate-600">{selected.company}</p>
                  ) : null}
                  {selected.jobTitle ? (
                    <p className="text-sm text-slate-500">{selected.jobTitle}</p>
                  ) : null}
                </div>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Type</dt>
                    <dd>
                      {PERSON_TYPE_LABELS[(selected.personType as PersonType) || "INTERNAL"]}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Profil</dt>
                    <dd>
                      {selected.permissionProfile
                        ? PERMISSION_PROFILE_LABELS[
                            selected.permissionProfile as PermissionProfileKey
                          ]
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Dernière connexion</dt>
                    <dd>
                      {selected.lastLoginAt
                        ? new Date(selected.lastLoginAt).toLocaleDateString("fr-FR")
                        : "Jamais"}
                    </dd>
                  </div>
                </dl>
                {selected.projects.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Chantiers partagés
                    </p>
                    <ul className="mt-1 space-y-0.5 text-sm text-slate-700">
                      {selected.projects.map((p) => (
                        <li key={p.id}>· {p.title}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {!selected.isOwner ? (
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                    {selected.accessStatus === "ACTIVE" ? (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() =>
                          patchMember(selected.id, { accessStatus: "SUSPENDED" })
                        }
                        className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-900"
                      >
                        Suspendre
                      </button>
                    ) : null}
                    {selected.accessStatus === "SUSPENDED" ? (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() =>
                          patchMember(selected.id, { accessStatus: "ACTIVE" })
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
                              "Désactiver cet accès ? La personne ne pourra plus se connecter."
                            )
                          ) {
                            patchMember(selected.id, { accessStatus: "DISABLED" });
                          }
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                      >
                        Désactiver
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() =>
                          patchMember(selected.id, { accessStatus: "ACTIVE" })
                        }
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900"
                      >
                        Réactiver
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => resetPassword(selected.id)}
                      className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-sm font-medium text-white"
                    >
                      Réinitialiser le mot de passe
                    </button>
                  </div>
                ) : (
                  <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
                    Compte propriétaire — actions limitées (pas de suspension).
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
