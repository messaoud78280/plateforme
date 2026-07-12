"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DemoAccessCodeForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-md space-y-4 py-16">
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-950">
        Démonstration BeWork — Données fictives
      </p>
      <h1 className="text-xl font-bold text-slate-900">Code d’accès requis</h1>
      <p className="text-sm text-slate-600">Saisissez le code fourni par votre interlocuteur BeWork.</p>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const code = new FormData(e.currentTarget).get("code");
          startTransition(async () => {
            const res = await fetch(`/api/demo-pilotage/${token}/unlock`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code }),
            });
            if (!res.ok) {
              setError("Code incorrect ou lien invalide.");
              return;
            }
            router.refresh();
          });
        }}
      >
        <input
          name="code"
          type="password"
          required
          autoComplete="one-time-code"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Code"
        />
        {error ? <p className="text-xs text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Vérification…" : "Accéder à la démonstration"}
        </button>
      </form>
    </div>
  );
}
