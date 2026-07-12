"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createWorksitePilotage } from "@/app/dashboard/pilotage-travaux/actions";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";
import { PILOTAGE_TEMPLATES } from "@/lib/pilotage/templates";

type ProjectOption = { id: string; title: string; clientName: string };
type UserOption = { id: string; name: string };

export function CreatePilotageForm({
  projects,
  staffUsers,
}: {
  projects: ProjectOption[];
  staffUsers: UserOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm font-semibold text-slate-700">Aucun chantier disponible</p>
        <p className="mt-1 text-sm text-slate-500">
          Créez d’abord un chantier dans « Chantiers », ou tous les chantiers ont déjà un pilotage.
        </p>
        <a href="/dashboard/projets" className="mt-4 inline-flex rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">
          Aller aux chantiers
        </a>
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await createWorksitePilotage(fd);
          if (!res.ok) {
            setError(res.error);
            return;
          }
          router.push(`${PILOTAGE_LIST_PATH}/${res.id}`);
          router.refresh();
        });
      }}
    >
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">1 — Chantier et marché</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold text-slate-700">Chantier existant *</span>
            <select name="projectId" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Sélectionner…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — {p.clientName}
                </option>
              ))}
            </select>
          </label>
          <Field name="internalRef" label="Référence interne" />
          <Field name="lot" label="Lot" placeholder="ex. Gros œuvre" />
          <Field name="corpsEtat" label="Corps d’état" />
          <Field name="marketAmountHt" label="Montant marché HT (€)" type="number" />
          <Field name="notificationDate" label="Date de notification" type="date" />
          <Field name="startDate" label="Date de démarrage" type="date" />
          <Field name="contractualDurationDays" label="Durée contractuelle (jours)" type="number" />
          <Field name="plannedEndDate" label="Fin prévisionnelle" type="date" />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">2 — Intervenants</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Conducteur de travaux</span>
            <select name="conducteurId" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">—</option>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Assistant BeWork</span>
            <select name="assistantId" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">—</option>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <Field name="clientContactName" label="Responsable client" />
          <Field name="maitreOuvrage" label="Maître d’ouvrage" />
          <Field name="maitreOeuvre" label="Maître d’œuvre" />
          <Field name="bureauControle" label="Bureau de contrôle" />
          <Field name="coordinateurSps" label="Coordonnateur SPS" />
        </div>
        <label className="mt-4 block text-sm">
          <span className="font-semibold text-slate-700">Observations</span>
          <textarea name="description" rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </label>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">3 — Structure initiale</h2>
        <p className="mt-1 text-sm text-slate-600">
          Les modèles proposent des éléments à adapter. Ils ne deviennent pas des obligations contractuelles sans validation humaine.
        </p>
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input type="checkbox" name="applyTemplate" value="1" defaultChecked className="mt-1" />
          <span>
            Générer la structure à partir d’un modèle
            <select name="templateId" className="ml-2 rounded-lg border border-slate-200 px-2 py-1 text-sm">
              {PILOTAGE_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </span>
        </label>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-60"
        >
          {pending ? "Création…" : "Créer le pilotage"}
        </button>
        <a href={PILOTAGE_LIST_PATH} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700">
          Annuler
        </a>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        step={type === "number" ? "0.01" : undefined}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
    </label>
  );
}
