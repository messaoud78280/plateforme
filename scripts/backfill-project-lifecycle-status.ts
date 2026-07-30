/**
 * Aligne Project.status sur Project.chantierStatus (source de vérité).
 *
 * Usage :
 *   npm run db:backfill-project-lifecycle          # simulation
 *   npm run db:backfill-project-lifecycle -- --apply
 */
import { PrismaClient, type ChantierStatus, type ProjectStatus } from "@prisma/client";
import {
  isProjectLifecycleInSync,
  mapChantierToProjectStatus,
} from "../src/lib/chantier-lifecycle";
import { getScriptDatabaseUrl, loadScriptEnv } from "./load-script-env";

loadScriptEnv();
const connectionUrl = getScriptDatabaseUrl();
if (!connectionUrl) {
  console.error("❌ DATABASE_URL manquant (.env ou .env.local)");
  process.exit(1);
}

const apply = process.argv.includes("--apply");

const prisma = new PrismaClient({
  datasourceUrl: connectionUrl,
});

async function main() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      chantierStatus: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const divergences: {
    id: string;
    title: string;
    chantierStatus: ChantierStatus;
    from: ProjectStatus;
    to: ProjectStatus;
  }[] = [];

  for (const p of projects) {
    if (!isProjectLifecycleInSync(p.chantierStatus, p.status)) {
      divergences.push({
        id: p.id,
        title: p.title,
        chantierStatus: p.chantierStatus,
        from: p.status,
        to: mapChantierToProjectStatus(p.chantierStatus),
      });
    }
  }

  console.log(`→ ${projects.length} chantier(s) en base`);
  console.log(`→ ${divergences.length} divergence(s) status ≠ miroir de chantierStatus`);

  if (divergences.length === 0) {
    console.log("✓ Rien à faire.");
    return;
  }

  const preview = divergences.slice(0, 15);
  for (const row of preview) {
    console.log(
      `  ${row.id.slice(0, 8)}… « ${row.title.slice(0, 50)}${row.title.length > 50 ? "…" : ""} »` +
        ` — chantierStatus=${row.chantierStatus} | status ${row.from} → ${row.to}`,
    );
  }
  if (divergences.length > preview.length) {
    console.log(`  … et ${divergences.length - preview.length} autre(s)`);
  }

  if (!apply) {
    console.log("\n⚠️  Mode simulation. Relancez avec --apply pour enregistrer :");
    console.log("    npm run db:backfill-project-lifecycle -- --apply");
    return;
  }

  console.log("\n→ Mise à jour en cours…");
  let updated = 0;
  for (const row of divergences) {
    await prisma.project.update({
      where: { id: row.id },
      data: { status: row.to },
    });
    updated += 1;
  }
  console.log(`✓ ${updated} chantier(s) synchronisé(s) (status ← chantierStatus).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
