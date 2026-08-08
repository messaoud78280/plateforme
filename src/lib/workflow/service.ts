import type { FollowUpSheetStatus, WorkflowDefinition, WorkflowStep } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  TEMPLATE_CHANTIER_STANDARD,
  WORKFLOW_TEMPLATES,
  type WorkflowTemplate,
} from "@/lib/workflow/templates";
import { STATUS_LABELS, colorKeyForStatus } from "@/lib/follow-up/types";

export type WorkflowWithSteps = WorkflowDefinition & { steps: WorkflowStep[] };

export async function ensureDefaultWorkflow(organizationId: string): Promise<WorkflowWithSteps> {
  const existing = await prisma.workflowDefinition.findFirst({
    where: { organizationId, isDefault: true, isActive: true },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });
  if (existing && existing.steps.length > 0) return existing;

  if (existing && existing.steps.length === 0) {
    await seedStepsFromTemplate(existing.id, TEMPLATE_CHANTIER_STANDARD);
    return prisma.workflowDefinition.findUniqueOrThrow({
      where: { id: existing.id },
      include: { steps: { orderBy: { sortOrder: "asc" } } },
    });
  }

  const created = await prisma.workflowDefinition.create({
    data: {
      organizationId,
      name: TEMPLATE_CHANTIER_STANDARD.name,
      description: TEMPLATE_CHANTIER_STANDARD.description,
      templateKey: TEMPLATE_CHANTIER_STANDARD.templateKey,
      isDefault: true,
      isActive: true,
    },
  });
  await seedStepsFromTemplate(created.id, TEMPLATE_CHANTIER_STANDARD);
  return prisma.workflowDefinition.findUniqueOrThrow({
    where: { id: created.id },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });
}

async function seedStepsFromTemplate(workflowId: string, template: WorkflowTemplate) {
  await prisma.workflowStep.createMany({
    data: template.steps.map((s) => ({
      workflowId,
      statusKey: s.statusKey,
      label: s.label,
      colorKey: s.colorKey,
      sortOrder: s.sortOrder,
      visibleOnBoard: s.visibleOnBoard,
      defaultRole: s.defaultRole ?? null,
      delayHours: s.delayHours ?? null,
      reminderHours: s.reminderHours ?? null,
      alertOrangeHours: s.alertOrangeHours ?? null,
      alertRedHours: s.alertRedHours ?? null,
      escalateHours: s.escalateHours ?? null,
      nextActionLabel: s.nextActionLabel ?? null,
      nextActionDelayHours: s.nextActionDelayHours ?? null,
    })),
  });
}

