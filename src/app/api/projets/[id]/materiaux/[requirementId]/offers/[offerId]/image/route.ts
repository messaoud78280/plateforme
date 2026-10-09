/**
 * Photo produit liée à une SupplyOffer.
 * GET — stream sécurisé (storage://) ou redirect https.
 * POST — upload image (USER_UPLOAD).
 * PATCH — définir URL https (USER_URL / SUPPLIER_URL) ou supprimer.
 * DELETE — supprimer la photo.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  DOCUMENTS_BUCKET,
  buildDocumentsStorageRef,
  extractStoragePathFromUrl,
} from "@/lib/storage/supabase-object";
import { setSupplyOfferProductImage } from "@/lib/supply/offer-service";

type Ctx = {
  params: Promise<{ id: string; requirementId: string; offerId: string }>;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function gate(sessionUser: {
  id: string;
  personType?: string | null;
}): Promise<{ orgId: string } | NextResponse> {
  if (
    isExternalPortalUser(sessionUser.personType) ||
    !isInternalPurchaseOrderActor(sessionUser)
  ) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const orgId = await resolvePurchaseOrderOrgId(sessionUser);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
  }
  return { orgId };
}

async function loadOffer(opts: {
  orgId: string;
  projectId: string;
  requirementId: string;
  offerId: string;
}) {
  return prisma.supplyOffer.findFirst({
    where: {
      id: opts.offerId,
      organizationId: opts.orgId,
      requirementId: opts.requirementId,
      requirement: { projectId: opts.projectId },
    },
    select: {
      id: true,
      productImageUrl: true,
      productImageOrigin: true,
      organizationId: true,
    },
  });
}

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const g = await gate(session.user);
  if (g instanceof NextResponse) return g;

  const { id: projectId, requirementId, offerId } = await ctx.params;
  const offer = await loadOffer({
    orgId: g.orgId,
    projectId,
    requirementId,
    offerId,
  });
  if (!offer?.productImageUrl) {
    return NextResponse.json({ error: "Aucune photo" }, { status: 404 });
  }

  const raw = offer.productImageUrl.trim();
  if (/^https:\/\//i.test(raw)) {
    return NextResponse.redirect(raw, 302);
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Stockage indisponible" }, { status: 503 });
  }
  const path = extractStoragePathFromUrl(raw, DOCUMENTS_BUCKET);
  if (!path || !path.startsWith(`supply-offers/${g.orgId}/`)) {
    return NextResponse.json({ error: "Référence image invalide" }, { status: 400 });
  }

  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).download(path);
  if (error || !data) {
    return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
  }
  const buf = Buffer.from(await data.arrayBuffer());
  return new NextResponse(buf, {
    headers: {
      "Content-Type": data.type || "image/jpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const g = await gate(session.user);
  if (g instanceof NextResponse) return g;

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Stockage non configuré" }, { status: 503 });
  }

  const { id: projectId, requirementId, offerId } = await ctx.params;
  const existing = await loadOffer({
    orgId: g.orgId,
    projectId,
    requirementId,
    offerId,
  });
  if (!existing) {
    return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Image requise" }, { status: 400 });
  }
  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED_MIME.has(mime) && !mime.startsWith("image/")) {
    return NextResponse.json(
      { error: "Formats acceptés : JPEG, PNG, WebP, GIF" },
      { status: 400 },
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image trop volumineuse (max 5 Mo)" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const storagePath = `supply-offers/${g.orgId}/${offerId}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mime || "image/jpeg",
      upsert: false,
    });
  if (uploadError) {
    console.error("[supply-offer-image] upload", uploadError.message);
    return NextResponse.json({ error: "Échec de l’envoi" }, { status: 500 });
  }

  const storageRef = buildDocumentsStorageRef(storagePath);
  try {
    const offer = await setSupplyOfferProductImage({
      organizationId: g.orgId,
      projectId,
      requirementId,
      offerId,
      productImageUrl: storageRef,
      productImageOrigin: "USER_UPLOAD",
    });
    // best-effort cleanup ancienne image storage
    if (existing.productImageUrl?.startsWith("storage://")) {
      const old = extractStoragePathFromUrl(existing.productImageUrl, DOCUMENTS_BUCKET);
      if (old && old !== storagePath && old.startsWith(`supply-offers/${g.orgId}/`)) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([old]);
      }
    }
    return NextResponse.json({ ok: true, offer });
  } catch (e) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const g = await gate(session.user);
  if (g instanceof NextResponse) return g;

  const { id: projectId, requirementId, offerId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    productImageUrl?: string | null;
    productImageOrigin?: "USER_URL" | "SUPPLIER_URL" | null;
    clear?: boolean;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  try {
    if (body.clear) {
      const offer = await setSupplyOfferProductImage({
        organizationId: g.orgId,
        projectId,
        requirementId,
        offerId,
        productImageUrl: null,
        productImageOrigin: null,
      });
      return NextResponse.json({ ok: true, offer });
    }
    const url = String(body.productImageUrl ?? "").trim();
    if (!/^https:\/\//i.test(url)) {
      return NextResponse.json(
        { error: "Fournissez une URL https:// (pas de fetch serveur)" },
        { status: 400 },
      );
    }
    const offer = await setSupplyOfferProductImage({
      organizationId: g.orgId,
      projectId,
      requirementId,
      offerId,
      productImageUrl: url,
      productImageOrigin: body.productImageOrigin === "SUPPLIER_URL"
        ? "SUPPLIER_URL"
        : "USER_URL",
    });
    return NextResponse.json({ ok: true, offer });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const g = await gate(session.user);
  if (g instanceof NextResponse) return g;

  const { id: projectId, requirementId, offerId } = await ctx.params;
  const existing = await loadOffer({
    orgId: g.orgId,
    projectId,
    requirementId,
    offerId,
  });
  if (!existing) {
    return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
  }

  try {
    const offer = await setSupplyOfferProductImage({
      organizationId: g.orgId,
      projectId,
      requirementId,
      offerId,
      productImageUrl: null,
      productImageOrigin: null,
    });
    if (existing.productImageUrl?.startsWith("storage://")) {
      const supabase = createServiceRoleClient();
      const old = extractStoragePathFromUrl(
        existing.productImageUrl,
        DOCUMENTS_BUCKET,
      );
      if (old?.startsWith(`supply-offers/${g.orgId}/`) && supabase) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([old]);
      }
    }
    return NextResponse.json({ ok: true, offer });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
