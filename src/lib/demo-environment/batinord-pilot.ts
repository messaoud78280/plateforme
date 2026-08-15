/**
 * ONBOARDING-1 — seed client pilote BATINORD.
 * Données légères, idempotentes, jamais SETRIM.
 */
import bcrypt from "bcryptjs";
import {
  ChantierStatus,
  ClientAccountStatus,
  ContractStatus,
  OrganizationMemberRole,
  ProjectStatus,
  ProjectUrgency,
  TaskStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildCreditsGrantUpdate } from "@/lib/credits-lifecycle";
import { findOrCreateExternalOrganization } from "@/lib/equipe-acces/external-org";
import { scopesForProfile, upsertSingleProjectAccess } from "@/lib/equipe-acces/project-access";
import { createQuote, addLineFromWorkItem, transitionQuoteStatus } from "@/lib/commercial/quotes";
import { createWorkItem } from "@/lib/commercial/library";
import { acceptQuoteWithPdfArchive } from "@/lib/commercial/accepted-snapshot";
import { ensureCommercialOrgSettings } from "@/lib/commercial/settings";
import { createPurchaseOrder } from "@/lib/purchase-orders/service";
import { createPurchaseOrderReceipt } from "@/lib/purchase-orders/receiving";
import { createSupplierInvoice } from "@/lib/chantier/supplier-invoices";
import { buildSupplierInvoicePrefill } from "@/lib/chantier/prepare-supplier-invoice";
import { indexSourceDocument } from "@/lib/ged/index-source-document";
import { ensureChantierFolders } from "@/lib/chantier-dossier/folders";
import { defaultModulesForTemplate, toDemoEmail } from "./constants";
import { demoPersonaEmail } from "./personas";
import {
  BATINORD_COMPANY_NAME,
  BATINORD_LOGIN_IDENTIFIER,
  BatinordEnvironmentError,
  ONB1_MARK,
  ONB1_PO_NUMBER,
  ONB1_PO_SUBJECT,
  ONB1_QUOTE_NUMBER,
  ONB1_QUOTE_SUBJECT,
  ONB1_SUPPLIER_INVOICE,
  evaluateBatinordPilotGuard,
} from "./batinord-pilot-guard";

const RECETTE_PASSWORD_FALLBACK = "BeWorkDemo2026!";
const EXPIRES_AT = new Date("2030-12-31T23:59:59.000Z");
const SEED_VERSION = "onboarding-1-batinord";

const PROJECT_PARC = "Résidence Parc Central";
const PROJECT_ECOLE = "École Jean Moulin";
const CLIENT_NAME = "SCI DES HORIZONS";
const SUPPLIER_POINTP = "POINT.P BATINORD";
const SUPPLIER_KILOUTOU = "Kiloutou BATINORD";

const WORK_ITEMS = [
  {
    reference: "BAT-WI-01",
    name: "Étanchéité toiture-terrasse",
    description:
      "Fourniture et mise en œuvre d’une étanchéité toiture-terrasse, y compris relevés courants, selon plans d’exécution à valider.",
    sellHt: 65_000,
  },
  {
    reference: "BAT-WI-02",
    name: "Isolation thermique support",
    description:
      "Isolation thermique du support de toiture-terrasse, y compris toutes sujétions de calage — à confirmer selon étude thermique.",
    sellHt: 32_000,
  },
  {
    reference: "BAT-WI-03",
    name: "Relevés, évacuations et points singuliers",
    description:
      "Relevés, évacuations EP et traitement des points singuliers. Exutoires et descentes à vérifier sur plans.",
    sellHt: 23_000,
  },
] as const;

type SeedLog = { area: string; action: "created" | "reused" | "info"; detail: string };

function log(logs: SeedLog[], area: string, action: SeedLog["action"], detail: string) {
  logs.push({ area, action, detail });
  const mark = action === "created" ? "+" : action === "reused" ? "=" : "i";
  console.log(`  [${mark}] ${area} — ${detail}`);
}

function daysFromNow(days: number, hours = 9) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, 0, 0, 0);
  return d;
}

function assertBatinordOrg(orgId: string, loginIdentifier: string, status?: string | null) {
  const guard = evaluateBatinordPilotGuard({
    loginIdentifier,
    organizationId: orgId,
    status,
    companyName: BATINORD_COMPANY_NAME,
  });
  if (!guard.ok) {
    throw new BatinordEnvironmentError(guard.reason);
  }
}

async function assertNotSetrimOrg(orgId: string) {
  const setrim = await prisma.organization.findFirst({
    where: { name: "SETRIM" },
    select: { id: true },
  });
  if (setrim && setrim.id === orgId) {
    throw new BatinordEnvironmentError("organizationId SETRIM détecté — seed BATINORD refusé");
  }
}