export async function listWorkflows(organizationId: string): Promise<WorkflowWithSteps[]> {
  await ensureDefaultWorkflow(organizationId);
  return prisma.workflowDefinition.findMany({
    where: { organizationId, isActive: true },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export async function getWorkflowForSheet(opts: {
  workflowId?: string | null;
  organizationId?: string | null;
  ownerUserId: string;
}): Promise<WorkflowWithSteps | null> {
  if (opts.workflowId) {
    const w = await prisma.workflowDefinition.findUnique({
      where: { id: opts.workflowId },
      include: { steps: { orderBy: { sortOrder: "asc" } } },
    });
    if (w) return w;
  }
  let orgId = opts.organizationId;
  if (!orgId) {
    const org = await prisma.organization.findFirst({
      where: {
        OR: [
          { ownerUserId: opts.ownerUserId },
          { members: { some: { userId: opts.ownerUserId } } },
        ],
      },
      select: { id: true },
    });
    orgId = org?.id ?? null;
  }
  if (!orgId) return null;
  return ensureDefaultWorkflow(orgId);
}

export function resolveStatusLabel(
  status: FollowUpSheetStatus | string,
  workflow: WorkflowWithSteps | null | undefined
): string {
  const step = workflow?.steps.find((s) => s.statusKey === status);
  if (step?.label) return step.label;
  return STATUS_LABELS[status as FollowUpSheetStatus] ?? String(status);
}

export function resolveColorKey(
  status: FollowUpSheetStatus | string,
  workflow: WorkflowWithSteps | null | undefined
): string {
  const step = workflow?.steps.find((s) => s.statusKey === status);
  if (step?.colorKey) return step.colorKey;
  return colorKeyForStatus(status as FollowUpSheetStatus);
}

/** Applique couleur + prochaine action du workflow lors d’un changement de statut. */
export function transitionDefaultsFromWorkflow(
  status: FollowUpSheetStatus,
  workflow: WorkflowWithSteps | null | undefined,
  opts?: { keepNextAction?: boolean; keepColor?: boolean }
): {
  colorKey?: string;
  nextAction?: string | null;
  nextActionAt?: Date | null;
  nextActionDone?: boolean;
} {
  const step = workflow?.steps.find((s) => s.statusKey === status);
  const out: {
    colorKey?: string;
    nextAction?: string | null;
    nextActionAt?: Date | null;
    nextActionDone?: boolean;
  } = {};

  if (!opts?.keepColor) {
    out.colorKey = step?.colorKey ?? colorKeyForStatus(status);
  }

  if (!opts?.keepNextAction && step?.nextActionLabel) {
    out.nextAction = step.nextActionLabel;
    out.nextActionDone = false;
    const hours = step.nextActionDelayHours ?? 24;
    const at = new Date();
    at.setHours(at.getHours() + hours);
    out.nextActionAt = at;
  }

  return out;
}

export async function updateWorkflowStep(
  stepId: string,
  organizationId: string,
  patch: {
    label?: string;
    colorKey?: string;
    description?: string | null;
    defaultRole?: string | null;
    delayHours?: number | null;
    reminderHours?: number | null;
    alertOrangeHours?: number | null;
    alertRedHours?: number | null;
    escalateHours?: number | null;
    nextActionLabel?: string | null;
    nextActionDelayHours?: number | null;
    visibleOnBoard?: boolean;
    sortOrder?: number;
  }
) {
  const step = await prisma.workflowStep.findFirst({
    where: { id: stepId, workflow: { organizationId } },
    select: { id: true },
  });
  if (!step) return null;
  return prisma.workflowStep.update({
    where: { id: stepId },
    data: {
      ...(patch.label !== undefined ? { label: patch.label } : {}),
      ...(patch.colorKey !== undefined ? { colorKey: patch.colorKey } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.defaultRole !== undefined ? { defaultRole: patch.defaultRole } : {}),
      ...(patch.delayHours !== undefined ? { delayHours: patch.delayHours } : {}),
      ...(patch.reminderHours !== undefined ? { reminderHours: patch.reminderHours } : {}),
      ...(patch.alertOrangeHours !== undefined ? { alertOrangeHours: patch.alertOrangeHours } : {}),
      ...(patch.alertRedHours !== undefined ? { alertRedHours: patch.alertRedHours } : {}),
      ...(patch.escalateHours !== undefined ? { escalateHours: patch.escalateHours } : {}),
      ...(patch.nextActionLabel !== undefined ? { nextActionLabel: patch.nextActionLabel } : {}),
      ...(patch.nextActionDelayHours !== undefined
        ? { nextActionDelayHours: patch.nextActionDelayHours }
        : {}),
      ...(patch.visibleOnBoard !== undefined ? { visibleOnBoard: patch.visibleOnBoard } : {}),
      ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
    },
  });
}

export async function duplicateWorkflow(
  workflowId: string,
  organizationId: string,
  newName: string
): Promise<WorkflowWithSteps | null> {
  const source = await prisma.workflowDefinition.findFirst({
    where: { id: workflowId, organizationId },
    include: { steps: true },
  });
  if (!source) return null;

  const created = await prisma.workflowDefinition.create({
    data: {
      organizationId,
      name: newName,
      description: source.description,
      templateKey: "CUSTOM",
      isDefault: false,
      isActive: true,
      steps: {
        create: source.steps.map((s) => ({
          statusKey: s.statusKey,
          label: s.label,
          description: s.description,
          colorKey: s.colorKey,
          sortOrder: s.sortOrder,
          visibleOnBoard: s.visibleOnBoard,
          defaultRole: s.defaultRole,
          defaultAssigneeId: s.defaultAssigneeId,
          delayHours: s.delayHours,
          reminderHours: s.reminderHours,
          alertOrangeHours: s.alertOrangeHours,
          alertRedHours: s.alertRedHours,
          escalateHours: s.escalateHours,
          nextActionLabel: s.nextActionLabel,
          nextActionDelayHours: s.nextActionDelayHours,
          initialUrgency: s.initialUrgency,
        })),
      },
    },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });
  return created;
}

export { WORKFLOW_TEMPLATES };
