/**
 * ECO-3 — Conséquence d’une acceptation devis : tenter le budget initial.
 * Aucune formule financière ici. Délègue à initializeProjectBudget.
 * L’échec ne doit jamais invalider l’acceptation.
 */
import { prisma } from "@/lib/prisma";
import { initializeProjectBudget } from "@/lib/chantier/project-profitability";

export type BudgetAutoInitStatus =
  | "CREATED"
  | "ALREADY_EXISTS"
  | "SKIP_NOT_ACCEPTED"
  | "SKIP_NO_PROJECT"
  | "FAILED";

export function decideProjectBudgetAutoInit(input: {
  quoteStatus: string;
  projectId?: string | null;
  budgetExists: boolean;
}): "INIT" | Exclude<BudgetAutoInitStatus, "CREATED" | "FAILED"> {
  if (input.quoteStatus !== "ACCEPTED") return "SKIP_NOT_ACCEPTED";
  if (!input.projectId) return "SKIP_NO_PROJECT";
  if (input.budgetExists) return "ALREADY_EXISTS";
  return "INIT";
}

export async function tryInitializeProjectBudgetAfterAccept(input: {
  orgId: string;
  quoteId: string;
  userId: string;
}): Promise<{
  status: BudgetAutoInitStatus;
  budgetId: string | null;
  error?: string;
}> {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: input.quoteId, organizationId: input.orgId },
    select: { id: true, status: true, projectId: true },
  });
  if (!quote) {
    return { status: "FAILED", budgetId: null, error: "Devis introuvable" };
  }

  const existing = quote.projectId
    ? await prisma.projectBudget.findUnique({
        where: { projectId: quote.projectId },
        select: { id: true },
      })
    : null;

  const decision = decideProjectBudgetAutoInit({
    quoteStatus: quote.status,
    projectId: quote.projectId,
    budgetExists: Boolean(existing),
  });
  if (decision !== "INIT") {
    return { status: decision, budgetId: existing?.id ?? null };
  }

  try {
    const budget = await initializeProjectBudget({
      orgId: input.orgId,
      projectId: quote.projectId!,
      quoteId: quote.id,
      userId: input.userId,
    });
    return { status: "CREATED", budgetId: budget.id };
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e
        ? String((e as { code?: string }).code)
        : "";
    if (code === "BUDGET_EXISTS" || code === "P2002") {
      const again = quote.projectId
        ? await prisma.projectBudget.findUnique({
            where: { projectId: quote.projectId },
            select: { id: true },
          })
        : null;
      return { status: "ALREADY_EXISTS", budgetId: again?.id ?? null };
    }
    const message = e instanceof Error ? e.message : "Initialisation budget impossible";
    console.error("[eco-3] auto-init budget failed (acceptation conservée):", message);
    return { status: "FAILED", budgetId: null, error: message };
  }
}
