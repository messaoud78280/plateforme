/**
 * ECO-4 — Pont opérationnel A_FACTURER → moteur Commercial.
 * Ne crée pas de facture. Ne compte pas une fiche comme du CA.
 */
import { prisma } from "@/lib/prisma";
import { isBillingPipelineStatus } from "@/lib/facturation/types";
import { canAccessFacturation } from "@/lib/facturation/access";

export type PrepareBillingDecision =
  | "BLOCK_NO_PROJECT"
  | "BLOCK_NO_MARKET"
  | "NEED_QUOTE_CHOICE"
  | "CONTINUE_PROGRESS"
  | "PREPARE_PROGRESS";

export type PrepareBillingQuote = {
  id: string;
  number: string;
  subject: string;
  clientExternalOrgId: string | null;
  clientName: string | null;
  draftStatementId: string | null;
  hasProgressHistory: boolean;
};

export type PrepareBillingContext = {
  decision: PrepareBillingDecision;
  actionLabel: "Préparer la facturation";
  sheet: {
    id: string;
    title: string;
    status: string;
    clientName: string | null;
  } | null;
  project: { id: string; title: string } | null;
  clientName: string | null;
  quotes: PrepareBillingQuote[];
  selectedQuoteId: string | null;
  draftStatementId: string | null;
  canPrepareDirectInvoice: boolean;
  why: string;
};

export function canPrepareBillingFromOps(user: {
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
}): boolean {
  if (user.personType === "CLIENT_EXT" || user.personType === "SUPPLIER") return false;
  if (user.permissionProfile === "CLIENT" || user.permissionProfile === "FOURNISSEUR") {
    return false;
  }
  return canAccessFacturation(user);
}

export function isPrepareBillingStatus(status: string): boolean {
  return isBillingPipelineStatus(status);
}

export function buildPrepareBillingHref(input: {
  projectId: string;
  sheetId?: string | null;
  quoteId?: string | null;
}): string {
  const q = new URLSearchParams();
  q.set("projectId", input.projectId);
  if (input.sheetId) q.set("sheetId", input.sheetId);
  if (input.quoteId) q.set("quoteId", input.quoteId);
  return `/dashboard/devis-facturation/factures/preparer?${q.toString()}`;
}

export function decidePrepareBilling(input: {
  hasProject: boolean;
  quoteCount: number;
  draftStatementId?: string | null;
}): PrepareBillingDecision {
  if (!input.hasProject) return "BLOCK_NO_PROJECT";
  if (input.quoteCount === 0) return "BLOCK_NO_MARKET";
  if (input.quoteCount > 1 && !input.draftStatementId) return "NEED_QUOTE_CHOICE";
  if (input.draftStatementId) return "CONTINUE_PROGRESS";
  return "PREPARE_PROGRESS";
}

export async function resolvePrepareBillingContext(input: {
  orgId: string;
  projectId?: string | null;
  sheetId?: string | null;
  quoteId?: string | null;
}): Promise<PrepareBillingContext> {
  let sheet: PrepareBillingContext["sheet"] = null;
  let projectId = input.projectId?.trim() || null;
  let sheetClient: string | null = null;

  if (input.sheetId) {
    const row = await prisma.followUpSheet.findFirst({
      where: { id: input.sheetId, organizationId: input.orgId },
      select: {
        id: true,
        title: true,
        status: true,
        clientName: true,
        projectId: true,
        project: { select: { id: true, title: true } },
      },
    });
    if (row) {
      sheet = {
        id: row.id,
        title: row.title,
        status: row.status,
        clientName: row.clientName,
      };
      sheetClient = row.clientName;
      if (!projectId) projectId = row.projectId ?? row.project?.id ?? null;
    }
  }

  const project = projectId
    ? await prisma.project.findFirst({
        where: { id: projectId, organizationId: input.orgId },
        select: { id: true, title: true },
      })
    : null;

  const quoteRows = project
    ? await prisma.commercialQuote.findMany({
        where: {
          organizationId: input.orgId,
          projectId: project.id,
          status: "ACCEPTED",
        },
        select: {
          id: true,
          number: true,
          subject: true,
          clientExternalOrgId: true,
          clientExternalOrg: { select: { name: true, tradeName: true } },
        },
        orderBy: { acceptedAt: "desc" },
      })
    : [];

  const quotes: PrepareBillingQuote[] = [];
  for (const q of quoteRows) {
    const statements = await prisma.commercialProgressStatement.findMany({
      where: { organizationId: input.orgId, quoteId: q.id },
      select: { id: true, status: true },
      orderBy: { number: "desc" },
    });
    quotes.push({
      id: q.id,
      number: q.number,
      subject: q.subject,
      clientExternalOrgId: q.clientExternalOrgId,
      clientName:
        q.clientExternalOrg?.tradeName || q.clientExternalOrg?.name || null,
      draftStatementId: statements.find((s) => s.status === "DRAFT")?.id ?? null,
      hasProgressHistory: statements.length > 0,
    });
  }

  const preferredQuote =
    (input.quoteId && quotes.find((q) => q.id === input.quoteId)) ||
    (quotes.length === 1 ? quotes[0] : quotes.find((q) => q.draftStatementId) ?? null);

  const decision = decidePrepareBilling({
    hasProject: Boolean(project),
    quoteCount: quotes.length,
    draftStatementId: preferredQuote?.draftStatementId ?? null,
  });

  const clientName =
    preferredQuote?.clientName || quotes[0]?.clientName || sheetClient;

  const why =
    decision === "BLOCK_NO_PROJECT"
      ? "Aucun chantier associé — rattachez la fiche avant de facturer."
      : decision === "BLOCK_NO_MARKET"
        ? "Aucun devis accepté sur ce chantier. La facturation commerciale nécessite un marché."
        : decision === "NEED_QUOTE_CHOICE"
          ? "Plusieurs marchés acceptés — choisissez lequel préparer."
          : decision === "CONTINUE_PROGRESS"
            ? "Une situation brouillon existe déjà — la continuer plutôt que d’en créer une autre."
            : "Préparer une situation commerciale. La facture naîtra ensuite du moteur Commercial.";

  return {
    decision,
    actionLabel: "Préparer la facturation",
    sheet,
    project,
    clientName,
    quotes,
    selectedQuoteId: preferredQuote?.id ?? null,
    draftStatementId: preferredQuote?.draftStatementId ?? null,
    canPrepareDirectInvoice: quotes.length > 0,
    why,
  };
}
