/**
 * GED-V2A.2 — Migration des références documents → storage://documents/...
 *
 * Usage :
 *   npm run migrate:documents-storage-refs           # dry-run
 *   npm run migrate:documents-storage-refs -- --dry-run
 *   npm run migrate:documents-storage-refs -- --apply
 *
 * Aucune copie de fichier. Ne touche pas storage://messagerie/...
 * Orphelins : rapportés, enregistrements conservés.
 */
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import {
  classifyDocumentsRef,
  type DocumentsRefClass,
} from "../src/lib/storage/documents-ref-migrate";
import { DOCUMENTS_BUCKET } from "../src/lib/storage/supabase-object";
import { getScriptDatabaseUrl, loadScriptEnv } from "./load-script-env";

loadScriptEnv();

const connectionUrl = getScriptDatabaseUrl();
if (!connectionUrl) {
  console.error("❌ DATABASE_URL manquant");
  process.exit(1);
}

function resolveSupabaseUrl(): string {
  const direct =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    "";
  if (direct) return direct;
  try {
    const u = new URL(connectionUrl);
    const m = u.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
    if (m?.[1]) return `https://${m[1]}.supabase.co`;
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
const apply = process.argv.includes("--apply");
const dryRun = !apply;

const prisma = new PrismaClient({ datasourceUrl: connectionUrl });
const supabase =
  supabaseUrl && serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

type Counter = Record<DocumentsRefClass, number> & {
  converted: number;
  orphans: number;
  errors: number;
  checkedExists: number;
};

function emptyCounter(): Counter {
  return {
    A_STORAGE_REF: 0,
    B_PUBLIC_CONVERTIBLE: 0,
    C_EXTERNAL: 0,
    D_EMPTY: 0,
    E_RAW_PATH: 0,
    converted: 0,
    orphans: 0,
    errors: 0,
    checkedExists: 0,
  };
}

const orphans: { model: string; id: string; path: string; reason: string }[] = [];
const modelStats: Record<string, Counter> = {};

async function objectExists(path: string): Promise<boolean | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).download(path);
  if (error || !data) return false;
  return true;
}

async function processScalarField(opts: {
  model: string;
  id: string;
  value: string | null | undefined;
  update: (next: string) => Promise<void>;
  checkExists?: boolean;
}) {
  const stats = (modelStats[opts.model] ??= emptyCounter());
  const analysis = classifyDocumentsRef(opts.value);
  stats[analysis.class] += 1;

  if (analysis.class === "B_PUBLIC_CONVERTIBLE" || analysis.class === "E_RAW_PATH") {
    if (opts.checkExists && analysis.path && supabase) {
      stats.checkedExists += 1;
      const exists = await objectExists(analysis.path);
      if (exists === false) {
        stats.orphans += 1;
        orphans.push({
          model: opts.model,
          id: opts.id,
          path: analysis.path,
          reason: "objet absent dans bucket documents",
        });
        // Convertir quand même la référence (même objet manquant) — pas de suppression
      }
    }

    if (!analysis.storageRef) {
      stats.errors += 1;
      return;
    }

    if (apply) {
      try {
        await opts.update(analysis.storageRef);
        stats.converted += 1;
      } catch (e) {
        stats.errors += 1;
        console.error(`  ✗ ${opts.model} ${opts.id}:`, e instanceof Error ? e.message : e);
      }
    } else {
      stats.converted += 1; // would convert
    }
  }
}

