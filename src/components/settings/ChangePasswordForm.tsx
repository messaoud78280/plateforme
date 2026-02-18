"use client";

import { useState } from "react";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (newPassword.length < 8) {
      setMessage("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      setStatus("error");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Les deux mots de passe ne correspondent pas.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Erreur lors du changement.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setMessage("Mot de passe mis à jour. Vous pouvez vous déconnecter et vous reconnecter.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setMessage("Erreur de connexion.");
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="current-password" className="mb-1 block text-sm font-medium text-slate-700">
          Mot de passe actuel
        </label>
        <input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={status === "loading"}
          required
          autoComplete="current-password"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
        />
      </div>
      <div>
        <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-slate-700">
          Nouveau mot de passe
        </label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={status === "loading"}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
        />
        <p className="mt-1 text-xs text-slate-500">Minimum 8 caractères.</p>
      </div>
      <div>
        <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-slate-700">
          Confirmer le nouveau mot de passe
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={status === "loading"}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
        />
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
        {status === "loading" ? "Modification…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}
