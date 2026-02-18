"use client";

import { useState } from "react";

interface ProfileFormProps {
  initialName: string;
  email: string;
}

export function ProfileForm({ initialName, email }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setMessage("Le nom doit contenir au moins 2 caractères.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Erreur lors de la mise à jour.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setMessage("Profil enregistré. Le nom en haut de page sera mis à jour après reconnexion.");
    } catch {
      setMessage("Erreur de connexion.");
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="settings-name" className="mb-1 block text-sm font-medium text-slate-700">
          Nom affiché
        </label>
        <input
          id="settings-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={status === "loading"}
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
          placeholder="Votre nom"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <p className="text-slate-600">{email}</p>
        <p className="mt-1 text-xs text-slate-500">L’email ne peut pas être modifié ici.</p>
      </div>
      {message && (
        <p
          className={`text-sm ${status === "success" ? "text-green-600" : "text-red-600"}`}
          role="alert"
        >
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {status === "loading" ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
