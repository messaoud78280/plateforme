"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PERMISSION_PROFILE_LABELS, type PermissionProfileKey } from "@/lib/equipe-acces/types";

type Props = {
  token: string;
  email: string;
  role: string;
  permissionProfile?: string | null;
  companyName?: string | null;
  projectTitles?: string[];
  inviteeName?: string | null;
};

export function AcceptInvitationForm({
  token,
  email,
  role,
  permissionProfile,
  companyName,
  projectTitles = [],
  inviteeName,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(inviteeName ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleLabel =
    permissionProfile && permissionProfile in PERMISSION_PROFILE_LABELS
      ? PERMISSION_PROFILE_LABELS[permissionProfile as PermissionProfileKey]
      : role === "ADMIN"
        ? "Direction"
        : role === "SUPERVISEUR"
          ? "Conducteur de travaux"
          : "Collaborateur";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !password || password.length < 8) {
      setError("Nom requis et mot de passe d'au moins 8 caractères.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/accept-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'acceptation.");
        setLoading(false);
        return;
      }
      const q = new URLSearchParams({
        role: roleLabel,
        company: companyName ?? "",
        projects: projectTitles.slice(0, 8).join(" · "),
      });
      router.push(`/invitation/bienvenue?${q.toString()}`);
      router.refresh();
    } catch {
      setError("Erreur de connexion.");
    }
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold text-[#1e3a5f]">Activer votre compte</h1>
      <p className="mt-2 text-sm text-slate-600">
        {companyName ? (
          <>
            Bienvenue chez <strong>{companyName}</strong>.
          </>
        ) : (
          "Vous avez été invité à rejoindre BeWork."
        )}
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Votre rôle : <strong>{roleLabel}</strong>
      </p>
      {projectTitles.length > 0 ? (
        <p className="mt-1 text-sm text-slate-500">
          Accès : {projectTitles.slice(0, 5).join(" · ")}
          {projectTitles.length > 5 ? "…" : ""}
        </p>
      ) : null}
      <p className="mt-1 text-sm text-slate-500">Email : {email}</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
            Votre nom
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-800 focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            Mot de passe (min. 8 caractères)
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-800 focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#1d4ed8] py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50"
        >
          {loading ? "Création du compte…" : "Créer mon mot de passe"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link href="/connexion" className="text-[#1d4ed8] hover:underline">
          Déjà un compte ? Se connecter
        </Link>
      </p>
    </div>
  );
}