async function ensureRootAndDemo(logs: SeedLog[]) {
  const existing = await prisma.demoEnvironment.findUnique({
    where: { loginIdentifier: BATINORD_LOGIN_IDENTIFIER },
  });

  if (existing) {
    if (!existing.organizationId) {
      throw new BatinordEnvironmentError(
        "DemoEnvironment batinord sans organizationId — ne jamais deviner",
      );
    }
    assertBatinordOrg(existing.organizationId, existing.loginIdentifier, existing.status);
    await assertNotSetrimOrg(existing.organizationId);

    const expiresAt =
      existing.expiresAt.getTime() < Date.now() ? EXPIRES_AT : existing.expiresAt;

    await prisma.demoEnvironment.update({
      where: { id: existing.id },
      data: {
        companyName: BATINORD_COMPANY_NAME,
        internalName: "BATINORD — client pilote",
        status: "ACTIVE",
        expiresAt,
        seedVersion: SEED_VERSION,
        notes: "ONBOARDING-1 — client pilote fictif. Organisation séparée de SETRIM.",
        rolesConfig: [
          { name: "Christopher Rockman", roleLabel: "Direction" },
          { name: "Laura Martin", roleLabel: "Administratif" },
          { name: "Nicolas Bernard", roleLabel: "Conducteur de travaux" },
        ],
      },
    });
    await prisma.organization.update({
      where: { id: existing.organizationId },
      data: { name: BATINORD_COMPANY_NAME },
    });
    await prisma.user.update({
      where: { id: existing.rootUserId },
      data: {
        name: "Christopher Rockman",
        company: BATINORD_COMPANY_NAME,
        service: "Direction",
        jobTitle: "Direction",
        personType: "INTERNAL",
        permissionProfile: "DIRECTION",
        accessStatus: "ACTIVE",
        teamRole: "ADMIN",
      },
    });
    log(logs, "organisation", "reused", `${BATINORD_COMPANY_NAME} ${existing.organizationId}`);
    return {
      demoId: existing.id,
      organizationId: existing.organizationId,
      rootUserId: existing.rootUserId,
      created: false,
    };
  }

  const email = toDemoEmail(BATINORD_LOGIN_IDENTIFIER);
  const collision = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (collision) {
    throw new BatinordEnvironmentError(
      `Utilisateur ${email} existe déjà sans DemoEnvironment batinord`,
    );
  }

  const passwordOnce =
    process.env.BATINORD_PILOT_PASSWORD?.trim() || RECETTE_PASSWORD_FALLBACK;
  if (passwordOnce.length < 8) {
    throw new BatinordEnvironmentError("Mot de passe recette trop court");
  }
  const hashed = await bcrypt.hash(passwordOnce, 12);
  const modulesEnabled = defaultModulesForTemplate("PME_BTP");

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashed,
        name: "Christopher Rockman",
        role: UserRole.CLIENT,
        company: BATINORD_COMPANY_NAME,
        service: "Direction",
        jobTitle: "Direction",
        formeJuridique: "SAS",
        secteurActivite: "Entreprise générale",
        personType: "INTERNAL",
        permissionProfile: "DIRECTION",
        accessStatus: "ACTIVE",
        teamRole: "ADMIN",
        accountStatus: ClientAccountStatus.APPROVED,
        contractStatus: ContractStatus.SIGNED,
        subscriptionPlan: "STANDARD",
        ...buildCreditsGrantUpdate(80),
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: BATINORD_COMPANY_NAME,
        ownerUserId: user.id,
        members: {
          create: { userId: user.id, role: OrganizationMemberRole.OWNER },
        },
      },
    });

    const demo = await tx.demoEnvironment.create({
      data: {
        companyName: BATINORD_COMPANY_NAME,
        internalName: "BATINORD — client pilote",
        sector: "Entreprise générale",
        templateKey: "PME_BTP",
        modulesEnabled,
        rolesConfig: [
          { name: "Christopher Rockman", roleLabel: "Direction" },
          { name: "Laura Martin", roleLabel: "Administratif" },
          { name: "Nicolas Bernard", roleLabel: "Conducteur de travaux" },
        ],
        startsAt: new Date(),
        expiresAt: EXPIRES_AT,
        status: "ACTIVE",
        loginIdentifier: BATINORD_LOGIN_IDENTIFIER,
        rootUserId: user.id,
        organizationId: organization.id,
        notes: "ONBOARDING-1 — client pilote fictif. Organisation séparée de SETRIM.",
        seedVersion: SEED_VERSION,
      },
    });

    return { user, organization, demo };
  });

  assertBatinordOrg(created.organization.id, BATINORD_LOGIN_IDENTIFIER, "ACTIVE");
  await assertNotSetrimOrg(created.organization.id);
  log(logs, "organisation", "created", `${BATINORD_COMPANY_NAME} ${created.organization.id}`);
  return {
    demoId: created.demo.id,
    organizationId: created.organization.id,
    rootUserId: created.user.id,
    created: true,
  };
}

