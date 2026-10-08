/**
 * Snapshot navigation transversale dossier chantier.
 * Pure — dérivé de getProjectWorkspace / ChantierWorkflowStep (pas de 2e résolution métier).
 */
import type {
  ChantierWorkflowStep,
  ChantierWorkflowStepId,
  ProjectWorkspace,
  ScopeWorkspace,
} from "@/lib/chantier/project-workspace";

export type DossierNavStepId = ChantierWorkflowStepId;

export type DossierNavVisualState =
  | "ready"
  | "active"
  | "needs_attention"
  | "to_prepare"
  | "not_applicable";

export type DossierNavStep = {
  id: DossierNavStepId;
  label: string;
  /** Libellé court UI (bandeau). */
  shortLabel: string;
  summary: string;
  href: string | null;
  ready: boolean;
  /** Action CREATE / generate côté client si href null ou préparation. */
  primaryAction: ChantierWorkflowStep["primaryAction"];
  actionLabel: string;
  visual: DossierNavVisualState;
  exists: boolean;
};

export type DossierNavSnapshot = {
  projectId: string;
  projectTitle: string;
  scopeId: string | null;
  scopeName: string | null;
  activeStep: DossierNavStepId | null;
  steps: DossierNavStep[];
};

export type DossierNavVariant = "full" | "compact";

const SHORT: Record<DossierNavStepId, string> = {
  visite: "Visite",
  metre: "Métré",
  devis: "Devis",
  planning: "Planning",
  approvisionnements: "Appro.",
  suivi: "Suivi",
  compte_rendu: "CR",
  notice: "Notice",
};

function shortLabel(step: ChantierWorkflowStep): string {
  return SHORT[step.id] ?? step.label;
}

function summaryFromStep(step: ChantierWorkflowStep): string {
  const t = (step.title ?? "").trim();
  const d = (step.detail ?? "").trim();
  if (step.ready && t && t !== "À préparer" && !/^Non cré/.test(t)) {
    // Garder une info courte utile
    if (d && d.length <= 48 && !d.toLowerCase().includes("ouvrez")) return d;
    return t.length > 42 ? `${t.slice(0, 40)}…` : t;
  }
  if (!step.ready) {
    if (step.primaryAction && step.primaryAction !== "open") {
      return "À préparer";
    }
    if (t === "À préparer" || t.startsWith("Non cré") || t === "À créer depuis le planning") {
      return "À préparer";
    }
  }
  if (d && d.length <= 52) return d;
  if (t) return t.length > 42 ? `${t.slice(0, 40)}…` : t;
  return step.ready ? "Prêt" : "À préparer";
}

function visualFor(
  step: ChantierWorkflowStep,
  active: DossierNavStepId | null,
): DossierNavVisualState {
  if (active && step.id === active) return "active";
  if (step.id === "visite" && /pas une étape/i.test(step.detail ?? "")) {
    return "not_applicable";
  }
  if (step.ready) return "ready";
  if (
    /revalid|modif|attention|stale|à jour/i.test(
      `${step.title} ${step.detail ?? ""} ${step.actionLabel}`,
    )
  ) {
    return "needs_attention";
  }
  return "to_prepare";
}

function existsFor(step: ChantierWorkflowStep): boolean {
  // Hub documents / liste ≠ entité créée
  if (/^Non cré|^À préparer|^À créer/i.test(step.title)) return false;
  if (step.ready) return true;
  if (step.href && step.primaryAction === "open") return true;
  return Boolean(step.href);
}

/**
 * Remplace href métré / devis / planning par les cartes du lot si présentes.
 * Visite / suivi / CR / notice restent globaux.
 */
function applyScopeOverrides(
  steps: DossierNavStep[],
  scope: ScopeWorkspace | null,
): DossierNavStep[] {
  if (!scope) return steps;
  const byKind = new Map(scope.cards.map((c) => [c.kind, c]));
  return steps.map((s) => {
    if (s.id === "metre") {
      const c = byKind.get("metre");
      if (c?.href) {
        return {
          ...s,
          href: c.href,
          summary: c.detail ?? c.statusLabel ?? s.summary,
          ready: c.ready,
          exists: Boolean(c.href),
          visual: s.visual === "active" ? "active" : c.ready ? "ready" : "to_prepare",
        };
      }
    }
    if (s.id === "devis") {
      const c = byKind.get("devis");
      if (c?.href) {
        return {
          ...s,
          href: c.href,
          summary: c.detail ?? c.statusLabel ?? s.summary,
          ready: c.ready,
          exists: Boolean(c.href),
          visual: s.visual === "active" ? "active" : c.ready ? "ready" : "to_prepare",
        };
      }
    }
    if (s.id === "planning") {
      const c = byKind.get("planning");
      if (c?.href) {
        return {
          ...s,
          href: c.href,
          summary: c.detail ?? c.statusLabel ?? s.summary,
          ready: c.ready,
          exists: Boolean(c.href),
          visual: s.visual === "active" ? "active" : c.ready ? "ready" : "to_prepare",
        };
      }
    }
    if (s.id === "suivi") {
      const c = byKind.get("suivi");
      if (c?.href) {
        return {
          ...s,
          href: c.href,
          summary: c.detail ?? c.statusLabel ?? s.summary,
          ready: c.ready,
          exists: Boolean(c.href),
          visual: s.visual === "active" ? "active" : c.ready ? "ready" : "to_prepare",
        };
      }
    }
    return s;
  });
}

export function buildDossierNavFromWorkspace(
  workspace: ProjectWorkspace,
  opts: {
    activeStep: DossierNavStepId | null;
    scopeId?: string | null;
  },
): DossierNavSnapshot {
  const scopeId = opts.scopeId?.trim() || null;
  const scope =
    scopeId != null
      ? workspace.scopes.find((s) => s.id === scopeId) ?? null
      : null;

  const base: DossierNavStep[] = (workspace.global.workflow ?? []).map((step) => ({
    id: step.id,
    label: step.label,
    shortLabel: shortLabel(step),
    summary: summaryFromStep(step),
    href: step.href,
    ready: step.ready,
    primaryAction: step.primaryAction,
    actionLabel: step.actionLabel,
    visual: visualFor(step, opts.activeStep),
    exists: existsFor(step),
  }));

  const steps = applyScopeOverrides(base, scope).map((s) =>
    opts.activeStep && s.id === opts.activeStep
      ? { ...s, visual: "active" as const }
      : s,
  );

  return {
    projectId: workspace.projectId,
    projectTitle: workspace.title,
    scopeId: scope?.id ?? null,
    scopeName: scope?.name ?? null,
    activeStep: opts.activeStep,
    steps,
  };
}

/** Sérialisation API légère — pas de lignes devis / tâches planning. */
export function serializeDossierNavSnapshot(snap: DossierNavSnapshot) {
  return {
    projectId: snap.projectId,
    projectTitle: snap.projectTitle,
    scopeId: snap.scopeId,
    scopeName: snap.scopeName,
    activeStep: snap.activeStep,
    steps: snap.steps.map((s) => ({
      id: s.id,
      label: s.label,
      shortLabel: s.shortLabel,
      summary: s.summary,
      href: s.href,
      ready: s.ready,
      primaryAction: s.primaryAction,
      actionLabel: s.actionLabel,
      visual: s.visual,
      exists: s.exists,
    })),
  };
}
