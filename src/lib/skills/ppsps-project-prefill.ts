import type { PpspsFormInput } from "@/lib/skills/ppsps-types";

export type PpspsProjectPrefillSource = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  dateSouhaitee: Date | null;
  deadline: Date | null;
};

/** Préremplit le formulaire PPSPS à partir d'un projet BeWork. */
export function buildPpspsFormFromProject(
  project: PpspsProjectPrefillSource,
  current?: Partial<PpspsFormInput>,
): Partial<PpspsFormInput> {
  const constraintsParts: string[] = [];
  if (project.description?.trim()) constraintsParts.push(project.description.trim());
  if (project.notes?.trim()) constraintsParts.push(`Notes projet : ${project.notes.trim()}`);

  const startDate = project.dateSouhaitee
    ? project.dateSouhaitee.toISOString().slice(0, 10)
    : "";

  let estimatedDuration = "";
  if (project.dateSouhaitee && project.deadline) {
    const days = Math.ceil(
      (project.deadline.getTime() - project.dateSouhaitee.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (days > 0) estimatedDuration = `Environ ${days} jours (selon dates projet)`;
  }

  const existingConstraints = current?.constraints?.trim() ?? "";
  const mergedConstraints = [existingConstraints, ...constraintsParts].filter(Boolean).join("\n\n");

  return {
    projectId: project.id,
    site: {
      siteName: project.title,
      siteAddress: current?.site?.siteAddress ?? "",
      operationType: current?.site?.operationType ?? "construction_neuve",
      operationTypeOther: current?.site?.operationTypeOther ?? "",
      startDate: current?.site?.startDate || startDate,
      estimatedDuration: current?.site?.estimatedDuration || estimatedDuration,
      maxWorkers: current?.site?.maxWorkers ?? "",
      coactivity: current?.site?.coactivity ?? "a_confirmer",
      spsCoordinator: current?.site?.spsCoordinator ?? "",
      projectOwner: current?.site?.projectOwner ?? "",
      projectManager: current?.site?.projectManager ?? "",
      safetyManager: current?.site?.safetyManager ?? "",
    },
    constraints: mergedConstraints || current?.constraints || "",
  };
}