async function ensureInternalUser(opts: {
  organizationId: string;
  rootUserId: string;
  passwordHash: string;
  suffix: string;
  name: string;
  jobTitle: string;
  permissionProfile: "ADMINISTRATIF" | "CONDUCTEUR";
  teamRole: "USER" | "SUPERVISEUR";
  logs: SeedLog[];
}) {
  const email = demoPersonaEmail(BATINORD_LOGIN_IDENTIFIER, opts.suffix);
  const existing = await prisma.user.findUnique({ where: { email } });
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: opts.name,
          company: BATINORD_COMPANY_NAME,
          jobTitle: opts.jobTitle,
          personType: "INTERNAL",
          permissionProfile: opts.permissionProfile,
          accessStatus: "ACTIVE",
          invitedById: opts.rootUserId,
          teamRole: opts.teamRole,
          password: existing.password || opts.passwordHash,
        },
        select: { id: true, email: true, name: true },
      })
    : await prisma.user.create({
        data: {
          email,
          password: opts.passwordHash,
          name: opts.name,
          role: UserRole.CLIENT,
          company: BATINORD_COMPANY_NAME,
          jobTitle: opts.jobTitle,
          personType: "INTERNAL",
          permissionProfile: opts.permissionProfile,
          accessStatus: "ACTIVE",
          invitedById: opts.rootUserId,
          teamRole: opts.teamRole,
          accountStatus: "APPROVED",
          contractStatus: "SIGNED",
          subscriptionPlan: null,
          monthlyActionsTotal: 0,
          monthlyActionsUsed: 0,
        },
        select: { id: true, email: true, name: true },
      });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: opts.organizationId,
        userId: user.id,
      },
    },
    create: {
      organizationId: opts.organizationId,
      userId: user.id,
      role: OrganizationMemberRole.MEMBER,
    },
    update: { role: OrganizationMemberRole.MEMBER },
  });

  log(opts.logs, "utilisateur", existing ? "reused" : "created", `${opts.name} (${email})`);
  return user;
}

async function ensureExternal(
  orgId: string,
  name: string,
  personType: "CLIENT_EXT" | "SUPPLIER",
  extra: { tradeName?: string; city?: string; address?: string } | undefined,
  logs: SeedLog[],
) {
  const id = await findOrCreateExternalOrganization({
    hostOrganizationId: orgId,
    name,
    personType,
  });
  if (!id) throw new BatinordEnvironmentError(`Impossible de créer ${name}`);
  if (extra) {
    await prisma.externalOrganization.update({
      where: { id },
      data: {
        tradeName: extra.tradeName ?? undefined,
        city: extra.city ?? undefined,
        address: extra.address ?? undefined,
      },
    });
  }
  const created = await prisma.externalOrganization.findFirst({
    where: { id, hostOrganizationId: orgId },
    select: { id: true, name: true, createdAt: true },
  });
  if (!created) {
    throw new BatinordEnvironmentError(`${name} hors organisation BATINORD`);
  }
  log(logs, personType === "CLIENT_EXT" ? "client" : "fournisseur", "reused", name);
  return created;
}

async function ensureContact(externalOrganizationId: string, logs: SeedLog[]) {
  const existing = await prisma.externalOrgContact.findFirst({
    where: { externalOrganizationId, email: "claire.morel@sci-horizons.example" },
    select: { id: true },
  });
  if (existing) {
    log(logs, "client", "reused", "Contact Claire Morel");
    return existing.id;
  }
  const created = await prisma.externalOrgContact.create({
    data: {
      externalOrganizationId,
      firstName: "Claire",
      lastName: "Morel",
      jobTitle: "Gestionnaire",
      email: "claire.morel@sci-horizons.example",
      isPrimary: true,
    },
    select: { id: true },
  });
  log(logs, "client", "created", "Contact Claire Morel");
  return created.id;
}

async function ensureProject(opts: {
  organizationId: string;
  clientId: string;
  title: string;
  description: string;
  siteAddress: string;
  siteCity: string;
  chantierStatus: ChantierStatus;
  urgency: ProjectUrgency;
  manager: string;
  logs: SeedLog[];
}) {
  const existing = await prisma.project.findFirst({
    where: { organizationId: opts.organizationId, title: opts.title },
    select: { id: true, title: true },
  });
  if (existing) {
    log(opts.logs, "chantier", "reused", opts.title);
    return existing;
  }
  const created = await prisma.project.create({
    data: {
      title: opts.title,
      description: opts.description,
      status: ProjectStatus.EN_COURS,
      chantierStatus: opts.chantierStatus,
      clientId: opts.clientId,
      organizationId: opts.organizationId,
      siteAddress: opts.siteAddress,
      siteCity: opts.siteCity,
      internalManager: opts.manager,
      urgency: opts.urgency,
      plannedStartDate: daysFromNow(-7),
      plannedEndDate: daysFromNow(90),
      deadline: daysFromNow(90),
    },
    select: { id: true, title: true },
  });
  await ensureChantierFolders(created.id);
  log(opts.logs, "chantier", "created", opts.title);
  return created;
}

