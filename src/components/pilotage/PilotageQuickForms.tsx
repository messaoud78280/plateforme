"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createBlocker,
  createExtraWork,
  createMarketDocument,
  createPilotageAction,
  createPilotageObligation,
  createPlanRegister,
  createRequiredDocument,
  createSubcontractor,
  createWorkSituation,
  ensureDefaultMilestones,
  generatePilotageReport,
  resolveBlocker,
  updateDoeItemStatus,
  updateMilestoneStatus,
  updatePilotageActionStatus,
} from "@/app/dashboard/pilotage-travaux/actions";
import { MARKET_DOC_TYPES } from "@/lib/pilotage/constants";
import { StatusBadge } from "./PilotageBadges";

type Props = { pilotageId: string; canEdit: boolean };

export function QuickAddBlocker({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Signaler un blocage"
      emptyHint="Aucun blocage signalé."
      fields={[
        { name: "title", label: "Sujet *", required: true },
        {
          name: "severity",
          label: "Niveau",
          options: ["Critique", "Important", "À surveiller"],
          defaultValue: "Important",
        },
        { name: "consequence", label: "Conséquence" },
        { name: "nextAction", label: "Prochaine action" },
        { name: "internalOwner", label: "Responsable interne" },
        { name: "externalDecider", label: "Décideur externe" },
        { name: "nextFollowUpAt", label: "Prochaine relance", type: "date" },
      ]}
      onSubmit={async (fd) => {
        fd.set("pilotageId", pilotageId);
        return createBlocker(fd);
      }}
    />
  );
}

export function ResolveBlockerButton({ blockerId, canEdit }: { blockerId: string; canEdit: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (!canEdit) return null;
  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 disabled:opacity-60"
      onClick={() => {
        const fd = new FormData();
        fd.set("blockerId", blockerId);
        startTransition(async () => {
          await resolveBlocker(fd);
          router.refresh();
        });
      }}
    >
      {pending ? "…" : "Résoudre"}
    </button>
  );
}

