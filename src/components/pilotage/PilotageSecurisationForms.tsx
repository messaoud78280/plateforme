"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createDelayEvent,
  createEmbeddedElement,
  createLessonLearned,
  createMeetingPreparation,
  createNonConformity,
  createPilotagePhoto,
  createPricingAssumption,
  createSensitiveDeadline,
  createSensitiveWork,
  createTimelineEvent,
  createTradeInterface,
  ensureHandoverChecklist,
} from "@/app/dashboard/pilotage-travaux/securisation-actions";

type Props = { pilotageId: string; canEdit: boolean };

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
  fields,
  onSubmit,
}: {
  canEdit: boolean;
  title: string;
  fields: FieldDef[];
  onSubmit: (fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canEdit) return null;

  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-[#1e3a5f] hover:underline">
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
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                )}
              </label>
            ))}
          </div>
          {error ? <p className="text-xs text-red-700">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500">
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function QuickAddSensitiveDeadline({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Échéance sensible"
      fields={[
        { name: "title", label: "Titre *", required: true },
        {
          name: "deadlineType",
          label: "Type *",
          required: true,
          options: [
            "Réponse OS",
            "Émettre une réserve",
            "Contester un CR",
            "Transmettre une situation",
            "Demande de paiement",
            "Transmission document",
            "Agrément sous-traitant",
            "Remise DOE",
            "Levée de réserves",
            "Réponse à une demande",
            "Assurance / attestation",
            "Autre",
          ],
        },
        { name: "dueAt", label: "Date limite", type: "date" },
        { name: "responsibleName", label: "Responsable" },
        {
          name: "sourceType",
          label: "Source",
          options: ["Saisie manuelle", "Extraction document", "Compte rendu", "Modèle BeWork"],
          defaultValue: "Saisie manuelle",
        },
        { name: "articleRef", label: "Article" },
        { name: "priority", label: "Priorité", options: ["Normale", "Haute", "Critique"], defaultValue: "Haute" },
      ]}
      onSubmit={async (fd) => {
        fd.set("pilotageId", pilotageId);
        return createSensitiveDeadline(fd);
      }}
    />
  );
}

export function QuickAddPricingAssumption({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Hypothèse de chiffrage"
      fields={[
        { name: "title", label: "Titre *", required: true },
        {
          name: "category",
          label: "Catégorie",
          options: ["Accès", "Organisation", "Moyens", "Quantités", "Périmètre", "Sous-traitance", "Autre"],
          defaultValue: "Organisation",
        },
        { name: "lot", label: "Lot" },
        { name: "assumedValue", label: "Valeur retenue" },
        { name: "justification", label: "Justification" },
        {
          name: "verificationStatus",
          label: "Statut",
          options: ["Hypothèse d’étude", "À vérifier", "Confirmée", "Différente de la réalité", "À chiffrer", "À formaliser"],
          defaultValue: "Hypothèse d’étude",
        },
      ]}
      onSubmit={async (fd) => {
        fd.set("pilotageId", pilotageId);
        return createPricingAssumption(fd);
      }}
    />
  );
}

export function EnsureHandoverButton({ pilotageId, canEdit }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (!canEdit) return null;
  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
      onClick={() =>
        startTransition(async () => {
          await ensureHandoverChecklist(pilotageId);
          router.refresh();
        })
      }
    >
      {pending ? "…" : "Compléter / initialiser la passation"}
    </button>
  );
}

export function QuickAddTradeInterface({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Interface entre lots"
      fields={[
        { name: "primaryLot", label: "Lot principal *", required: true },
        { name: "relatedLot", label: "Lot associé *", required: true },
        { name: "subject", label: "Sujet *", required: true },
        { name: "whoSupplies", label: "Qui fournit" },
        { name: "whoInstalls", label: "Qui pose" },
        { name: "whoPrepares", label: "Qui prépare" },
        { name: "whoValidates", label: "Qui valide" },
        { name: "dueAt", label: "Date limite", type: "date" },
        { name: "riskLevel", label: "Risque", options: ["Faible", "Modéré", "Élevé", "Critique"], defaultValue: "Modéré" },
      ]}
      onSubmit={async (fd) => {
        fd.set("pilotageId", pilotageId);
        return createTradeInterface(fd);
      }}
    />
  );
}

export function QuickAddEmbeddedElement({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Réservation / incorporation"
      fields={[
        { name: "title", label: "Titre *", required: true },
        {
          name: "elementType",
          label: "Type",
          options: [
            "Réservation",
            "Trémie",
            "Fourreau",
            "Attente",
            "Insert",
            "Platine",
            "Passage réseaux",
            "Incorporation électrique",
            "Scellement",
            "Autre",
          ],
          defaultValue: "Réservation",
        },
        { name: "requestingLot", label: "Lot demandeur" },
        { name: "executingLot", label: "Lot exécutant" },
        { name: "zone", label: "Zone" },
        { name: "pourAt", label: "Date coulage / fermeture", type: "date" },
        { name: "dueAt", label: "Date limite", type: "date" },
        { name: "responsibleName", label: "Responsable" },
      ]}
      onSubmit={async (fd) => {
        fd.set("pilotageId", pilotageId);
        return createEmbeddedElement(fd);
      }}
    />
  );
}