async function ensureWorkItems(orgId: string, userId: string, logs: SeedLog[]) {
  const ids: Record<string, string> = {};
  for (const spec of WORK_ITEMS) {
    const existing = await prisma.commercialWorkItem.findFirst({
      where: { organizationId: orgId, reference: spec.reference },
      select: { id: true },
    });
    if (existing) {
      ids[spec.reference] = existing.id;
      log(logs, "biblio", "reused", spec.reference);
      continue;
    }
    const created = await createWorkItem(orgId, {
      name: spec.name,
      reference: spec.reference,
      description: spec.description,
      family: "Étanchéité",
      saleUnit: "ens",
      kind: "SIMPLE",
      unitSellHt: spec.sellHt,
      sellMode: "FIXED_SELL",
      createdById: userId,
    });
    ids[spec.reference] = created.id;
    log(logs, "biblio", "created", `${spec.reference} — ${spec.sellHt} € HT`);
  }
  return ids;
}

async function ensureQuote(opts: {
  orgId: string;
  userId: string;
  projectId: string;
  clientExternalOrgId: string;
  siteAddress: string;
  workItemIds: Record<string, string>;
  logs: SeedLog[];
}) {
  let quote = await prisma.commercialQuote.findFirst({
    where: {
      organizationId: opts.orgId,
      OR: [{ number: ONB1_QUOTE_NUMBER }, { subject: ONB1_QUOTE_SUBJECT }],
    },
    include: {
      currentVersion: { include: { lines: { select: { id: true, kind: true, reference: true } } } },
    },
  });

  if (!quote) {
    const created = await createQuote({
      orgId: opts.orgId,
      userId: opts.userId,
      subject: ONB1_QUOTE_SUBJECT,
      clientExternalOrgId: opts.clientExternalOrgId,
      projectId: opts.projectId,
      siteAddressSnapshot: opts.siteAddress,
      paymentTerms: "30 jours",
      clientNotes: "Devis de démarrage BATINORD — Résidence Parc Central. Données fictives.",
    });
    const taken = await prisma.commercialQuote.findFirst({
      where: { organizationId: opts.orgId, number: ONB1_QUOTE_NUMBER },
      select: { id: true },
    });
    quote = await prisma.commercialQuote.update({
      where: { id: created.id },
      data: taken ? {} : { number: ONB1_QUOTE_NUMBER },
      include: {
        currentVersion: { include: { lines: { select: { id: true, kind: true, reference: true } } } },
      },
    });
    log(opts.logs, "devis", "created", quote.number);
  } else {
    log(opts.logs, "devis", "reused", `${quote.number} (${quote.status})`);
  }

  if (quote.status === "DRAFT") {
    for (const spec of WORK_ITEMS) {
      const already = quote.currentVersion?.lines.some((l) => l.reference === spec.reference);
      if (already) continue;
      await addLineFromWorkItem(opts.orgId, quote.id, {
        workItemId: opts.workItemIds[spec.reference]!,
        quantity: 1,
      });
    }
    log(opts.logs, "devis", "info", "3 ouvrages → 120 000 € HT");
  }

  return prisma.commercialQuote.findFirstOrThrow({
    where: { id: quote.id, organizationId: opts.orgId },
    select: {
      id: true,
      number: true,
      status: true,
      totalSellHt: true,
      projectId: true,
    },
  });
}

async function ensureAccepted(opts: {
  orgId: string;
  userId: string;
  quoteId: string;
  status: string;
  logs: SeedLog[];
}) {
  if (opts.status === "ACCEPTED") {
    const snap = await prisma.commercialQuoteSnapshot.findFirst({
      where: { quoteId: opts.quoteId, organizationId: opts.orgId, kind: "ACCEPTED_PDF" },
      select: { id: true },
    });
    log(
      opts.logs,
      "acceptation",
      "reused",
      snap ? "ACCEPTED + snapshot" : "ACCEPTED (snapshot éventuellement manquant)",
    );
    return;
  }

  if (opts.status === "DRAFT" || opts.status === "TO_VALIDATE" || opts.status === "VALIDATED") {
    await transitionQuoteStatus(opts.orgId, opts.quoteId, "SENT", opts.userId);
    log(opts.logs, "acceptation", "created", "→ SENT");
  }

  const result = await acceptQuoteWithPdfArchive({
    orgId: opts.orgId,
    quoteId: opts.quoteId,
    actorUserId: opts.userId,
  });
  log(
    opts.logs,
    "acceptation",
    "created",
    result.pdfArchived
      ? `ACCEPTED + snapshot + budget ${result.budgetInit.status}`
      : `ACCEPTED — PDF : ${result.pdfArchiveError ?? "non archivé"} / budget ${result.budgetInit.status}`,
  );
}