export function MilestoneStatusSelect({
  milestoneId,
  status,
  canEdit,
}: {
  milestoneId: string;
  status: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (!canEdit) return <StatusBadge status={status} />;
  return (
    <select
      disabled={pending}
      defaultValue={status}
      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
      onChange={(e) => {
        const fd = new FormData();
        fd.set("milestoneId", milestoneId);
        fd.set("status", e.target.value);
        startTransition(async () => {
          await updateMilestoneStatus(fd);
          router.refresh();
        });
      }}
    >
      {[
        "Non démarré",
        "À préparer",
        "Prêt",
        "En cours",
        "Bloqué",
        "Atteint",
        "Reporté",
        "Annulé",
        "Non applicable",
      ].map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export function EnsureMilestonesButton({ pilotageId, canEdit }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (!canEdit) return null;
  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#1e3a5f] disabled:opacity-60"
      onClick={() => {
        startTransition(async () => {
          await ensureDefaultMilestones(pilotageId);
          router.refresh();
        });
      }}
    >
      {pending ? "Initialisation…" : "Initialiser les jalons types"}
    </button>
  );
}

export function QuickAddObligation({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Ajouter une obligation"
      emptyHint="Aucune obligation contractuelle. Ajoutez-en une manuellement ou via un modèle à la création."
      fields={[
        { name: "title", label: "Titre *", required: true },
        { name: "category", label: "Catégorie", defaultValue: "Contractuel" },
        { name: "priority", label: "Priorité", defaultValue: "Normale" },
        { name: "dueDate", label: "Échéance", type: "date" },
        { name: "responsibleName", label: "Responsable" },
      ]}
      onSubmit={async (fd) => createPilotageObligation(pilotageId, fd)}
    />
  );
}

export function QuickAddAction({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Ajouter une action"
      emptyHint="Aucune action. Créez une relance ou une tâche liée au chantier."
      fields={[
        { name: "title", label: "Titre *", required: true },
        { name: "category", label: "Catégorie", defaultValue: "Document" },
        { name: "priority", label: "Priorité", defaultValue: "Normale" },
        { name: "dueDate", label: "Échéance", type: "date" },
        { name: "assigneeName", label: "Responsable" },
      ]}
      onSubmit={async (fd) => createPilotageAction(pilotageId, fd)}
    />
  );
}

export function QuickAddRequiredDoc({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Ajouter un document à remettre"
      emptyHint="Aucun document à remettre. Ajoutez manuellement un document ou utilisez un modèle de checklist."
      fields={[
        { name: "name", label: "Nom *", required: true },
        { name: "category", label: "Catégorie", defaultValue: "Administratif" },
        { name: "dueDate", label: "Date limite", type: "date" },
        { name: "producerName", label: "Producteur" },
      ]}
      onSubmit={async (fd) => createRequiredDocument(pilotageId, fd)}
    />
  );
}

export function QuickAddMarketDoc({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Ajouter une pièce marché"
      emptyHint="Aucune pièce marché enregistrée."
      fields={[
        { name: "title", label: "Titre *", required: true },
        {
          name: "docType",
          label: "Type *",
          required: true,
          options: [...MARKET_DOC_TYPES],
        },
        { name: "indice", label: "Indice" },
        { name: "version", label: "Version" },
        { name: "emitter", label: "Émetteur" },
        { name: "documentDate", label: "Date document", type: "date" },
        { name: "fileUrl", label: "URL fichier (optionnel)" },
      ]}
      onSubmit={async (fd) => createMarketDocument(pilotageId, fd)}
    />
  );
}

export function QuickAddPlan({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Ajouter un plan"
      emptyHint="Aucun plan enregistré."
      fields={[
        { name: "reference", label: "Référence *", required: true },
        { name: "title", label: "Titre *", required: true },
        { name: "planType", label: "Type" },
        { name: "indice", label: "Indice", defaultValue: "A" },
        { name: "visaDueDate", label: "Visa attendu", type: "date" },
      ]}
      onSubmit={async (fd) => createPlanRegister(pilotageId, fd)}
    />
  );
}

export function QuickAddSubcontractor({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Ajouter un sous-traitant"
      emptyHint="Aucun sous-traitant. L’alerte administrative n’empêche pas l’intervention réelle."
      fields={[
        { name: "companyName", label: "Entreprise *", required: true },
        { name: "siren", label: "SIREN / SIRET" },
        { name: "prestation", label: "Prestation" },
        { name: "amountHt", label: "Montant HT", type: "number" },
        { name: "contactName", label: "Contact" },
        { name: "email", label: "Email" },
      ]}
      onSubmit={async (fd) => createSubcontractor(pilotageId, fd)}
    />
  );
}

export function QuickAddSituation({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Ajouter une situation"
      emptyHint="Aucune situation de travaux. Suivi administratif uniquement (pas de comptabilité)."
      fields={[
        { name: "number", label: "N° situation *", required: true },
        { name: "periodLabel", label: "Période" },
        { name: "requestedHt", label: "Montant demandé HT", type: "number" },
        { name: "validatedHt", label: "Montant validé HT", type: "number" },
        { name: "paidHt", label: "Montant payé HT", type: "number" },
        { name: "preparedAt", label: "Date préparation", type: "date" },
      ]}
      onSubmit={async (fd) => createWorkSituation(pilotageId, fd)}
    />
  );
}

export function QuickAddExtraWork({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Ajouter des travaux supplémentaires"
      emptyHint="Aucun TS enregistré."
      fields={[
        { name: "description", label: "Description *", required: true },
        { name: "reference", label: "Référence" },
        { name: "requester", label: "Demandeur" },
        { name: "estimatedHt", label: "Montant estimé HT", type: "number" },
        { name: "requestedAt", label: "Date demande", type: "date" },
      ]}
      extra={
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="writtenValidation" value="1" />
            Validation écrite obtenue
          </label>
          <label className="flex items-center gap-2 text-red-700">
            <input type="checkbox" name="startedWithoutValidation" value="1" />
            Travaux commencés sans validation écrite
          </label>
        </div>
      }
      onSubmit={async (fd) => createExtraWork(pilotageId, fd)}
    />
  );
}

export function ActionStatusButtons({
  actionId,
  status,
  canEdit,
}: {
  actionId: string;
  status: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (!canEdit) return <StatusBadge status={status} />;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge status={status} />
      {status !== "Terminée" ? (
        <button
          type="button"
          disabled={pending}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800"
          onClick={() =>
            startTransition(async () => {
              await updatePilotageActionStatus(actionId, "Terminée");
              router.refresh();
            })
          }
        >
          Terminer
        </button>
      ) : null}
      {status === "À faire" ? (
        <button
          type="button"
          disabled={pending}
          className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-800"
          onClick={() =>
            startTransition(async () => {
              await updatePilotageActionStatus(actionId, "En cours");
              router.refresh();
            })
          }
        >
          Démarrer
        </button>
      ) : null}
    </div>
  );
}

export function DoeStatusSelect({
  itemId,
  status,
  canEdit,
}: {
  itemId: string;
  status: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (!canEdit) return <StatusBadge status={status} />;
  return (
    <select
      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          await updateDoeItemStatus(itemId, next);
          router.refresh();
        });
      }}
    >
      {["Manquant", "À demander", "Reçu", "À vérifier", "À corriger", "Conforme", "Non applicable"].map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export function GenerateReportButton({ pilotageId }: { pilotageId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className="rounded-xl border border-[#1e3a5f]/30 bg-white px-4 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-slate-50 disabled:opacity-60"
        onClick={() =>
          startTransition(async () => {
            const res = await generatePilotageReport(pilotageId);
            setMsg(res.ok ? "Rapport généré et archivé." : res.error);
            router.refresh();
          })
        }
      >
        {pending ? "Génération…" : "Générer un rapport"}
      </button>
      {msg ? <p className="mt-2 text-xs text-slate-600">{msg}</p> : null}
    </div>
  );
}

type FieldDef = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  options?: string[];
};

function QuickForm({
  canEdit,
  title,
  emptyHint,
  fields,
  extra,
  onSubmit,
}: {
  canEdit: boolean;
  title: string;
  emptyHint: string;
  fields: FieldDef[];
  extra?: React.ReactNode;
  onSubmit: (fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canEdit) {
    return <p className="text-xs text-slate-500">{emptyHint}</p>;
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-semibold text-[#1e3a5f] hover:underline"
        >
          + {title}
        </button>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const res = await onSubmit(fd);
              if (!res.ok) {
                setError(res.error);
                return;
              }
              setOpen(false);
              router.refresh();
            });
          }}
        >
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <label key={f.name} className="block text-xs">
                <span className="font-semibold text-slate-600">{f.label}</span>
                {f.options ? (
                  <select
                    name={f.name}
                    required={f.required}
                    defaultValue={f.defaultValue}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  >
                    <option value="">—</option>
                    {f.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={f.name}
                    type={f.type ?? "text"}
                    required={f.required}
                    defaultValue={f.defaultValue}
                    step={f.type === "number" ? "0.01" : undefined}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                )}
              </label>
            ))}
          </div>
          {extra}
          {error ? <p className="text-xs text-red-700">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-600">
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
