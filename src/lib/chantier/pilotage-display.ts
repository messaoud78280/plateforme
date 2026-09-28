/**
 * Affichage pilotage chantier — libellés UI uniquement.
 * Ne modifie aucune valeur stockée / aucun statut métier.
 */

import type { ChantierWorkflowStep, ProjectWorkspace } from "@/lib/chantier/project-workspace";

/** Traduit un fragment de statut technique pour l’UI (sans écrire en base). */
export function humanizeTechnicalStatus(raw: string | null | undefined): string {
  if (!raw) return "";
  const s = raw.trim();
  const map: Record<string, string> = {
    TO_PLAN: "À planifier",
    INTERVENTION_PREVUE: "Intervention prévue",
    DRAFT: "Brouillon",
    FINALIZED: "Finalisé",
    ARCHIVED: "Archivé",
    EN_COURS: "En cours",
    A_VALIDER: "À valider",
    COMPLETE: "Terminé",
    NOT_STARTED: "Non démarrée",
    IN_PROGRESS: "En cours",
    DONE: "Terminée",
    BLOCKED: "Bloquée",
    CURRENT: "Actuel",
    ETUDE: "Étude",
    EN_ATTENTE: "En attente",
    RECEPTION: "Réception",
    TERMINE: "Terminé",
  };
  if (map[s]) return map[s];
  // "Statut TO_PLAN" / "statut INTERVENTION_PREVUE"
  const m = s.match(/statut\s+([A-Z0-9_]+)/i);
  if (m && map[m[1]]) {
    return s.replace(m[1], map[m[1]]);
  }
  return s
    .replace(/\bTO_PLAN\b/g, "À planifier")
    .replace(/\bINTERVENTION_PREVUE\b/g, "Intervention prévue")
    .replace(/\bDRAFT\b/g, "Brouillon")
    .replace(/\bFINALIZED\b/g, "Finalisé");
}

/** Sous-titre court pour la timeline (détail déjà présent dans le workspace). */
export function timelineStepCaption(step: ChantierWorkflowStep): string {
  if (!step.ready) {
    if (step.id === "visite") return step.title || "Pas de visite liée";
    if (step.id === "suivi" && step.actionLabel === "Planning requis") {
      return "Planning requis";
    }
    return humanizeTechnicalStatus(step.detail) || step.actionLabel || "À préparer";
  }
  const d = humanizeTechnicalStatus(step.detail) || step.title;
  // Raccourcis utiles
  if (step.id === "visite") return step.title || "Visite";
  if (step.id === "metre") {
    const posts = d.match(/(\d+)\s*poste/i);
    if (posts) return `${posts[1]} postes`;
    return d.replace(/^Version\s+\d+\s*·\s*/i, "") || "Prêt";
  }
  if (step.id === "devis") {
    const euro = d.match(/[\d\s ,.]+€/);
    return euro ? euro[0].replace(/\s+/g, " ").trim() : d;
  }
  if (step.id === "planning") {
    const date = d.match(/\d{1,2}\s+\S+/);
    return date ? date[0] : "Prêt";
  }
  if (step.id === "suivi") {
    const hum = humanizeTechnicalStatus(d);
    const st = hum.match(/Intervention prévue|En cours|À planifier|Brouillon/i);
    return st ? st[0] : hum.replace(/^Lié au planning\s*·\s*/i, "") || "Prêt";
  }
  if (step.id === "compte_rendu" || step.id === "notice") {
    return humanizeTechnicalStatus(d).includes("Brouillon")
      ? "Brouillon"
      : humanizeTechnicalStatus(d) || "Prêt";
  }
  return d.slice(0, 42);
}

export type PilotageNextAction = {
  label: string;
  href: string | null;
  stepId: ChantierWorkflowStep["id"] | "responsable" | "documents" | null;
};