async function ensurePurchaseOrder(opts: {
  orgId: string;
  projectId: string;
  userId: string;
  supplierId: string;
  deliveryAddress: string;
  logs: SeedLog[];
}) {
  let po = await prisma.purchaseOrder.findFirst({
    where: {
      organizationId: opts.orgId,
      OR: [{ number: ONB1_PO_NUMBER }, { subject: ONB1_PO_SUBJECT }],
    },
    include: { lines: true, receipts: { where: { cancelledAt: null }, select: { id: true } } },
  });

  if (!po) {
    const created = await createPurchaseOrder({
      organizationId: opts.orgId,
      subject: ONB1_PO_SUBJECT,
      projectId: opts.projectId,
      externalOrganizationId: opts.supplierId,
      requestedById: opts.userId,
      responsibleId: opts.userId,
      requestedDeliveryAt: daysFromNow(10, 7),
      deliveryPlaceType: "CHANTIER",
      deliveryAddress: opts.deliveryAddress,
      status: "CONFIRMEE",
      defaultCostCategory: "MATERIAL",
      lines: [
        {
          designation: "Membrane bitume 8 mm — toiture-terrasse",
          quantity: 200,
          unit: "m²",
          unitPriceHt: 30,
          costCategory: "MATERIAL",
        },
        {
          designation: "Isolant PIR 120 mm",
          quantity: 200,
          unit: "m²",
          unitPriceHt: 10,
          costCategory: "MATERIAL",
        },
      ],
    });
    const taken = await prisma.purchaseOrder.findFirst({
      where: { organizationId: opts.orgId, number: ONB1_PO_NUMBER },
      select: { id: true },
    });
    po = await prisma.purchaseOrder.update({
      where: { id: created.id },
      data: taken ? {} : { number: ONB1_PO_NUMBER },
      include: { lines: true, receipts: { where: { cancelledAt: null }, select: { id: true } } },
    });
    log(opts.logs, "commande", "created", `${po.number} — 8 000 € HT MATERIAL`);
  } else {
    log(opts.logs, "commande", "reused", `${po.number} (${po.status})`);
  }

  return po;
}

async function ensureReceipt(opts: {
  orgId: string;
  userId: string;
  userName: string;
  order: {
    id: string;
    number: string;
    lines: Array<{ id: string; designation: string }>;
    receipts: { id: string }[];
  };
  logs: SeedLog[];
}) {
  if (opts.order.receipts.length > 0) {
    log(opts.logs, "reception", "reused", opts.order.number);
    return opts.order.receipts[0]!.id;
  }
  const membrane = opts.order.lines.find((l) =>
    String(l.designation).toLowerCase().includes("membrane"),
  );
  const isolant = opts.order.lines.find((l) =>
    String(l.designation).toLowerCase().includes("isolant"),
  );
  if (!membrane) throw new BatinordEnvironmentError("Ligne membrane introuvable");
  await createPurchaseOrderReceipt({
    organizationId: opts.orgId,
    orderId: opts.order.id,
    receivedById: opts.userId,
    receivedByName: opts.userName,
    deliveryNoteNumber: "BL-BAT-001",
    commentInternal: `${ONB1_MARK} Réception partielle matériaux`,
    lines: [
      { orderLineId: membrane.id, receivedQty: 150, damagedQty: 0, refusedQty: 0 },
      ...(isolant
        ? [{ orderLineId: isolant.id, receivedQty: 100, damagedQty: 0, refusedQty: 0 }]
        : []),
    ],
  });
  const created = await prisma.purchaseOrderReceipt.findFirstOrThrow({
    where: { purchaseOrderId: opts.order.id, cancelledAt: null },
    select: { id: true },
  });
  log(opts.logs, "reception", "created", `${opts.order.number} partielle`);
  return created.id;
}

async function ensureSupplierInvoice(opts: {
  orgId: string;
  userId: string;
  projectId: string;
  purchaseOrderId: string;
  supplierId: string;
  logs: SeedLog[];
}) {
  const existing = await prisma.supplierInvoice.findFirst({
    where: { organizationId: opts.orgId, supplierNumber: ONB1_SUPPLIER_INVOICE },
    select: { id: true, status: true, amountHt: true },
  });
  if (existing) {
    log(opts.logs, "facture-fournisseur", "reused", ONB1_SUPPLIER_INVOICE);
    return existing;
  }
  const created = await createSupplierInvoice({
    orgId: opts.orgId,
    userId: opts.userId,
    projectId: opts.projectId,
    purchaseOrderId: opts.purchaseOrderId,
    externalOrganizationId: opts.supplierId,
    supplierNumber: ONB1_SUPPLIER_INVOICE,
    category: "MATERIAL",
    invoiceDate: new Date(),
    amountHt: 7_800,
    amountVat: 1_560,
    notes: `${ONB1_MARK} Facture partielle POINT.P BATINORD`,
  });
  log(opts.logs, "facture-fournisseur", "created", `${ONB1_SUPPLIER_INVOICE} — 7 800 € HT RECORDED`);
  return created;
}

async function ensureTasks(opts: {
  organizationId: string;
  clientId: string;
  projectId: string;
  logs: SeedLog[];
}) {
  const titles = [
    {
      title: "Vérifier livraison POINT.P",
      description: `${ONB1_MARK} Contrôler BL et quantités conformes sur Parc Central.`,
      priority: "PRIORITAIRE",
      status: TaskStatus.EN_COURS,
    },
    {
      title: "Préparer réunion chantier",
      description: `${ONB1_MARK} Ordre du jour : accès, planning pose, points SCI DES HORIZONS.`,
      priority: "STANDARD",
      status: TaskStatus.NOUVEAU,
    },
    {
      title: "Envoyer devis client",
      description: `${ONB1_MARK} Devis Parc Central déjà accepté — conserver le PDF signé côté GED.`,
      priority: "STANDARD",
      status: TaskStatus.COMPLETE,
    },
  ];
  for (const t of titles) {
    const existing = await prisma.task.findFirst({
      where: { organizationId: opts.organizationId, title: t.title },
      select: { id: true },
    });
    if (existing) {
      log(opts.logs, "tache", "reused", t.title);
      continue;
    }
    await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        clientId: opts.clientId,
        organizationId: opts.organizationId,
        projectId: opts.projectId,
        category: "Tâche chantier",
        desiredDate: daysFromNow(3),
      },
    });
    log(opts.logs, "tache", "created", t.title);
  }
}

