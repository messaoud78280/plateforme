import bcrypt from "bcryptjs";
import {
  ClientAccountStatus,
  ContractStatus,
  OrganizationMemberRole,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildCreditsGrantUpdate } from "@/lib/credits-lifecycle";
import {
  DEMO_TEMPLATES,
  defaultModulesForTemplate,
  isDemoTemplateKey,
  toDemoEmail,
  type DemoModuleKey,
  type DemoTemplateKey,
} from "./constants";
import { addDays, generateLoginIdentifier, generateSecureDemoPassword } from "./credentials";
import { clearDemoEnvironmentData, seedDemoEnvironmentData } from "./seed";

export type CreateDemoEnvironmentInput = {
  companyName: string;
  internalName?: string;
  sector?: string;
  employeeCount?: number | null;
  logoUrl?: string | null;
  templateKey?: string;
  modulesEnabled?: string[];
  meetingAt?: Date | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  accessDaysAfterMeeting?: number;
  loginIdentifier?: string | null;
  password?: string | null;
  createdById?: string | null;
  notes?: string | null;
};

export type CreateDemoEnvironmentResult =
  | {
      ok: true;
      demoId: string;
      loginIdentifier: string;
      /** Mot de passe en clair — uniquement au moment de la création / reset. */
      passwordOnce: string;
      expiresAt: Date;
      companyName: string;
      loginUrlPath: string;
    }
  | { ok: false; error: string };

const DEFAULT_FICTIONAL_ROLES = [
  { name: "Marc Dupont", roleLabel: "Direction" },
  { name: "Karim Benali", roleLabel: "Conducteur de travaux" },
  { name: "Julie Martin", roleLabel: "Administratif" },
  { name: "Sophie Martin", roleLabel: "Client — ABC Promotion" },
  { name: "Thomas Bernard", roleLabel: "Fournisseur — Point.P" },
];

function resolveModules(templateKey: DemoTemplateKey, modules?: string[]): DemoModuleKey[] {
  if (modules && modules.length > 0) {
    return modules as DemoModuleKey[];
  }
  return defaultModulesForTemplate(templateKey);
}

export async function createDemoEnvironment(
  input: CreateDemoEnvironmentInput,
): Promise<CreateDemoEnvironmentResult> {
  const companyName = input.companyName.trim();
  if (companyName.length < 2) {
    return { ok: false, error: "Nom de l’entreprise requis." };
  }

  const templateKey: DemoTemplateKey = isDemoTemplateKey(input.templateKey ?? "")
    ? (input.templateKey as DemoTemplateKey)
    : "PME_BTP";

  const modulesEnabled = resolveModules(templateKey, input.modulesEnabled);
  const loginIdentifier = generateLoginIdentifier(companyName, input.loginIdentifier);
  const email = toDemoEmail(loginIdentifier);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { ok: false, error: "Cet identifiant de démonstration est déjà utilisé." };
  }
  const existingDemo = await prisma.demoEnvironment.findUnique({ where: { loginIdentifier } });
  if (existingDemo) {
    return { ok: false, error: "Cet identifiant de démonstration est déjà utilisé." };
  }

  const passwordOnce = input.password?.trim() || generateSecureDemoPassword();
  if (passwordOnce.length < 8) {
    return { ok: false, error: "Mot de passe trop court (8 caractères minimum)." };
  }

  const meetingAt = input.meetingAt ?? null;
  const startsAt = input.startsAt ?? new Date();
  const days = input.accessDaysAfterMeeting ?? 7;
  const expiresAt =
    input.expiresAt ??
    addDays(meetingAt && meetingAt.getTime() > Date.now() ? meetingAt : startsAt, days);

  const hashed = await bcrypt.hash(passwordOnce, 12);
  const internalName = (input.internalName?.trim() || `Démo — ${companyName}`).slice(0, 120);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashed,
          name: "Marc Dupont",
          role: UserRole.CLIENT,
          company: companyName,
          service: "Direction",
          formeJuridique: "SAS",
          secteurActivite: input.sector?.trim() || undefined,
          accountStatus: ClientAccountStatus.APPROVED,
          contractStatus: ContractStatus.SIGNED,
          subscriptionPlan: "STANDARD",
          ...buildCreditsGrantUpdate(80),
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: companyName,
          ownerUserId: user.id,
          members: {
            create: {
              userId: user.id,
              role: OrganizationMemberRole.OWNER,
            },
          },
        },
      });

      const demo = await tx.demoEnvironment.create({
        data: {
          companyName,
          internalName,
          sector: input.sector?.trim() || null,
          employeeCount: input.employeeCount ?? null,
          logoUrl: input.logoUrl?.trim() || null,
          templateKey,
          modulesEnabled,
          rolesConfig: DEFAULT_FICTIONAL_ROLES,
          meetingAt,
          startsAt,
          expiresAt,
          status: "ACTIVE",
          loginIdentifier,
          rootUserId: user.id,
          organizationId: organization.id,
          createdById: input.createdById ?? null,
          notes: input.notes?.trim() || null,
          seedVersion: "v1",
        },
      });

      return { user, organization, demo };
    });

    await seedDemoEnvironmentData({
      clientId: result.user.id,
      organizationId: result.organization.id,
      companyName,
      sector: input.sector,
      includeMarches: modulesEnabled.includes("marches"),
      loginIdentifier,
    });
    await prisma.demoEnvironment.update({
      where: { id: result.demo.id },
      data: { seedVersion: "v3-notify-w3c1" },
    });

    return {
      ok: true,
      demoId: result.demo.id,
      loginIdentifier,
      passwordOnce,
      expiresAt,
      companyName,
      loginUrlPath: "/connexion/demo",
    };
  } catch (e) {
    console.error("[demo-environment] create failed", e);
    return { ok: false, error: "Impossible de créer l’environnement de démonstration." };
  }
}

