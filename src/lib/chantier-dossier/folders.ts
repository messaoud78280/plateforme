import { prisma } from "@/lib/prisma";
import { DEFAULT_CHANTIER_FOLDERS } from "./constants";

/** Crée les 11 rubriques standard pour un chantier (idempotent par code). */
export async function ensureChantierFolders(projectId: string) {
  const existing = await prisma.chantierFolder.findMany({
    where: { projectId },
    select: { code: true },
  });
  const have = new Set(existing.map((f) => f.code));
  const toCreate = DEFAULT_CHANTIER_FOLDERS.filter((f) => !have.has(f.code));
  if (toCreate.length === 0) return;

  await prisma.$transaction(
    toCreate.map((f) =>
      prisma.chantierFolder.create({
        data: {
          projectId,
          code: f.code,
          label: f.label,
          sortOrder: f.sortOrder,
        },
      }),
    ),
  );
}
