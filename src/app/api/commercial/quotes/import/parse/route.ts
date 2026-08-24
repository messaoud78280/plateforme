import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  buildDraftFromExtractedText,
  extractQuoteFileText,
} from "@/lib/commercial/import/parse-quote-text";
import { matchClientsInOrganization } from "@/lib/commercial/import/match-client";
import {
  findQuoteByImportHash,
  storeImportSourceFile,
} from "@/lib/commercial/import/storage";

export const runtime = "nodejs";

const MAX_BYTES = 20 * 1024 * 1024; // 20 Mo
const ALLOWED_EXT = /\.(pdf|xlsx|xls|csv)$/i;
const ALLOWED_MIME = [
  "application/pdf",
  "text/csv",
  "text/plain",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
];

/** POST multipart — parse un devis source → brouillon d’import (pas encore CommercialQuote). */
export async function POST(req: Request) {
  const auth = await requireCommercialApiSession({
    requiredHref: "/dashboard/devis-facturation",
    requireWrite: true,
  });
  if (auth.error || !auth.session || !auth.orgId) {
    return NextResponse.json(
      { error: auth.error ?? "Non autorisé" },
      { status: auth.status },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  const fileName = file.name || "devis.pdf";
  if (!ALLOWED_EXT.test(fileName)) {
    return NextResponse.json(
      { error: "Formats acceptés : PDF, Excel, CSV." },
      { status: 400 },
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Taille maximale ${Math.round(MAX_BYTES / (1024 * 1024))} Mo.` },
      { status: 400 },
    );
  }

  const mimeType = file.type || "application/octet-stream";
  if (
    mimeType &&
    !ALLOWED_MIME.some((m) => mimeType === m || mimeType.startsWith("text/"))
  ) {
    // extension déjà filtrée — MIME parfois vide
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extracted = await extractQuoteFileText(buffer, fileName, mimeType);
  if (extracted.warning && !extracted.text) {
    return NextResponse.json(
      {
        error:
          extracted.warning ||
          "Nous n’avons pas réussi à lire ce document. Le fichier n’a pas été importé.",
      },
      { status: 422 },
    );
  }

  let draft = buildDraftFromExtractedText({
    text: extracted.text,
    fileName,
    mimeType,
    fileSize: file.size,
    buffer,
    format: extracted.format,
  });

  if (draft.source.sha256) {
    const stored = await storeImportSourceFile({
      organizationId: auth.orgId,
      buffer,
      fileName,
      mimeType,
      sha256: draft.source.sha256,
    });
    if ("storageKey" in stored) {
      draft = {
        ...draft,
        source: { ...draft.source, storageKey: stored.storageKey },
      };
    }

    const dup = await findQuoteByImportHash(auth.orgId, draft.source.sha256!);
    if (dup) {
      return NextResponse.json({
        draft,
        clientMatches: await matchClientsInOrganization(auth.orgId, draft.customer),
        duplicate: {
          quoteId: dup.id,
          quoteNumber: dup.number,
          href: `/dashboard/devis-facturation/devis/${dup.id}`,
        },
      });
    }
  }

  const clientMatches = await matchClientsInOrganization(auth.orgId, draft.customer);

  return NextResponse.json({ draft, clientMatches, duplicate: null });
}