async function ensureAgenda(opts: {
  organizationId: string;
  ownerUserId: string;
  nicolasId: string;
  lauraId: string;
  projectId: string;
  logs: SeedLog[];
}) {
  const events = [
    {
      title: `${ONB1_MARK} Visite chantier — Résidence Parc Central`,
      type: "VISITE_CHANTIER" as const,
      startAt: daysFromNow(2, 9),
      endAt: daysFromNow(2, 11),
      attendeeIds: [opts.ownerUserId, opts.nicolasId],
    },
    {
      title: `${ONB1_MARK} Réunion client — SCI DES HORIZONS`,
      type: "RDV_CLIENT" as const,
      startAt: daysFromNow(5, 14),
      endAt: daysFromNow(5, 15),
      attendeeIds: [opts.ownerUserId, opts.lauraId],
    },
  ];
  for (const ev of events) {
    const existing = await prisma.agendaEvent.findFirst({
      where: { organizationId: opts.organizationId, title: ev.title },
      select: { id: true },
    });
    if (existing) {
      log(opts.logs, "agenda", "reused", ev.title);
      continue;
    }
    await prisma.agendaEvent.create({
      data: {
        organizationId: opts.organizationId,
        ownerUserId: opts.ownerUserId,
        createdById: opts.ownerUserId,
        title: ev.title,
        location: "Résidence Parc Central, Montreuil",
        type: ev.type,
        startAt: ev.startAt,
        endAt: ev.endAt,
        projectId: opts.projectId,
        responsibleId: opts.ownerUserId,
        attendees: {
          create: ev.attendeeIds.map((userId) => ({ userId, status: "ACCEPTE" })),
        },
      },
    });
    log(opts.logs, "agenda", "created", ev.title);
  }
}

async function ensureMessages(opts: {
  christopherId: string;
  nicolasId: string;
  logs: SeedLog[];
}) {
  const existing = await prisma.directMessage.count({
    where: {
      OR: [
        { senderId: opts.christopherId, receiverId: opts.nicolasId },
        { senderId: opts.nicolasId, receiverId: opts.christopherId },
      ],
      content: { contains: ONB1_MARK },
    },
  });
  if (existing > 0) {
    log(opts.logs, "messagerie", "reused", "Conversation Christopher ↔ Nicolas");
    return;
  }
  await prisma.directMessage.createMany({
    data: [
      {
        senderId: opts.christopherId,
        receiverId: opts.nicolasId,
        content: `${ONB1_MARK} Nicolas, peux-tu vérifier l’accès camion pour la livraison POINT.P sur Parc Central ?`,
        read: true,
      },
      {
        senderId: opts.nicolasId,
        receiverId: opts.christopherId,
        content: `${ONB1_MARK} Accès OK côté cour. Je serai sur place pour la réception partielle.`,
        read: false,
      },
    ],
  });
  log(opts.logs, "messagerie", "created", "2 messages Christopher ↔ Nicolas");
}

async function ensureDocuments(opts: {
  organizationId: string;
  clientId: string;
  addedById: string;
  projectId: string;
  logs: SeedLog[];
}) {
  const docs = [
    {
      name: "Plan de masse — Résidence Parc Central",
      entityId: "batinord:parc-central:plan-masse",
      folderCode: "03",
      documentType: "PLAN",
      category: "Plans",
    },
    {
      name: "Note de démarrage chantier — Parc Central",
      entityId: "batinord:parc-central:note-demarrage",
      folderCode: "00",
      documentType: "NOTE",
      category: "Chantier",
    },
    {
      name: "Facture fournisseur POINT.P BATINORD — FAC-BAT-2026-001",
      entityId: "batinord:parc-central:fac-bat-2026-001",
      folderCode: "05",
      documentType: "FACTURE",
      category: "Factures fournisseurs",
    },
  ];
  for (const doc of docs) {
    const result = await indexSourceDocument({
      projectId: opts.projectId,
      organizationId: opts.organizationId,
      clientId: opts.clientId,
      addedById: opts.addedById,
      name: doc.name,
      fileUrl: `ged://batinord/${doc.entityId}.pdf`,
      mimeType: "application/pdf",
      fileSize: 12_000,
      documentType: doc.documentType,
      category: doc.category,
      folderCode: doc.folderCode,
      visibility: "Interne entreprise cliente",
      emitterName: BATINORD_COMPANY_NAME,
      primary: {
        entityType: "legacy_document",
        entityId: doc.entityId,
        entityLabel: doc.name,
      },
    });
    log(
      opts.logs,
      "document",
      result.created ? "created" : "reused",
      `${doc.name}${result.reason ? ` (${result.reason})` : ""}`,
    );
  }
}

