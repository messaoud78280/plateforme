/**
 * Charge les écarts de dates planning ↔ besoins. Lecture seule.
 */
import { prisma } from "@/lib/prisma";
import {
  evaluatePlanningSupplyDateDrift,
  scheduleTaskIdList,
  type PlanningSupplyDateGap,
} from "@/lib/supply/planning-date-drift";

export async function loadPlanningSupplyDateGapsByProject(input: {
  projectIds: string[];
  organizationIds?: string[];
}): Promise<Map<string, PlanningSupplyDateGap[]>> {
  const out = new Map<string, PlanningSupplyDateGap[]>();
  const projectIds = [...new Set(input.projectIds.filter(Boolean))];
  if (projectIds.length === 0) return out;

  const needs = await prisma.materialRequirement.findMany({
    where: {
      projectId: { in: projectIds },
      status: { not: "CANCELLED" },
      ...(input.organizationIds && input.organizationIds.length > 0
        ? { organizationId: { in: input.organizationIds } }
        : {}),
    },
    select: {
      id: true,
      projectId: true,
      label: true,
      status: true,
      neededAt: true,
      scheduleTaskIds: true,
    },
    take: 2000,
  });

  const linked = needs.flatMap((need) => {
    const scheduleTaskIds = scheduleTaskIdList(need.scheduleTaskIds);
    if (scheduleTaskIds.length === 0 || !need.neededAt) return [];
    return [{ ...need, scheduleTaskIds }];
  });
  const taskIds = [...new Set(linked.flatMap((need) => need.scheduleTaskIds))];
  const tasks =
    taskIds.length === 0
      ? []
      : await prisma.prepScheduleTask.findMany({
          where: { id: { in: taskIds } },
          select: { id: true, name: true, startDate: true },
        });

  const byProject = new Map<string, typeof linked>();
  for (const need of linked) {
    const list = byProject.get(need.projectId) ?? [];
    list.push(need);
    byProject.set(need.projectId, list);
  }
  for (const [projectId, projectNeeds] of byProject) {
    const gaps = evaluatePlanningSupplyDateDrift({
      needs: projectNeeds,
      tasks,
    });
    if (gaps.length > 0) out.set(projectId, gaps);
  }
  return out;
}
