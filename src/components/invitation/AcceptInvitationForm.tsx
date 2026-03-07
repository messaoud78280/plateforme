"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  USER: "Utilisateur",
  SUPERVISEUR: "Superviseur",
};

type Props = { token: string; email: string; role: string };

export function AcceptInvitationForm({ token, email, role }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      router.push("/connexion?accepted=1");
      router.refresh();
    } catch {
      setError("Erreur de connexion.");
    }
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold text-slate-800">Rejoindre l&apos;équipe</h1>
      <p className="mt-2 text-sm text-slate-600">
        Vous avez été invité en tant que <strong>{ROLE_LABELS[role] ?? role}</strong>.
      </p>
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
          {loading ? "Création du compte…" : "Accepter et créer mon compte"}
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