export async function resetDemoEnvironment(demoId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const demo = await prisma.demoEnvironment.findUnique({ where: { id: demoId } });
  if (!demo) return { ok: false, error: "Démonstration introuvable." };

  await clearDemoEnvironmentData(demo.rootUserId);
  if (demo.organizationId) {
    const modules = Array.isArray(demo.modulesEnabled) ? (demo.modulesEnabled as string[]) : [];
    await seedDemoEnvironmentData({
      clientId: demo.rootUserId,
      organizationId: demo.organizationId,
      companyName: demo.companyName,
      sector: demo.sector,
      includeMarches: modules.includes("marches"),
      loginIdentifier: demo.loginIdentifier,
    });
    await prisma.demoEnvironment.update({
      where: { id: demoId },
      data: { seedVersion: "v4-demo-cleanup" },
    });
  }
  return { ok: true };
}

/** Enrichit une démo existante avec les 5 personas (sans tout re-seeder). */
export async function enrichDemoPersonas(demoId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const demo = await prisma.demoEnvironment.findUnique({ where: { id: demoId } });
  if (!demo?.organizationId) return { ok: false, error: "Démonstration introuvable." };
  const { seedDemoPersonaUsers } = await import("./seed-personas");
  await seedDemoPersonaUsers({
    rootUserId: demo.rootUserId,
    organizationId: demo.organizationId,
    loginIdentifier: demo.loginIdentifier,
    companyName: demo.companyName,
  });
  const { ensureDemoStaffDisplayNames } = await import("./demo-staff-names");
  await ensureDemoStaffDisplayNames();
  const { ensureDemoMessagingStaff } = await import("./seed");
  await ensureDemoMessagingStaff();
  const { purgeDemoLegacyInbox } = await import("./cleanup-legacy-inbox");
  await purgeDemoLegacyInbox(demoId);
  const { ensureVictorHugoCoherence } = await import("./coherence-victor-hugo");
  await ensureVictorHugoCoherence({
    rootUserId: demo.rootUserId,
    organizationId: demo.organizationId,
    loginIdentifier: demo.loginIdentifier,
  });
  const { ensurePurchaseOrderAttentionDemoScenarios } = await import(
    "./purchase-order-attention-demo"
  );
  await ensurePurchaseOrderAttentionDemoScenarios({
    rootUserId: demo.rootUserId,
    organizationId: demo.organizationId,
    loginIdentifier: demo.loginIdentifier,
  });
  const { ensureDefaultWorkflow } = await import("@/lib/workflow/service");
  await ensureDefaultWorkflow(demo.organizationId);
  const { listDemoPersonaUsers } = await import("./seed-personas");
  const personas = await listDemoPersonaUsers({
    rootUserId: demo.rootUserId,
    loginIdentifier: demo.loginIdentifier,
  });
  const karim = personas.find((p) => p.key === "conducteur");
  const { ensureKanbanReadabilityDemo } = await import("./kanban-readability");
  await ensureKanbanReadabilityDemo({
    rootUserId: demo.rootUserId,
    organizationId: demo.organizationId,
    karimUserId: karim?.id ?? null,
    loginIdentifier: demo.loginIdentifier,
  });
  await prisma.demoEnvironment.update({
    where: { id: demoId },
    data: { seedVersion: "v4-demo-cleanup" },
  });
  return { ok: true };
}

