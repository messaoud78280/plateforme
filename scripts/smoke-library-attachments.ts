import { loadScriptEnv, getScriptDatabaseUrlCandidatesForLongJobs } from "./load-script-env";
import { PrismaClient } from "@prisma/client";
import {
  uploadLibraryAttachments,
  listLibraryAttachments,
  deleteLibraryAttachment,
  getLibraryAttachmentSignedUrl,
} from "../src/lib/commercial/library-media";

loadScriptEnv();

async function main() {
  const url = getScriptDatabaseUrlCandidatesForLongJobs()[0];
  const prisma = new PrismaClient({ datasourceUrl: url });
  try {
    const orgId = "cmt2nx23j00021k6btoov39gr";
    const wi = await prisma.commercialWorkItem.findFirst({
      where: { organizationId: orgId, isActive: true },
      select: { id: true, name: true },
    });
    if (!wi) throw new Error("no work item");
    console.log("WI", wi.id, wi.name.slice(0, 50));

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const created = await uploadLibraryAttachments({
      orgId,
      workItemId: wi.id,
      files: [{ buffer: png, fileName: "smoke-test.png", mimeType: "image/png" }],
      clientVisible: false,
    });
    console.log("CREATED", created[0]?.id);

    const list = await listLibraryAttachments(orgId, wi.id);
    console.log("LIST_COUNT", list.length);

    const signed = await getLibraryAttachmentSignedUrl(orgId, wi.id, created[0]!.id);
    console.log("SIGNED", Boolean(signed.url));

    await deleteLibraryAttachment(orgId, wi.id, created[0]!.id);
    const after = await listLibraryAttachments(orgId, wi.id);
    console.log("AFTER_DELETE", after.length);

    const total = await prisma.commercialWorkItem.count({
      where: { organizationId: orgId },
    });
    console.log("OUVRAGES_STILL", total);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