export type BatinordPilotResult = {
  organizationId: string;
  loginIdentifier: string;
  rootUserId: string;
  users: {
    christopher: { id: string; email: string };
    laura: { id: string; email: string };
    nicolas: { id: string; email: string };
  };
  projectParcId: string;
  projectEcoleId: string;
  quoteId: string;
  purchaseOrderId: string;
  logs: SeedLog[];
};

export async function runBatinordPilotSeed(): Promise<BatinordPilotResult> {
  const logs: SeedLog[] = [];
  const identity = await ensureRootAndDemo(logs);
  assertBatinordOrg(identity.organizationId, BATINORD_LOGIN_IDENTIFIER, "ACTIVE");
  await assertNotSetrimOrg(identity.organizationId);

  const root = await prisma.user.findUniqueOrThrow({
    where: { id: identity.rootUserId },
    select: { id: true, email: true, password: true, name: true },
  });
  const passwordHash =
    root.password ||
    (await bcrypt.hash(process.env.BATINORD_PILOT_PASSWORD?.trim() || RECETTE_PASSWORD_FALLBACK, 12));

  const laura = await ensureInternalUser({
    organizationId: identity.organizationId,
    rootUserId: root.id,
    passwordHash,
    suffix: "laura",
    name: "Laura Martin",
    jobTitle: "Responsable administratif",
    permissionProfile: "ADMINISTRATIF",
    teamRole: "USER",
    logs,
  });
  const nicolas = await ensureInternalUser({
    organizationId: identity.organizationId,
    rootUserId: root.id,
    passwordHash,
    suffix: "nicolas",
    name: "Nicolas Bernard",
    jobTitle: "Conducteur de travaux",
    permissionProfile: "CONDUCTEUR",
    teamRole: "SUPERVISEUR",
    logs,
  });

  await ensureCommercialOrgSettings(identity.organizationId);

  const client = await ensureExternal(identity.organizationId, CLIENT_NAME, "CLIENT_EXT", {
    city: "Montreuil",
    address: "24 rue des Horizons, 93100 Montreuil",
  }, logs);
  await ensureContact(client.id, logs);
  const pointp = await ensureExternal(identity.organizationId, SUPPLIER_POINTP, "SUPPLIER", {
    tradeName: "POINT.P BATINORD",
    city: "Bobigny",
  }, logs);
  await ensureExternal(identity.organizationId, SUPPLIER_KILOUTOU, "SUPPLIER", {
    tradeName: "Kiloutou BATINORD",
    city: "Pantin",
  }, logs);

  const parc = await ensureProject({
    organizationId: identity.organizationId,
    clientId: root.id,
    title: PROJECT_PARC,
    description: "Chantier de démarrage BATINORD — étanchéité toiture-terrasse. Client SCI DES HORIZONS.",
    siteAddress: "12 avenue du Parc Central, 93100 Montreuil",
    siteCity: "Montreuil",
    chantierStatus: ChantierStatus.EN_COURS,
    urgency: ProjectUrgency.HAUTE,
    manager: "Nicolas Bernard",
    logs,
  });
  const ecole = await ensureProject({
    organizationId: identity.organizationId,
    clientId: root.id,
    title: PROJECT_ECOLE,
    description: "Second chantier léger — listes et filtres multi-chantiers.",
    siteAddress: "15 rue Jean Moulin, 93200 Saint-Denis",
    siteCity: "Saint-Denis",
    chantierStatus: ChantierStatus.ETUDE,
    urgency: ProjectUrgency.BASSE,
    manager: "Nicolas Bernard",
    logs,
  });

  for (const project of [parc, ecole]) {
    for (const user of [laura, nicolas]) {
      const profile = user.id === nicolas.id ? "CONDUCTEUR" : "ADMINISTRATIF";
      await upsertSingleProjectAccess({
        projectId: project.id,
        userId: user.id,
        grantedById: root.id,
        scopes: scopesForProfile(profile),
        permissionProfile: profile,
      });
    }
  }

  const workItemIds = await ensureWorkItems(identity.organizationId, root.id, logs);
  const quote = await ensureQuote({
    orgId: identity.organizationId,
    userId: root.id,
    projectId: parc.id,
    clientExternalOrgId: client.id,
    siteAddress: "12 avenue du Parc Central, 93100 Montreuil",
    workItemIds,
    logs,
  });
  await ensureAccepted({
    orgId: identity.organizationId,
    userId: root.id,
    quoteId: quote.id,
    status: quote.status,
    logs,
  });

  const po = await ensurePurchaseOrder({
    orgId: identity.organizationId,
    projectId: parc.id,
    userId: root.id,
    supplierId: pointp.id,
    deliveryAddress: "12 avenue du Parc Central, 93100 Montreuil",
    logs,
  });

  const poFresh = await prisma.purchaseOrder.findFirstOrThrow({
    where: { id: po.id, organizationId: identity.organizationId },
    include: {
      lines: { select: { id: true, designation: true, quantity: true, unitPriceHt: true, costCategory: true } },
      receipts: { where: { cancelledAt: null }, select: { id: true } },
      externalOrganization: { select: { name: true } },
    },
  });

  await ensureReceipt({
    orgId: identity.organizationId,
    userId: nicolas.id,
    userName: "Nicolas Bernard",
    order: poFresh,
    logs,
  });

  const prefill = buildSupplierInvoicePrefill({
    supplierId: pointp.id,
    supplierName: pointp.name,
    projectId: parc.id,
    projectTitle: parc.title,
    purchaseOrderId: poFresh.id,
    purchaseOrderNumber: poFresh.number,
    orderAmountHt: 8_000,
    defaultCostCategory: "MATERIAL",
    lines: poFresh.lines.map((l) => ({
      designation: l.designation,
      quantity: Number(l.quantity),
      unitPriceHt: l.unitPriceHt != null ? Number(l.unitPriceHt) : null,
      costCategory: l.costCategory,
      receivedConforming: String(l.designation).toLowerCase().includes("membrane") ? 150 : 100,
    })),
  });
  log(
    logs,
    "eco-2",
    "info",
    `Préfill ${prefill.category} — reçu ${prefill.receivedAmountHt ?? "?"} € HT (aucune création auto)`,
  );

  await ensureSupplierInvoice({
    orgId: identity.organizationId,
    userId: laura.id,
    projectId: parc.id,
    purchaseOrderId: poFresh.id,
    supplierId: pointp.id,
    logs,
  });

  await ensureTasks({
    organizationId: identity.organizationId,
    clientId: root.id,
    projectId: parc.id,
    logs,
  });
  await ensureAgenda({
    organizationId: identity.organizationId,
    ownerUserId: root.id,
    nicolasId: nicolas.id,
    lauraId: laura.id,
    projectId: parc.id,
    logs,
  });
  await ensureMessages({
    christopherId: root.id,
    nicolasId: nicolas.id,
    logs,
  });
  await ensureDocuments({
    organizationId: identity.organizationId,
    clientId: root.id,
    addedById: root.id,
    projectId: parc.id,
    logs,
  });

  const delivery = await prisma.agendaEvent.findFirst({
    where: {
      organizationId: identity.organizationId,
      purchaseOrderId: poFresh.id,
      type: "LIVRAISON",
    },
    select: { id: true },
  });
  log(
    logs,
    "agenda",
    delivery ? "reused" : "info",
    delivery ? "Livraison BC synchronisée" : "Livraison BC absente — à vérifier sync existante",
  );

  return {
    organizationId: identity.organizationId,
    loginIdentifier: BATINORD_LOGIN_IDENTIFIER,
    rootUserId: root.id,
    users: {
      christopher: { id: root.id, email: root.email ?? toDemoEmail(BATINORD_LOGIN_IDENTIFIER) },
      laura: { id: laura.id, email: laura.email },
      nicolas: { id: nicolas.id, email: nicolas.email },
    },
    projectParcId: parc.id,
    projectEcoleId: ecole.id,
    quoteId: quote.id,
    purchaseOrderId: poFresh.id,
    logs,
  };
}

