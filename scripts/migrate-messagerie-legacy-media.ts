/**
 * MESSAGERIE-V2C.2 — Purge / migration des médias legacy publics documents/dm/
 *
 * Usage:
 *   npx tsx scripts/migrate-messagerie-legacy-media.ts           # dry-run
 *   npx tsx scripts/migrate-messagerie-legacy-media.ts --apply   # copie + MAJ DB
 *   npx tsx scripts/migrate-messagerie-legacy-media.ts --apply --purge  # + suppression objets legacy
 *
 * Idempotent : refs déjà storage://messagerie/… ignorées ; copie upsert-safe.
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import {
  applyMigratedAttachment,
  buildLegacyTargetPath,
  findLegacyAttachments,
  isAlreadyMigratedRef,
  type MigrateStats,
} from "../src/lib/messagerie/legacy-media-migrate";
import type { MsgAttachment } from "../src/lib/messagerie/media-preview";
import { MESSAGERIE_MEDIA_BUCKET } from "../src/lib/messagerie/media-storage";
import { getScriptDatabaseUrl, loadScriptEnv } from "./load-script-env";

loadScriptEnv();

const connectionUrl = getScriptDatabaseUrl();
if (!connectionUrl) {
  console.error("❌ DATABASE_URL manquant (.env ou .env.local)");
  process.exit(1);
}

function resolveSupabaseUrl(): string {
  const direct =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    "";
  if (direct) return direct;
  // Dériver depuis DATABASE_URL (db.<ref>.supabase.co ou pooler)
  try {
    const u = new URL(connectionUrl);
    const m =
      u.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i) ||
      u.hostname.match(/^aws-0-[a-z0-9-]+\.pooler\.supabase\.com$/i);
    // pooler user sometimes embeds project ref in username
    if (m?.[1] && u.hostname.startsWith("db.")) {
      return `https://${m[1]}.supabase.co`;
    }
    const user = decodeURIComponent(u.username || "");
    const refFromUser = user.match(/\.([a-z0-9]+)$/i)?.[1];
    if (refFromUser && /supabase\.com/i.test(u.hostname)) {
      return `https://${refFromUser}.supabase.co`;
    }
  } catch {
    /* ignore */
  }
  return "";
}

const supabaseUrl = resolveSupabaseUrl();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!supabaseUrl || !serviceKey) {
  console.error("❌ Impossible de résoudre l’URL Supabase / SUPABASE_SERVICE_ROLE_KEY manquant");
  console.error("   Définissez NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL, ou un DATABASE_URL Supabase.");
  process.exit(1);
}
console.log(`Supabase: ${supabaseUrl}`);

const apply = process.argv.includes("--apply");
const purge = process.argv.includes("--purge");

const prisma = new PrismaClient({ datasourceUrl: connectionUrl });
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Row = {
  kind: "DIRECT" | "TASK" | "PROJECT";
  id: string;
  attachmentsJson: unknown;
};

async function loadRows(): Promise<Row[]> {
  type SqlRow = { id: string; attachmentsJson: unknown };
  const [direct, task, project] = await Promise.all([
    prisma.$queryRawUnsafe<SqlRow[]>(
      `SELECT id, "attachmentsJson" FROM "DirectMessage"
       WHERE "attachmentsJson" IS NOT NULL
         AND ("attachmentsJson"::text ILIKE '%/dm/%' OR "attachmentsJson"::text ILIKE '%"dm/%')`,
    ),
    prisma.$queryRawUnsafe<SqlRow[]>(
      `SELECT id, "attachmentsJson" FROM "TaskMessage"
       WHERE "attachmentsJson" IS NOT NULL
         AND ("attachmentsJson"::text ILIKE '%/dm/%' OR "attachmentsJson"::text ILIKE '%"dm/%')`,
    ),
    prisma.$queryRawUnsafe<SqlRow[]>(
      `SELECT id, "attachmentsJson" FROM "Message"
       WHERE "attachmentsJson" IS NOT NULL
         AND ("attachmentsJson"::text ILIKE '%/dm/%' OR "attachmentsJson"::text ILIKE '%"dm/%')`,
    ),
  ]);

  return [
    ...direct.map((r) => ({ kind: "DIRECT" as const, id: r.id, attachmentsJson: r.attachmentsJson })),
    ...task.map((r) => ({ kind: "TASK" as const, id: r.id, attachmentsJson: r.attachmentsJson })),
    ...project.map((r) => ({ kind: "PROJECT" as const, id: r.id, attachmentsJson: r.attachmentsJson })),
  ];
}

