"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createWorksitePilotage } from "@/app/dashboard/pilotage-travaux/actions";
import { projectContractuelTabHref } from "@/lib/pilotage/project-links";
import { PILOTAGE_TEMPLATES } from "@/lib/pilotage/templates";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";

type ProjectOption = { id: string; title: string; clientName: string };
type UserOption = { id: string; name: string };

export function CreatePilotageForm({
  projects,
  staffUsers,
  defaultTemplateId,
  defaultProjectId,
}: {
  projects: ProjectOption[];
  staffUsers: UserOption[];
  defaultTemplateId?: string;
  defaultProjectId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const templateDefault =
    defaultTemplateId && PILOTAGE_TEMPLATES.some((t) => t.id === defaultTemplateId)
      ? defaultTemplateId
      : PILOTAGE_TEMPLATES[0]?.id;

  if (projects.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Aucun chantier disponible"
          description="Créez d’abord un chantier dans « Chantiers », ou tous ont déjà un suivi contractuel."
        />
        <div className="text-center">
          <a href="/dashboard/projets" className="btn-cc-primary inline-flex">
            Aller aux chantiers
          </a>
        </div>
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
          router.push(projectContractuelTabHref(res.projectId));
          router.refresh();
        });
      }}
    >
      <Card hover={false}>
        <CardHeader title="1 — Chantier et marché" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Select
              name="projectId"
              label="Chantier existant *"
              required
              defaultValue={
                defaultProjectId && projects.some((p) => p.id === defaultProjectId)
                  ? defaultProjectId
                  : ""
              }
            >
              <option value="">Sélectionner…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — {p.clientName}
                </option>
              ))}
            </Select>
          </div>
          <Field name="internalRef" label="Référence interne" />
          <Field name="lot" label="Lot" placeholder="ex. Gros œuvre" />
          <Field name="corpsEtat" label="Corps d’état" />
          <Field name="marketAmountHt" label="Montant marché HT (€)" type="number" />
          <Field name="notificationDate" label="Date de notification" type="date" />
          <Field name="startDate" label="Date de démarrage" type="date" />
          <Field name="contractualDurationDays" label="Durée contractuelle (jours)" type="number" />
          <Field name="plannedEndDate" label="Fin prévisionnelle" type="date" />
        </div>
      </Card>

      <Card hover={false}>
        <CardHeader title="2 — Intervenants" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select name="conducteurId" label="Conducteur de travaux">
            <option value="">—</option>
            {staffUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <Select name="assistantId" label="Assistant BeWork">
            <option value="">—</option>
            {staffUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <Field name="clientContactName" label="Responsable client" />
          <Field name="maitreOuvrage" label="Maître d’ouvrage" />
          <Field name="maitreOeuvre" label="Maître d’œuvre" />
          <Field name="bureauControle" label="Bureau de contrôle" />
          <Field name="coordinateurSps" label="Coordonnateur SPS" />
        </div>
        <div className="mt-4">
          <Textarea name="description" label="Observations" rows={3} />
        </div>
      </Card>

      <Card hover={false}>
        <CardHeader
          title="3 — Structure initiale"
          description="Les modèles proposent des éléments à adapter. Ils ne deviennent pas des obligations contractuelles sans validation humaine."
        />
        <label className="flex items-start gap-2 text-sm text-bework-ink">
          <input type="checkbox" name="applyTemplate" value="1" defaultChecked className="mt-1" />
          <span>
            Générer la structure à partir d’un modèle
            <select
              name="templateId"
              defaultValue={templateDefault}
              className="ml-2 rounded-[var(--cc-radius)] border border-[color:var(--cc-chrome-border)] px-2 py-1 text-sm"
            >
              {PILOTAGE_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </span>
        </label>
      </Card>

      {error ? <Alert tone="critical">{error}</Alert> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Activation…" : "Activer le suivi contractuel"}
        </Button>
        <a href="/dashboard/pilotage-travaux" className="btn-cc-secondary">
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
    <Input
      name={name}
      label={label}
      type={type}
      placeholder={placeholder}
      step={type === "number" ? "0.01" : undefined}
    />
  );
}
