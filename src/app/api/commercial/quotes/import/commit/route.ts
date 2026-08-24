import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { commitImportedQuote } from "@/lib/commercial/import/commit-imported-quote";
import type { ImportedQuoteDraft } from "@/lib/commercial/import/types";
import { prisma } from "@/lib/prisma";

/** POST JSON — crée un CommercialQuote DRAFT depuis le brouillon d’import validé. */
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

  const body = (await req.json().catch(() => null)) as {
    draft?: ImportedQuoteDraft;
    clientExternalOrgId?: string | null;
    createClientIfMissing?: boolean;
    projectId?: string | null;
    forceDuplicate?: boolean;
  } | null;

  if (!body?.draft || typeof body.draft !== "object") {
    return NextResponse.json({ error: "Brouillon d’import requis" }, { status: 400 });
  }

  // Sécurité tenant : le storageKey ne peut pas pointer hors de l’org
  const sk = body.draft.source?.storageKey;
  if (sk && !sk.startsWith(`commercial/${auth.orgId}/`)) {
    return NextResponse.json({ error: "Fichier source invalide" }, { status: 400 });
  }

  if (body.clientExternalOrgId) {
    const ok = await prisma.externalOrganization.findFirst({
      where: {
        id: body.clientExternalOrgId,
        hostOrganizationId: auth.orgId,
        type: { in: ["CLIENT_EXT", "CLIENT"] },
      },
      select: { id: true },
    });
    if (!ok) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 400 });
    }
  }

  if (body.projectId) {
    const ok = await prisma.project.findFirst({
      where: { id: body.projectId, organizationId: auth.orgId },
      select: { id: true },
    });
    if (!ok) {
      return NextResponse.json({ error: "Chantier introuvable" }, { status: 400 });
    }
  }

  try {
    const result = await commitImportedQuote({
      orgId: auth.orgId,
      userId: auth.session.user.id,
      draft: body.draft,
      clientExternalOrgId: body.clientExternalOrgId ?? null,
      createClientIfMissing: body.createClientIfMissing !== false,
      projectId: body.projectId ?? null,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Échec de création du devis";
    console.error("[quote-import/commit]", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
