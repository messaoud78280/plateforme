import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  parseBeworkQuoteBundle,
  revalidateBeworkQuoteBundle,
} from "@/lib/commercial/chatgpt-bundle/parse";
import {
  commitBundleIntoQuote,
  type BundleImportSelection,
} from "@/lib/commercial/chatgpt-bundle/commit";
import type { BeworkQuoteBundleV1 } from "@/lib/commercial/chatgpt-bundle/types";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

function defaultSelection(): BundleImportSelection {
  return {
    importClient: true,
    importSite: true,
    importPricing: true,
    importAdvice: true,
    importReservations: true,
    importInternalNotes: true,
    importWorkStages: true,
    importMediaManifest: true,
    pricingMode: "ADD",
    clientExternalOrgId: null,
    createClientIfMissing: true,
    primaryEmailOverride: null,
    projectId: null,
    forceDuplicate: false,
  };
}

/** POST — commit du dossier validé dans le devis courant. */
export async function POST(req: Request, ctx: Ctx) {
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

  const { id: quoteId } = await ctx.params;
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: auth.orgId },
    select: { id: true },
  });
  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    rawText?: string;
    bundle?: BeworkQuoteBundleV1;
    /** Empreinte d’origine (détection doublon même après édition légère). */
    originalFingerprint?: string;
    selection?: Partial<BundleImportSelection>;
  } | null;

  let bundle: BeworkQuoteBundleV1;
  let fingerprint: string;

  if (body?.bundle && typeof body.bundle === "object") {
    const revalidated = revalidateBeworkQuoteBundle(body.bundle);
    if (!revalidated.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Le dossier n’a pas pu être interprété.",
          errors: revalidated.errors,
        },
        { status: 422 },
      );
    }
    bundle = revalidated.bundle;
    fingerprint = body.originalFingerprint || revalidated.fingerprint;
  } else if (typeof body?.rawText === "string") {
    const parsed = parseBeworkQuoteBundle(body.rawText);
    if (!parsed.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Le dossier n’a pas pu être interprété.",
          errors: parsed.errors,
        },
        { status: 422 },
      );
    }
    bundle = parsed.bundle;
    fingerprint = parsed.fingerprint;
  } else {
    return NextResponse.json(
      { error: "bundle ou rawText requis" },
      { status: 400 },
    );
  }

  const selection: BundleImportSelection = {
    ...defaultSelection(),
    ...(body?.selection ?? {}),
  };

  if (selection.clientExternalOrgId) {
    const ok = await prisma.externalOrganization.findFirst({
      where: {
        id: selection.clientExternalOrgId,
        hostOrganizationId: auth.orgId,
        type: { in: ["CLIENT_EXT", "CLIENT"] },
      },
      select: { id: true },
    });
    if (!ok) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 400 });
    }
  }

  if (selection.projectId) {
    const ok = await prisma.project.findFirst({
      where: { id: selection.projectId, organizationId: auth.orgId },
      select: { id: true },
    });
    if (!ok) {
      return NextResponse.json({ error: "Chantier introuvable" }, { status: 400 });
    }
  }

  try {
    const result = await commitBundleIntoQuote({
      orgId: auth.orgId,
      userId: auth.session.user.id,
      quoteId,
      bundle,
      fingerprint,
      selection,
    });
    return NextResponse.json({ ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Échec de l’import";
    console.error("[chatgpt-bundle/commit]", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
