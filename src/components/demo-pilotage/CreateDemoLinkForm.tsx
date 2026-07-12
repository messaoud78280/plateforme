"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createDemoPilotageLink } from "@/app/dashboard/demonstrations/actions";

export function CreateDemoLinkForm({ scenarios }: { scenarios: { id: string; label: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  return (
    <section className="pilotage-card p-5">
      <h2 className="text-sm font-bold text-slate-900">Créer une démonstration</h2>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setCreatedUrl(null);
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            const res = await createDemoPilotageLink(fd);
            if (!res.ok) {
              setError("Création impossible.");
              return;
            }
            const origin = window.location.origin;
            setCreatedUrl(`${origin}/demo/pilotage-travaux/${res.token}`);
            router.refresh();
          });
        }}
      >
        <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
          Scénario
          <select name="scenarioId" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal">
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <Field name="prospectCompany" label="Entreprise prospect" />
        <Field name="prospectName" label="Nom du contact" />
        <Field name="corpsEtat" label="Corps d’état" />
        <Field name="marketType" label="Type de marché" />
        <Field name="chantierCountApprox" label="Nb chantiers approx." />
        <Field name="mainPain" label="Difficulté principale" />
        <Field name="commercialName" label="Commercial BeWork" />
        <Field name="meetingDate" label="Date RDV" type="date" />
        <Field name="expiresInDays" label="Expiration (jours)" type="number" defaultValue="14" />
        <Field name="maxViews" label="Max consultations (optionnel)" type="number" />
        <Field name="accessCode" label="Code d’accès (optionnel)" />
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2">
          <input type="checkbox" name="logoAuthorized" value="1" />
          Logo prospect autorisé explicitement
        </label>
        <Field name="logoUrl" label="URL logo (si autorisé)" />
        {error ? <p className="text-xs text-red-700 sm:col-span-2">{error}</p> : null}
        {createdUrl ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 sm:col-span-2 break-all">
            Lien créé : {createdUrl}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2"
        >
          {pending ? "Création…" : "Générer le lien prospect"}
        </button>
      </form>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="text-xs font-semibold text-slate-600">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"
      />
    </label>
  );
}