/** Prochaine action à partir du workflow existant + signaux page (sans nouveau moteur). */
export function computePilotageNextAction(input: {
  workspace: ProjectWorkspace;
  hasResponsible: boolean;
  missingDocumentsCount?: number;
}): PilotageNextAction {
  const { workspace, hasResponsible, missingDocumentsCount = 0 } = input;
  const wf = workspace.global.workflow ?? [];

  if (!hasResponsible) {
    return {
      label: "Affecter un responsable",
      href: null,
      stepId: "responsable",
    };
  }

  const firstTodo = wf.find((s) => !s.ready);
  if (firstTodo) {
    const label =
      firstTodo.primaryAction === "attach_visit"
        ? "Rattacher la visite terrain"
        : firstTodo.primaryAction === "create_global_prep"
          ? firstTodo.id === "planning"
            ? "Générer le planning chantier"
            : "Générer le métré / planning"
          : firstTodo.primaryAction === "create_follow_up" ||
              (firstTodo.id === "suivi" && !firstTodo.ready)
            ? "Créer le suivi depuis le planning"
            : firstTodo.id === "compte_rendu"
              ? "Générer le compte rendu"
              : firstTodo.id === "notice"
                ? "Générer la notice explicative"
                : firstTodo.id === "visite"
                  ? firstTodo.actionLabel || "Ouvrir les visites"
                  : firstTodo.actionLabel || `Préparer : ${firstTodo.label}`;
    return {
      label,
      href:
        firstTodo.primaryAction === "attach_visit" ||
        firstTodo.primaryAction === "create_global_prep"
          ? null
          : firstTodo.href,
      stepId: firstTodo.id,
    };
  }

  if (missingDocumentsCount > 0) {
    return {
      label: `${missingDocumentsCount} pièce${missingDocumentsCount > 1 ? "s" : ""} manquante${missingDocumentsCount > 1 ? "s" : ""}`,
      href: `/dashboard/projets/manquants?chantier=${encodeURIComponent(workspace.projectId)}`,
      stepId: "documents",
    };
  }

  if (workspace.chantierStatus === "ETUDE") {
    return {
      label: "Préparer le démarrage du chantier",
      href: workspace.global.planning.href,
      stepId: "planning",
    };
  }

  return {
    label: "Chantier prêt — poursuivre le suivi",
    href: workspace.global.workflow.find((s) => s.id === "suivi")?.href ?? null,
    stepId: "suivi",
  };
}

export type PilotageTodoItem = {
  id: string;
  label: string;
  href: string | null;
};

export function buildPilotageTodos(input: {
  workspace: ProjectWorkspace;
  hasResponsible: boolean;
  missingDocumentsCount?: number;
  canEdit: boolean;
}): PilotageTodoItem[] {
  const items: PilotageTodoItem[] = [];
  const { workspace, hasResponsible, missingDocumentsCount = 0, canEdit } = input;

  if (!hasResponsible) {
    items.push({ id: "resp", label: "Affecter un responsable", href: null });
  }

  for (const step of workspace.global.workflow ?? []) {
    if (step.ready) continue;
    items.push({
      id: step.id,
      label: `${step.label} — ${step.actionLabel}`,
      href: step.href,
    });
  }

  if (missingDocumentsCount > 0) {
    items.push({
      id: "docs",
      label: `${missingDocumentsCount} document${missingDocumentsCount > 1 ? "s" : ""} manquant${missingDocumentsCount > 1 ? "s" : ""}`,
      href: `/dashboard/projets/manquants?chantier=${encodeURIComponent(workspace.projectId)}`,
    });
  }

  if (canEdit && workspace.unscoped.quotes > 0) {
    items.push({
      id: "unscoped-quotes",
      label:
        workspace.unscoped.quotes === 1
          ? "1 devis à organiser en lots"
          : `${workspace.unscoped.quotes} devis à organiser en lots`,
      href: null,
    });
  }

  return items.slice(0, 6);
}