/** Phase 0 — câble la chaîne Victor Hugo sur une démo déjà seedée. */
export async function enrichDemoCoherence(demoId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  return enrichDemoPersonas(demoId);
}

export async function resetDemoPassword(
  demoId: string,
  password?: string | null,
): Promise<{ ok: true; passwordOnce: string } | { ok: false; error: string }> {
  const demo = await prisma.demoEnvironment.findUnique({ where: { id: demoId } });
  if (!demo) return { ok: false, error: "Démonstration introuvable." };
  const passwordOnce = password?.trim() || generateSecureDemoPassword();
  if (passwordOnce.length < 8) return { ok: false, error: "Mot de passe trop court." };
  const hashed = await bcrypt.hash(passwordOnce, 12);
  await prisma.user.update({ where: { id: demo.rootUserId }, data: { password: hashed } });
  return { ok: true, passwordOnce };
}

export async function setDemoEnvironmentStatus(
  demoId: string,
  status: "ACTIVE" | "DISABLED" | "ARCHIVED",
) {
  return prisma.demoEnvironment.update({ where: { id: demoId }, data: { status } });
}

export async function extendDemoEnvironment(demoId: string, days: number) {
  const demo = await prisma.demoEnvironment.findUnique({ where: { id: demoId } });
  if (!demo) return null;
  const base = demo.expiresAt.getTime() > Date.now() ? demo.expiresAt : new Date();
  return prisma.demoEnvironment.update({
    where: { id: demoId },
    data: {
      expiresAt: addDays(base, days),
      status: "ACTIVE",
    },
  });
}

export async function duplicateDemoEnvironment(
  sourceId: string,
  overrides: { companyName: string; createdById?: string | null },
): Promise<CreateDemoEnvironmentResult> {
  const source = await prisma.demoEnvironment.findUnique({ where: { id: sourceId } });
  if (!source) return { ok: false, error: "Démonstration source introuvable." };

  return createDemoEnvironment({
    companyName: overrides.companyName,
    internalName: `Démo — ${overrides.companyName}`,
    sector: source.sector ?? undefined,
    employeeCount: source.employeeCount,
    logoUrl: source.logoUrl,
    templateKey: source.templateKey,
    modulesEnabled: Array.isArray(source.modulesEnabled)
      ? (source.modulesEnabled as string[])
      : defaultModulesForTemplate(
          isDemoTemplateKey(source.templateKey) ? source.templateKey : "PME_BTP",
        ),
    accessDaysAfterMeeting: 7,
    createdById: overrides.createdById,
    notes: `Dupliquée depuis ${source.companyName} (${source.id})`,
  });
}

export async function deleteDemoEnvironment(demoId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const demo = await prisma.demoEnvironment.findUnique({ where: { id: demoId } });
  if (!demo) return { ok: false, error: "Démonstration introuvable." };

  // Cascade User → projects/tasks… via rootUserId onDelete Cascade on DemoEnvironment
  // Delete demo record then user (org cascades from owner)
  await prisma.$transaction(async (tx) => {
    await tx.demoEnvironment.delete({ where: { id: demoId } });
    await tx.user.delete({ where: { id: demo.rootUserId } });
  });
  return { ok: true };
}

export function listTemplateOptions() {
  return Object.values(DEMO_TEMPLATES);
}
