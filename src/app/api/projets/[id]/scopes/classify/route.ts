import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { isBeworkStaff } from "@/lib/authz";
import {
  attachQuoteToScope,
  attachSchedulePlanToScope,
  attachStudyToScope,
  codeFromScopeName,
  ensureProjectScope,
  setScopeReferenceQuote,
} from "@/lib/chantier/project-workspace";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST — classe des éléments existants vers un périmètre
 * (existant ou créé dans la même requête). Confirmation explicite requise.
 */
export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isBeworkStaff(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id: projectId } = await ctx.params;
  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, organizationId: true },
  });
  if (!project?.organizationId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    scopeId?: string;
    createScope?: { name?: string; code?: string; description?: string };
    items?: Array<{ kind: "study" | "quote" | "plan"; id: string }>;
    /** Devis à définir comme référence (sinon : premier devis, si le lot n’en a pas encore). */
    referenceQuoteId?: string;
  } | null;

  const items = Array.isArray(body?.items) ? body!.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "Sélectionnez au moins un élément" }, { status: 400 });
  }

  let scopeId = body?.scopeId?.trim() || "";

  if (!scopeId && body?.createScope?.name?.trim()) {
    const name = body.createScope.name.trim();
    const code =
      body.createScope.code?.trim() || codeFromScopeName(name);
    const count = await prisma.projectScope.count({
      where: { projectId, organizationId: project.organizationId },
    });
    const created = await ensureProjectScope({
      orgId: project.organizationId,
      projectId,
      code: code.slice(0, 32) || "LOT",
      name,
      description: body.createScope.description?.trim() || null,
      displayOrder: count,
    });
    scopeId = created.id;
  }

  if (!scopeId) {
    return NextResponse.json(
      { error: "Choisissez un lot existant ou créez-en un" },
      { status: 400 },
    );
  }

  const scope = await prisma.projectScope.findFirst({
    where: {
      id: scopeId,
      projectId,
      organizationId: project.organizationId,
      status: "ACTIVE",
    },
    select: { id: true, referenceQuoteId: true },
  });
  if (!scope) {
    return NextResponse.json({ error: "Périmètre introuvable" }, { status: 404 });
  }

  const preferredRef = body?.referenceQuoteId?.trim() || null;
  const quoteItems = items.filter((i) => i.kind === "quote" && i.id?.trim());

  const attached: string[] = [];
  const errors: string[] = [];

  for (const item of items) {
    const id = item.id?.trim();
    if (!id) continue;
    try {
      if (item.kind === "study") {
        await attachStudyToScope({
          orgId: project.organizationId,
          scopeId: scope.id,
          studyId: id,
          setAsReference: false,
        });
        attached.push(`study:${id}`);
      } else if (item.kind === "quote") {
        await attachQuoteToScope({
          orgId: project.organizationId,
          scopeId: scope.id,
          quoteId: id,
          setAsReference: false,
        });
        attached.push(`quote:${id}`);
      } else if (item.kind === "plan") {
        await attachSchedulePlanToScope({
          orgId: project.organizationId,
          scopeId: scope.id,
          planId: id,
        });
        attached.push(`plan:${id}`);
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Erreur de rattachement");
    }
  }

  // Devis de référence : choix explicite, sinon premier devis classé si le lot n’en a pas
  const fresh = await prisma.projectScope.findUnique({
    where: { id: scope.id },
    select: { referenceQuoteId: true },
  });
  const refCandidate =
    preferredRef &&
    quoteItems.some((q) => q.id === preferredRef)
      ? preferredRef
      : !fresh?.referenceQuoteId
        ? quoteItems[0]?.id?.trim() ?? null
        : null;
  if (refCandidate) {
    try {
      // Assurer membership puis baseline (sans retirer les autres)
      await attachQuoteToScope({
        orgId: project.organizationId,
        scopeId: scope.id,
        quoteId: refCandidate,
        setAsReference: false,
      });
      await setScopeReferenceQuote({
        orgId: project.organizationId,
        scopeId: scope.id,
        quoteId: refCandidate,
      });
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Référence devis impossible");
    }
  }

  if (attached.length === 0) {
    return NextResponse.json(
      { error: errors[0] ?? "Aucun élément n’a pu être classé" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    scopeId: scope.id,
    attached,
    errors: errors.length ? errors : undefined,
  });
}