export async function countBatinordEntities(orgId: string) {
  const [
    users,
    clients,
    suppliers,
    projects,
    quotes,
    pos,
    receipts,
    invoices,
    tasks,
    agenda,
    messages,
    files,
  ] = await Promise.all([
    prisma.organizationMember.count({ where: { organizationId: orgId } }),
    prisma.externalOrganization.count({
      where: { hostOrganizationId: orgId, type: { in: ["CLIENT_EXT", "CLIENT"] } },
    }),
    prisma.externalOrganization.count({
      where: { hostOrganizationId: orgId, type: "SUPPLIER" },
    }),
    prisma.project.count({ where: { organizationId: orgId } }),
    prisma.commercialQuote.count({
      where: { organizationId: orgId, OR: [{ number: ONB1_QUOTE_NUMBER }, { subject: ONB1_QUOTE_SUBJECT }] },
    }),
    prisma.purchaseOrder.count({
      where: { organizationId: orgId, OR: [{ number: ONB1_PO_NUMBER }, { subject: ONB1_PO_SUBJECT }] },
    }),
    prisma.purchaseOrderReceipt.count({
      where: { organizationId: orgId, cancelledAt: null, purchaseOrder: { organizationId: orgId } },
    }),
    prisma.supplierInvoice.count({
      where: { organizationId: orgId, supplierNumber: ONB1_SUPPLIER_INVOICE },
    }),
    prisma.task.count({ where: { organizationId: orgId } }),
    prisma.agendaEvent.count({ where: { organizationId: orgId } }),
    prisma.directMessage.count({ where: { content: { contains: ONB1_MARK } } }),
    prisma.chantierFile.count({
      where: { organizationId: orgId, deletedAt: null },
    }),
  ]);
  return {
    users,
    clients,
    suppliers,
    projects,
    quotes,
    pos,
    receipts,
    invoices,
    tasks,
    agenda,
    messages,
    files,
  };
}