export function QuickAddSensitiveWork({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Ouvrage sensible"
      fields={[
        { name: "title", label: "Ouvrage *", required: true },
        { name: "lot", label: "Lot" },
        { name: "zone", label: "Zone" },
        { name: "sensitivityLevel", label: "Sensibilité", options: ["Modéré", "Élevé", "Critique"], defaultValue: "Élevé" },
        { name: "risks", label: "Risques" },
        { name: "responsibleName", label: "Responsable" },
        { name: "plannedAt", label: "Date prévue", type: "date" },
      ]}
      onSubmit={async (fd) => {
        fd.set("pilotageId", pilotageId);
        return createSensitiveWork(fd);
      }}
    />
  );
}

export function QuickAddNonConformity({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Non-conformité"
      fields={[
        { name: "description", label: "Description *", required: true },
        { name: "reference", label: "Référence" },
        { name: "lot", label: "Lot" },
        { name: "zone", label: "Zone" },
        { name: "severity", label: "Gravité", options: ["À surveiller", "Important", "Critique"], defaultValue: "Important" },
        { name: "responsibleName", label: "Responsable corrective" },
        { name: "dueAt", label: "Date limite", type: "date" },
      ]}
      onSubmit={async (fd) => {
        fd.set("pilotageId", pilotageId);
        return createNonConformity(fd);
      }}
    />
  );
}

export function QuickAddDelayEvent({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Retard / perturbation"
      fields={[
        { name: "title", label: "Titre *", required: true },
        {
          name: "causeCategory",
          label: "Origine enregistrée",
          options: [
            "Interne entreprise",
            "Fournisseur",
            "Sous-traitant",
            "Maîtrise d’œuvre",
            "Maître d’ouvrage",
            "Bureau d’études",
            "Bureau de contrôle",
            "Visa",
            "Modification",
            "Météo",
            "Autre lot",
            "Accès",
            "Approvisionnement",
            "Décision tardive",
            "Document manquant",
            "À analyser",
            "Autre",
          ],
          defaultValue: "À analyser",
        },
        { name: "presumedOrigin", label: "Précision (non juridique)" },
        { name: "startedAt", label: "Début", type: "date" },
        { name: "impactedMilestone", label: "Jalon impacté" },
        { name: "description", label: "Description" },
      ]}
      onSubmit={async (fd) => {
        fd.set("pilotageId", pilotageId);
        return createDelayEvent(fd);
      }}
    />
  );
}

export function QuickAddTimelineEvent({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Fait chronologique"
      fields={[
        { name: "title", label: "Titre *", required: true },
        {
          name: "eventType",
          label: "Type *",
          required: true,
          options: [
            "Envoi",
            "Réception",
            "Relance",
            "Décision",
            "Document",
            "Plan",
            "Visa",
            "OS",
            "Réserve",
            "Retard",
            "Non-conformité",
            "Travaux supplémentaires",
            "Situation",
            "Réunion",
            "Jalon",
            "Preuve",
            "Autre",
          ],
        },
        { name: "occurredAt", label: "Date", type: "datetime-local" },
        { name: "actorExternal", label: "Acteur externe" },
        { name: "proofNote", label: "Preuve / référence" },
        { name: "description", label: "Description" },
      ]}
      onSubmit={async (fd) => {
        fd.set("pilotageId", pilotageId);
        return createTimelineEvent(fd);
      }}
    />
  );
}

export function QuickAddMeeting({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Préparer une réunion"
      fields={[
        { name: "title", label: "Titre *", required: true },
        {
          name: "meetingType",
          label: "Type",
          options: [
            "Réunion de chantier",
            "Réunion de passation",
            "Réunion études",
            "Réunion direction",
            "Revue hebdomadaire",
            "Réunion de réception",
            "Réunion de clôture",
          ],
          defaultValue: "Réunion de chantier",
        },
        { name: "scheduledAt", label: "Date", type: "datetime-local" },
        { name: "participants", label: "Participants" },
      ]}
      onSubmit={async (fd) => {
        fd.set("pilotageId", pilotageId);
        return createMeetingPreparation(fd);
      }}
    />
  );
}

export function QuickAddPhoto({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Photo documentée"
      fields={[
        { name: "fileUrl", label: "URL fichier *", required: true },
        { name: "title", label: "Titre" },
        {
          name: "category",
          label: "Catégorie",
          options: [
            "Avant travaux",
            "Pendant travaux",
            "Ouvrage caché",
            "Après travaux",
            "Réserve",
            "Levée de réserve",
            "Incident",
            "Livraison",
            "Contrôle",
            "Non-conformité",
            "Réception",
          ],
          defaultValue: "Pendant travaux",
        },
        { name: "zone", label: "Zone" },
        { name: "lot", label: "Lot" },
        { name: "caption", label: "Légende" },
      ]}
      onSubmit={async (fd) => {
        fd.set("pilotageId", pilotageId);
        return createPilotagePhoto(fd);
      }}
    />
  );
}

export function QuickAddLesson({ pilotageId, canEdit }: Props) {
  return (
    <QuickForm
      canEdit={canEdit}
      title="Retour d’expérience (brouillon)"
      fields={[
        { name: "title", label: "Titre *", required: true },
        { name: "lot", label: "Lot" },
        { name: "cause", label: "Cause" },
        { name: "consequence", label: "Conséquence" },
        { name: "solution", label: "Solution utilisée" },
        { name: "recommendation", label: "Recommandation" },
      ]}
      onSubmit={async (fd) => {
        fd.set("pilotageId", pilotageId);
        return createLessonLearned(fd);
      }}
    />
  );
}
