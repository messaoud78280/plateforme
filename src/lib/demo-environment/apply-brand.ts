/**
 * SETRIM-DEMO-V1.1 — application one-shot / idempotente du branding DEMO.
 *
 * Met à jour Organization / DemoEnvironment / User Direction (+ internes)
 * sans reset métier (pas de clear/seed chantiers, BC, messages).
 */

import { prisma } from "@/lib/prisma";
import {
  DEMO_BRAND,
  demoBrandContactFullName,
  demoBrandDefaultLogoUrl,
  isLegacyDemoCompanyName,
  resolveDemoCompanyName,
} from "./brand";
import { DEMO_PERSONAS } from "./personas";
import { ensureDemoStaffDisplayNames } from "./demo-staff-names";

export type ApplyDemoBrandResult = {
  demosTouched: number;
  changes: string[];
  demos: Array<{
    id: string;
    loginIdentifier: string;
    companyNameBefore: string;
    companyNameAfter: string;
    rootNameBefore: string | null;
    rootNameAfter: string;
  }>;
};

function shouldRewriteInternalName(internalName: string | null | undefined): boolean {
  if (!internalName?.trim()) return true;
  return /ABC/i.test(internalName) || /Étanchéité \(Démo/i.test(internalName);
}

/**
 * Applique DEMO_BRAND sur les environnements démo concernés.
 * @param loginIdentifier — optionnel, cible une démo précise (ex. bework-demo)
 */
export async function applyDemoBrand(opts?: {
  loginIdentifier?: string | null;
}): Promise<ApplyDemoBrandResult> {
  const changes: string[] = [];
  const demosOut: ApplyDemoBrandResult["demos"] = [];

  const demos = await prisma.demoEnvironment.findMany({
    where: {
      status: { in: ["ACTIVE", "DISABLED"] },
      ...(opts?.loginIdentifier
        ? { loginIdentifier: opts.loginIdentifier.trim().toLowerCase() }
        : {}),
    },
    select: {
      id: true,
      companyName: true,
      internalName: true,
      logoUrl: true,
      loginIdentifier: true,
      organizationId: true,
      rootUserId: true,
      rolesConfig: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const targetName = DEMO_BRAND.companyName;
  const contactName = demoBrandContactFullName();
  const logoUrl = demoBrandDefaultLogoUrl(null);

  for (const demo of demos) {
    const companyBefore = demo.companyName;
    const companyAfter = resolveDemoCompanyName(demo.companyName);
    // Cible : legacy ABC → SETRIM, ou sync idempotent si déjà SETRIM. Autres prospects : skip.
    const isLegacy = isLegacyDemoCompanyName(demo.companyName);
    const isSetrimAlready = demo.companyName === targetName;
    if (!isLegacy && !isSetrimAlready) {
      continue;
    }

    const root = await prisma.user.findUnique({
      where: { id: demo.rootUserId },
      select: {
        id: true,
        name: true,
        company: true,
        jobTitle: true,
        service: true,
        email: true,
      },
    });
    if (!root) continue;

    const rootBefore = root.name;
    let demoChanged = false;

    if (demo.companyName !== companyAfter || demo.logoUrl !== logoUrl) {
      const internalName = shouldRewriteInternalName(demo.internalName)
        ? `Démo — ${companyAfter}`
        : demo.internalName;
      await prisma.demoEnvironment.update({
        where: { id: demo.id },
        data: {
          companyName: companyAfter,
          logoUrl,
          internalName,
          rolesConfig: [
            { name: DEMO_PERSONAS.direction.name, roleLabel: DEMO_PERSONAS.direction.label },
            { name: DEMO_PERSONAS.conducteur.name, roleLabel: DEMO_PERSONAS.conducteur.label },
            { name: DEMO_PERSONAS.administratif.name, roleLabel: DEMO_PERSONAS.administratif.label },
            {
              name: DEMO_PERSONAS.client.name,
              roleLabel: `Client — ${DEMO_PERSONAS.client.company}`,
            },
            {
              name: DEMO_PERSONAS.fournisseur.name,
              roleLabel: `Fournisseur — ${DEMO_PERSONAS.fournisseur.company}`,
            },
          ],
        },
      });
      demoChanged = true;
      if (companyBefore !== companyAfter) {
        changes.push(`[${demo.loginIdentifier}] companyName: ${companyBefore} → ${companyAfter}`);
      }
      if (demo.logoUrl !== logoUrl) {
        changes.push(`[${demo.loginIdentifier}] logoUrl → ${logoUrl}`);
      }
    }

    if (demo.organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: demo.organizationId },
        select: { id: true, name: true },
      });
      if (org && (isLegacyDemoCompanyName(org.name) || org.name !== companyAfter)) {
        if (isLegacyDemoCompanyName(org.name) || org.name === companyBefore) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { name: companyAfter },
          });
          changes.push(`[${demo.loginIdentifier}] Organization: ${org.name} → ${companyAfter}`);
          demoChanged = true;
        }
      }
    }

    const rootNeedsUpdate =
      root.name !== contactName ||
      root.company !== companyAfter ||
      root.jobTitle !== DEMO_BRAND.contactRoleLabel ||
      root.service !== DEMO_BRAND.contactRoleLabel;

    if (rootNeedsUpdate) {
      await prisma.user.update({
        where: { id: root.id },
        data: {
          name: contactName,
          company: companyAfter,
          jobTitle: DEMO_BRAND.contactRoleLabel,
          service: DEMO_BRAND.contactRoleLabel,
          personType: "INTERNAL",
          permissionProfile: "DIRECTION",
        },
      });
      changes.push(
        `[${demo.loginIdentifier}] Direction: ${rootBefore ?? "∅"} → ${contactName} (${root.email})`,
      );
      demoChanged = true;
    }

    // Internes Karim / Julie : company = SETRIM (pas Sophie/Thomas)
    const internals = await prisma.user.findMany({
      where: {
        OR: [
          { email: { startsWith: `${demo.loginIdentifier}+` } },
          { invitedById: demo.rootUserId, personType: "INTERNAL" },
        ],
        personType: "INTERNAL",
        NOT: { id: demo.rootUserId },
      },
      select: { id: true, email: true, name: true, company: true },
    });

    for (const u of internals) {
      if (u.company === companyAfter) continue;
      if (
        u.company == null ||
        isLegacyDemoCompanyName(u.company) ||
        /ABC/i.test(u.company ?? "")
      ) {
        await prisma.user.update({
          where: { id: u.id },
          data: { company: companyAfter },
        });
        changes.push(`[${demo.loginIdentifier}] ${u.name}: company → ${companyAfter}`);
        demoChanged = true;
      }
    }

    // Client persona : aligner société affichée (V2)
    const clientEmail = `${demo.loginIdentifier}+sophie@demo.bework.local`;
    const clientUser = await prisma.user.findUnique({
      where: { email: clientEmail },
      select: { id: true, company: true, name: true },
    });
    if (clientUser && clientUser.company !== DEMO_PERSONAS.client.company) {
      if (
        !clientUser.company ||
        clientUser.company === "ABC Promotion" ||
        /ABC/i.test(clientUser.company)
      ) {
        await prisma.user.update({
          where: { id: clientUser.id },
          data: { company: DEMO_PERSONAS.client.company },
        });
        changes.push(
          `[${demo.loginIdentifier}] Client ${clientUser.name}: company → ${DEMO_PERSONAS.client.company}`,
        );
        demoChanged = true;
      }
    }

    // External org client host label (si créé comme ABC Promotion)
    if (demo.organizationId) {
      const extClient = await prisma.externalOrganization.findFirst({
        where: {
          hostOrganizationId: demo.organizationId,
          type: "CLIENT_EXT",
          OR: [{ name: "ABC Promotion" }, { name: { contains: "ABC Promotion" } }],
        },
        select: { id: true, name: true },
      });
      if (extClient) {
        await prisma.externalOrganization.update({
          where: { id: extClient.id },
          data: { name: DEMO_PERSONAS.client.company },
        });
        changes.push(
          `[${demo.loginIdentifier}] ExternalOrg: ${extClient.name} → ${DEMO_PERSONAS.client.company}`,
        );
        demoChanged = true;
      }
    }

    demosOut.push({
      id: demo.id,
      loginIdentifier: demo.loginIdentifier,
      companyNameBefore: companyBefore,
      companyNameAfter: companyAfter,
      rootNameBefore: rootBefore,
      rootNameAfter: contactName,
    });
    void demoChanged;
  }

  const staff = await ensureDemoStaffDisplayNames();
  if (staff.renamed.length > 0) {
    for (const r of staff.renamed) {
      changes.push(`staff ${r.email}: ${r.from} → ${r.to}`);
    }
  }

  if (changes.length === 0) {
    changes.push("no-op — branding déjà aligné sur DEMO_BRAND");
  }

  return {
    demosTouched: demosOut.length,
    changes,
    demos: demosOut,
  };
}
