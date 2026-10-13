/**
 * Pose les lots d’un modèle et relit la configuration de l’organisation.
 * Lecture des référentiels uniquement. Ne crée ni besoin, ni devis, ni commande,
 * ni visite, et ne lit aucun autre chantier.
 */
import { prisma } from "@/lib/prisma";
import { ensureProjectScope } from "@/lib/chantier/project-workspace";
import {
  buildTradeTemplateScopes,
  formatChantierTemplateReuseLines,
  getChantierTradeTemplate,
  selectReusableRows,
  type ChantierTemplateReuseFacts,
} from "@/lib/chantier/trade-templates";

export type AppliedChantierTradeTemplate = {
  id: string;
  label: string;
  lots: Array<{ id: string; code: string; name: string }>;
  lines: string[];
};

function asText(value: unknown): string | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (Number.isFinite(n)) {
    return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
  }
  const text = String(value).trim();
  return text || null;
}

function rowText(parts: Array<string | null | undefined>): string {
  return parts.filter((part) => part && part.trim()).join(" ");
}

export async function loadChantierTemplateReuse(input: {
  organizationId: string;
  templateId: string;
}): Promise<ChantierTemplateReuseFacts | null> {
  const template = getChantierTradeTemplate(input.templateId);
  if (!template) return null;

  const [organization, workItems, commercialMaterials, catalogMaterials, suppliers, trades] =
    await Promise.all([
      prisma.organization.findFirst({
        where: { id: input.organizationId },
        select: {
          name: true,
          commercialOrgSettings: {
            select: {
              defaultVatRate: true,
              defaultCurrency: true,
              defaultPaymentTerms: true,
              defaultValidityDays: true,
            },
          },
        },
      }),
      prisma.commercialWorkItem.findMany({
        where: {
          organizationId: input.organizationId,
          isActive: true,
          parentWorkItemId: null,
        },
        select: { id: true, name: true, family: true, subFamily: true, tags: true },
        orderBy: { name: "asc" },
        take: 800,
      }),
      prisma.commercialMaterial.findMany({
        where: { organizationId: input.organizationId, isActive: true },
        select: { id: true, name: true, family: true },
        orderBy: { name: "asc" },
        take: 800,
      }),
      prisma.catalogMaterial.findMany({
        where: {
          organizationId: input.organizationId,
          status: { not: "ARCHIVED" },
        },
        select: { id: true, designation: true, family: true },
        orderBy: { designation: "asc" },
        take: 800,
      }),
      prisma.externalOrganization.findMany({
        where: {
          hostOrganizationId: input.organizationId,
          type: "SUPPLIER",
          status: "ACTIVE",
        },
        select: { id: true, name: true, tradeName: true, activity: true },
        orderBy: { name: "asc" },
        take: 200,
      }),
      prisma.commercialLaborResource.findMany({
        where: { organizationId: input.organizationId, isActive: true },
        select: { id: true, name: true, trade: true },
        orderBy: { name: "asc" },
        take: 100,
      }),
    ]);

  if (!organization) return null;

  const matchedWorkItems = selectReusableRows(template, workItems, (row) =>
    rowText([row.name, row.family, row.subFamily, row.tags]),
  );
  const materialRows = [
    ...commercialMaterials.map((row) => ({ name: row.name, family: row.family })),
    ...catalogMaterials.map((row) => ({ name: row.designation, family: row.family })),
  ];
  const seenMaterials = new Set<string>();
  const matchedMaterials = selectReusableRows(template, materialRows, (row) =>
    rowText([row.name, row.family]),
  ).filter((row) => {
    const key = row.name.trim().toLowerCase();
    if (!key || seenMaterials.has(key)) return false;
    seenMaterials.add(key);
    return true;
  });
  const matchedSuppliers = selectReusableRows(template, suppliers, (row) =>
    rowText([row.name, row.tradeName, row.activity]),
  );
  const supplierSource = matchedSuppliers.length > 0 ? matchedSuppliers : suppliers;
  const matchedTrades = selectReusableRows(template, trades, (row) =>
    rowText([row.name, row.trade]),
  );
  const settings = organization.commercialOrgSettings;

  return {
    companyName: organization.name.trim() || "Entreprise",
    settingsConfigured: Boolean(settings),
    vatRate: asText(settings?.defaultVatRate),
    currency: settings?.defaultCurrency ?? null,
    paymentTerms: settings?.defaultPaymentTerms?.trim() || null,
    validityDays: settings?.defaultValidityDays ?? null,
    tradeNames: trades.map((row) => row.trade?.trim() || row.name),
    tradeCount: trades.length,
    matchedTradeNames: matchedTrades.map((row) => row.trade?.trim() || row.name),
    matchedTradeCount: matchedTrades.length,
    workItemNames: matchedWorkItems.map((row) => row.name),
    workItemCount: matchedWorkItems.length,
    materialNames: matchedMaterials.map((row) => row.name),
    materialCount: matchedMaterials.length,
    supplierNames: supplierSource.map((row) => row.tradeName?.trim() || row.name),
    supplierCount: supplierSource.length,
    suppliersMatchedByTrade: matchedSuppliers.length > 0,
  };
}

export async function applyChantierTradeTemplate(input: {
  organizationId: string;
  projectId: string;
  templateId: string;
}): Promise<AppliedChantierTradeTemplate | null> {
  const template = getChantierTradeTemplate(input.templateId);
  const drafts = buildTradeTemplateScopes(input.templateId);
  if (!template || !drafts) return null;

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organizationId: input.organizationId },
    select: { id: true },
  });
  if (!project) return null;

  const lots: AppliedChantierTradeTemplate["lots"] = [];
  for (const draft of drafts) {
    const scope = await ensureProjectScope({
      orgId: input.organizationId,
      projectId: input.projectId,
      code: draft.code,
      name: draft.name,
      description: draft.description,
      displayOrder: draft.displayOrder,
    });
    lots.push({ id: scope.id, code: draft.code, name: draft.name });
  }

  const facts = await loadChantierTemplateReuse({
    organizationId: input.organizationId,
    templateId: template.id,
  });

  return {
    id: template.id,
    label: template.label,
    lots,
    lines: facts ? formatChantierTemplateReuseLines(facts) : [],
  };
}