async function objectExists(bucket: string, path: string): Promise<boolean> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) return false;
  return true;
}

async function copyObject(srcPath: string, destPath: string, contentType?: string): Promise<boolean> {
  const { data, error } = await supabase.storage.from("documents").download(srcPath);
  if (error || !data) {
    console.error(`  ✗ download documents/${srcPath}: ${error?.message ?? "missing"}`);
    return false;
  }
  const buffer = Buffer.from(await data.arrayBuffer());
  const { error: upErr } = await supabase.storage.from(MESSAGERIE_MEDIA_BUCKET).upload(destPath, buffer, {
    contentType: contentType || data.type || "application/octet-stream",
    upsert: true,
  });
  if (upErr) {
    console.error(`  ✗ upload messagerie/${destPath}: ${upErr.message}`);
    return false;
  }
  return true;
}

async function updateMessage(
  kind: Row["kind"],
  id: string,
  attachments: MsgAttachment[],
): Promise<void> {
  const data = { attachmentsJson: attachments as unknown as Prisma.InputJsonValue };
  if (kind === "DIRECT") {
    await prisma.directMessage.update({ where: { id }, data });
  } else if (kind === "TASK") {
    await prisma.taskMessage.update({ where: { id }, data });
  } else {
    await prisma.message.update({ where: { id }, data });
  }
}

