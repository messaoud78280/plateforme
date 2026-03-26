"use client";

import { useState, useEffect } from "react";

const ROLES = [
  { value: "Administrateur", label: "Administrateur" },
  { value: "Utilisateur", label: "Utilisateur" },
  { value: "Superviseur", label: "Superviseur" },
];
const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrateur",
  USER: "Utilisateur",
  SUPERVISEUR: "Superviseur",
};

type InvitationItem = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
};

export function EquipeSection() {
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Utilisateur");
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastAcceptUrl, setLastAcceptUrl] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/invitations");
        if (res.ok) {
          const data = await res.json();
          setInvitations(Array.isArray(data) ? data : []);
        }
      } finally {
        setLoadingList(false);
      }
    }
    load();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email.trim()) {
      setError("Indiquez l'email du collaborateur.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'envoi.");
        setLoading(false);
        return;
      }
      setEmail("");
      setLastAcceptUrl(data.acceptUrl ?? "");
      setSuccess(data.email ? `Invitation envoyée à ${data.email}.` : "Invitation envoyée.");
      const listRes = await fetch("/api/invitations");
      if (listRes.ok) setInvitations(await listRes.json());
    } catch {
      setError("Erreur de connexion.");
    }
    setLoading(false);
  }

  const pending = invitations.filter((i) => i.status === "PENDING" && new Date(i.expiresAt) > new Date());

  return (
    <div className="space-y-8">
      <section className="rounded-2xl surface-metallic-light p-6">
        <h2 className="text-lg font-semibold text-slate-800">Nouvelle invitation</h2>
        <form onSubmit={handleInvite} className="mt-4 flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label htmlFor="invite-email" className="mb-1 block text-sm font-medium text-slate-700">
              Email du collaborateur
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="collaborateur@entreprise.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
            />
          </div>
          <div className="w-48">
            <label htmlFor="invite-role" className="mb-1 block text-sm font-medium text-slate-700">
              Rôle
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50"
          >
            {loading ? "Envoi…" : "Envoyer l'invitation"}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <p>{success}</p>
            {lastAcceptUrl && (
              <>
                <p className="mt-2 font-medium">Lien à partager :</p>
                <p className="mt-1 break-all font-mono text-xs">{lastAcceptUrl}</p>
              </>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl surface-metallic-light p-6">
        <h2 className="text-lg font-semibold text-slate-800">Invitations en attente</h2>
        {loadingList ? (
          <p className="mt-4 text-slate-500">Chargement…</p>
        ) : pending.length === 0 ? (
          <p className="mt-4 text-slate-500">Aucune invitation en attente.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {pending.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3"
              >
                <span className="font-medium text-slate-800">{inv.email}</span>
                <span className="text-sm text-slate-500">
                  {ROLE_LABEL[inv.role] ?? ROLES.find((r) => r.value === inv.role)?.label ?? inv.role} · Expire le{" "}
                  {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