async function main() {
  console.log("=== GED-V2A.2 migrate:documents-storage-refs ===");
  console.log(`Mode: ${dryRun ? "DRY-RUN (aucune écriture)" : "APPLY"}`);
  console.log(`Supabase: ${supabaseUrl || "(non résolu — skip check objets)"}`);
  console.log("");

  // --- ChantierFile ---
  {
    const rows = await prisma.chantierFile.findMany({
      where: { fileUrl: { not: null } },
      select: { id: true, fileUrl: true },
    });
    for (const r of rows) {
      await processScalarField({
        model: "ChantierFile",
        id: r.id,
        value: r.fileUrl,
        checkExists: true,
        update: async (next) => {
          await prisma.chantierFile.update({ where: { id: r.id }, data: { fileUrl: next } });
        },
      });
    }
  }

  // --- Document legacy ---
  {
    const rows = await prisma.document.findMany({ select: { id: true, fileUrl: true } });
    for (const r of rows) {
      await processScalarField({
        model: "Document",
        id: r.id,
        value: r.fileUrl,
        checkExists: true,
        update: async (next) => {
          await prisma.document.update({ where: { id: r.id }, data: { fileUrl: next } });
        },
      });
    }
  }

  // --- PurchaseOrderDocument ---
  {
    const rows = await prisma.purchaseOrderDocument.findMany({
      where: { fileUrl: { not: null } },
      select: { id: true, fileUrl: true },
    });
    for (const r of rows) {
      await processScalarField({
        model: "PurchaseOrderDocument",
        id: r.id,
        value: r.fileUrl,
        checkExists: true,
        update: async (next) => {
          await prisma.purchaseOrderDocument.update({
            where: { id: r.id },
            data: { fileUrl: next },
          });
        },
      });
    }
  }

  // --- ReportAttachment ---
  {
    const rows = await prisma.reportAttachment.findMany({ select: { id: true, fileUrl: true } });
    for (const r of rows) {
      await processScalarField({
        model: "ReportAttachment",
        id: r.id,
        value: r.fileUrl,
        checkExists: true,
        update: async (next) => {
          await prisma.reportAttachment.update({ where: { id: r.id }, data: { fileUrl: next } });
        },
      });
    }
  }

  // --- AppointmentAttachment ---
  {
    const rows = await prisma.appointmentAttachment.findMany({
      select: { id: true, fileUrl: true },
    });
    for (const r of rows) {
      await processScalarField({
        model: "AppointmentAttachment",
        id: r.id,
        value: r.fileUrl,
        checkExists: true,
        update: async (next) => {
          await prisma.appointmentAttachment.update({
            where: { id: r.id },
            data: { fileUrl: next },
          });
        },
      });
    }
  }

  // --- Pilotage ---
  for (const model of [
    "PilotageMarketDocument",
    "PlanRegister",
    "DoeItem",
    "PilotageSubcontractorDoc",
    "PilotagePhoto",
  ] as const) {
    if (model === "PilotageMarketDocument") {
      const rows = await prisma.pilotageMarketDocument.findMany({
        where: { fileUrl: { not: null } },
        select: { id: true, fileUrl: true },
      });
      for (const r of rows) {
        await processScalarField({
          model,
          id: r.id,
          value: r.fileUrl,
          checkExists: true,
          update: async (next) => {
            await prisma.pilotageMarketDocument.update({
              where: { id: r.id },
              data: { fileUrl: next },
            });
          },
        });
      }
    } else if (model === "PlanRegister") {
      const rows = await prisma.planRegister.findMany({
        where: { OR: [{ fileUrl: { not: null } }, { proofUrl: { not: null } }] },
        select: { id: true, fileUrl: true, proofUrl: true },
      });
      for (const r of rows) {
        await processScalarField({
          model: "PlanRegister.fileUrl",
          id: r.id,
          value: r.fileUrl,
          checkExists: true,
          update: async (next) => {
            await prisma.planRegister.update({ where: { id: r.id }, data: { fileUrl: next } });
          },
        });
        await processScalarField({
          model: "PlanRegister.proofUrl",
          id: r.id,
          value: r.proofUrl,
          checkExists: true,
          update: async (next) => {
            await prisma.planRegister.update({ where: { id: r.id }, data: { proofUrl: next } });
          },
        });
      }
    } else if (model === "DoeItem") {
      const rows = await prisma.doeItem.findMany({
        where: { fileUrl: { not: null } },
        select: { id: true, fileUrl: true },
      });
      for (const r of rows) {
        await processScalarField({
          model,
          id: r.id,
          value: r.fileUrl,
          checkExists: true,
          update: async (next) => {
            await prisma.doeItem.update({ where: { id: r.id }, data: { fileUrl: next } });
          },
        });
      }
    } else if (model === "PilotageSubcontractorDoc") {
      const rows = await prisma.pilotageSubcontractorDoc.findMany({
        where: { fileUrl: { not: null } },
        select: { id: true, fileUrl: true },
      });
      for (const r of rows) {
        await processScalarField({
          model,
          id: r.id,
          value: r.fileUrl,
          checkExists: true,
          update: async (next) => {
            await prisma.pilotageSubcontractorDoc.update({
              where: { id: r.id },
              data: { fileUrl: next },
            });
          },
        });
      }
    } else if (model === "PilotagePhoto") {
      const rows = await prisma.pilotagePhoto.findMany({ select: { id: true, fileUrl: true } });
      for (const r of rows) {
        await processScalarField({
          model,
          id: r.id,
          value: r.fileUrl,
          checkExists: true,
          update: async (next) => {
            await prisma.pilotagePhoto.update({ where: { id: r.id }, data: { fileUrl: next } });
          },
        });
      }
    }
  }

  // ContractObligation.proofUrl
  {
    const rows = await prisma.contractObligation.findMany({
      where: { proofUrl: { not: null } },
      select: { id: true, proofUrl: true },
    });
    for (const r of rows) {
      await processScalarField({
        model: "ContractObligation.proofUrl",
        id: r.id,
        value: r.proofUrl,
        checkExists: true,
        update: async (next) => {
          await prisma.contractObligation.update({
            where: { id: r.id },
            data: { proofUrl: next },
          });
        },
      });
    }
  }

  // Skills
  {
    const cctp = await prisma.skillCctpFile.findMany({
      where: { storageUrl: { not: null } },
      select: { id: true, storageUrl: true },
    });
    for (const r of cctp) {
      await processScalarField({
        model: "SkillCctpFile",
        id: r.id,
        value: r.storageUrl,
        checkExists: true,
        update: async (next) => {
          await prisma.skillCctpFile.update({ where: { id: r.id }, data: { storageUrl: next } });
        },
      });
    }
    const ppsps = await prisma.skillPpspsFile.findMany({
      where: { storageUrl: { not: null } },
      select: { id: true, storageUrl: true },
    });
    for (const r of ppsps) {
      await processScalarField({
        model: "SkillPpspsFile",
        id: r.id,
        value: r.storageUrl,
        checkExists: true,
        update: async (next) => {
          await prisma.skillPpspsFile.update({ where: { id: r.id }, data: { storageUrl: next } });
        },
      });
    }
  }

  // Dico BTP images
  {
    const rows = await prisma.btpDictionaryTerm.findMany({
      where: { imageUrl: { not: null } },
      select: { id: true, imageUrl: true },
    });
    for (const r of rows) {
      await processScalarField({
        model: "BtpDictionaryTerm",
        id: r.id,
        value: r.imageUrl,
        checkExists: true,
        update: async (next) => {
          await prisma.btpDictionaryTerm.update({
            where: { id: r.id },
            data: { imageUrl: next },
          });
        },
      });
    }
  }

  // Totals
  const totals = emptyCounter();
  let analyzed = 0;
  for (const [model, s] of Object.entries(modelStats)) {
    analyzed +=
      s.A_STORAGE_REF + s.B_PUBLIC_CONVERTIBLE + s.C_EXTERNAL + s.D_EMPTY + s.E_RAW_PATH;
    for (const k of Object.keys(totals) as (keyof Counter)[]) {
      totals[k] += s[k];
    }
    console.log(
      `${model}: A=${s.A_STORAGE_REF} B=${s.B_PUBLIC_CONVERTIBLE} C=${s.C_EXTERNAL} D=${s.D_EMPTY} E=${s.E_RAW_PATH} → convert=${s.converted} orphans=${s.orphans} err=${s.errors}`,
    );
  }

  console.log("\n=== SYNTHÈSE ===");
  console.log(`Total analysé: ${analyzed}`);
  console.log(`Déjà storage:// (A): ${totals.A_STORAGE_REF}`);
  console.log(`URLs publiques convertibles (B): ${totals.B_PUBLIC_CONVERTIBLE}`);
  console.log(`Paths nus convertibles (E): ${totals.E_RAW_PATH}`);
  console.log(`URLs externes ignorées (C): ${totals.C_EXTERNAL}`);
  console.log(`Vides (D): ${totals.D_EMPTY}`);
  console.log(`${dryRun ? "À convertir" : "Convertis"}: ${totals.converted}`);
  console.log(`Orphelins (fichier absent): ${totals.orphans}`);
  console.log(`Erreurs: ${totals.errors}`);
  console.log(`Copies physiques: 0 (référence seule)`);
  console.log(
    `[documents-migrate] scanned=${analyzed} already_storage_ref=${totals.A_STORAGE_REF} converted=${totals.converted} external_skipped=${totals.C_EXTERNAL} missing=${totals.orphans} errors=${totals.errors}`,
  );

  if (orphans.length) {
    console.log("\n=== ORPHELINS (enregistrements conservés) ===");
    for (const o of orphans.slice(0, 50)) {
      console.log(`- ${o.model} ${o.id} path=${o.path} — ${o.reason}`);
    }
    if (orphans.length > 50) console.log(`… +${orphans.length - 50} autres`);
  }

  if (dryRun) {
    console.log("\nDry-run terminé. Relancer avec --apply pour écrire.");
  } else {
    console.log("\nApply terminé.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