async function main() {
  console.log(
    apply
      ? purge
        ? "▶ APPLY + PURGE — migration médias Messagerie legacy\n"
        : "▶ APPLY — copie + MAJ DB (pas de purge)\n"
      : "▶ DRY-RUN — aucune modification\n",
  );

  const stats: MigrateStats = {
    messagesScanned: 0,
    messagesWithLegacy: 0,
    attachmentsFound: 0,
    migrated: 0,
    skippedAlready: 0,
    skippedMissing: 0,
    purged: 0,
    errors: 0,
  };

  const rows = await loadRows();
  stats.messagesScanned = rows.length;

  const pathsToPurge = new Set<string>();

  for (const row of rows) {
    const hits = findLegacyAttachments(row.attachmentsJson);
    if (hits.length === 0) continue;
    stats.messagesWithLegacy += 1;
    stats.attachmentsFound += hits.length;

    let atts = Array.isArray(row.attachmentsJson)
      ? ([...row.attachmentsJson] as MsgAttachment[])
      : [];
    let changed = false;

    for (const hit of hits) {
      const targetPath = buildLegacyTargetPath({
        messageKind: row.kind,
        messageId: row.id,
        legacyPath: hit.legacyPath,
        fileName: hit.attachment.name,
      });
      const newRefPreview = `storage://${MESSAGERIE_MEDIA_BUCKET}/${targetPath}`;

      if (isAlreadyMigratedRef(hit.attachment.fileUrl)) {
        stats.skippedAlready += 1;
        console.log(`  · skip déjà migré ${row.kind}/${row.id} [${hit.index}]`);
        continue;
      }

      console.log(
        `  → ${row.kind}/${row.id} [${hit.index}] ${hit.legacyPath} → ${newRefPreview}`,
      );

      if (!apply) continue;

      try {
        const alreadyOnPrivate = await objectExists(MESSAGERIE_MEDIA_BUCKET, targetPath);
        if (!alreadyOnPrivate) {
          const ok = await copyObject(
            hit.legacyPath,
            targetPath,
            hit.attachment.mimeType,
          );
          if (!ok) {
            stats.skippedMissing += 1;
            stats.errors += 1;
            continue;
          }
        }

        const verified = await objectExists(MESSAGERIE_MEDIA_BUCKET, targetPath);
        if (!verified) {
          console.error(`  ✗ vérif absente après copie: messagerie/${targetPath}`);
          stats.errors += 1;
          continue;
        }

        atts = applyMigratedAttachment(atts, hit.index, targetPath);
        changed = true;
        stats.migrated += 1;
        pathsToPurge.add(hit.legacyPath);
      } catch (e) {
        stats.errors += 1;
        console.error(`  ✗ ${row.kind}/${row.id}:`, e instanceof Error ? e.message : e);
      }
    }

    if (apply && changed) {
      await updateMessage(row.kind, row.id, atts);
      console.log(`  ✓ DB mise à jour ${row.kind}/${row.id}`);
    }
  }

  if (apply && purge && pathsToPurge.size > 0) {
    console.log(`\n▶ Purge ${pathsToPurge.size} objet(s) documents/dm/… (issus de cette passe)`);
    for (const path of pathsToPurge) {
      const still = await prisma.$queryRawUnsafe<{ c: bigint }[]>(
        `SELECT (
          (SELECT COUNT(*) FROM "DirectMessage" WHERE "attachmentsJson"::text ILIKE $1) +
          (SELECT COUNT(*) FROM "TaskMessage" WHERE "attachmentsJson"::text ILIKE $1) +
          (SELECT COUNT(*) FROM "Message" WHERE "attachmentsJson"::text ILIKE $1)
        )::bigint AS c`,
        `%${path}%`,
      );
      const count = Number(still[0]?.c ?? 0);
      if (count > 0) {
        console.error(`  ✗ purge annulée (encore ${count} ref DB): ${path}`);
        stats.errors += 1;
        continue;
      }
      const { error } = await supabase.storage.from("documents").remove([path]);
      if (error) {
        console.error(`  ✗ purge documents/${path}: ${error.message}`);
        stats.errors += 1;
      } else {
        stats.purged += 1;
        console.log(`  ✓ purgé documents/${path}`);
      }
    }
  }

  // Purge orphelins : objets documents/dm/ sans aucune référence DB messagerie
  if (apply && purge) {
    const orphanSql = await prisma.$queryRawUnsafe<{ name: string }[]>(
      `SELECT name FROM storage.objects WHERE bucket_id = 'documents' AND name LIKE 'dm/%' ORDER BY name`,
    );
    if (orphanSql.length > 0) {
      console.log(`\n▶ Purge orphelins documents/dm/ (${orphanSql.length}) — vérif ref DB par objet`);
      for (const { name: path } of orphanSql) {
        const still = await prisma.$queryRawUnsafe<{ c: bigint }[]>(
          `SELECT (
            (SELECT COUNT(*) FROM "DirectMessage" WHERE "attachmentsJson"::text ILIKE $1) +
            (SELECT COUNT(*) FROM "TaskMessage" WHERE "attachmentsJson"::text ILIKE $1) +
            (SELECT COUNT(*) FROM "Message" WHERE "attachmentsJson"::text ILIKE $1)
          )::bigint AS c`,
          `%${path}%`,
        );
        const count = Number(still[0]?.c ?? 0);
        if (count > 0) {
          console.error(`  ✗ orphelin encore référencé (${count}): ${path}`);
          stats.errors += 1;
          continue;
        }
        const { error } = await supabase.storage.from("documents").remove([path]);
        if (error) {
          console.error(`  ✗ purge orphelin documents/${path}: ${error.message}`);
          stats.errors += 1;
        } else {
          stats.purged += 1;
          console.log(`  ✓ purgé orphelin documents/${path}`);
        }
      }
    }
  }

  const remaining = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM storage.objects WHERE bucket_id = 'documents' AND name LIKE 'dm/%' ORDER BY name`,
  );

  console.log("\n=== Résumé ===");
  console.log(`messagesScanned     : ${stats.messagesScanned}`);
  console.log(`messagesWithLegacy  : ${stats.messagesWithLegacy}`);
  console.log(`attachmentsFound    : ${stats.attachmentsFound}`);
  console.log(`migrated            : ${stats.migrated}`);
  console.log(`skippedAlready      : ${stats.skippedAlready}`);
  console.log(`skippedMissing      : ${stats.skippedMissing}`);
  console.log(`purged              : ${stats.purged}`);
  console.log(`errors              : ${stats.errors}`);
  console.log(`objets documents/dm restants : ${remaining.length}`);
  if (!apply) {
    console.log("\nRelancer avec --apply puis --apply --purge pour exécuter.");
  }

  if (stats.errors > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
