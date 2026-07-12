/**
 * Script one-shot : backfill organisations (exécuté après migration SQL).
 * Usage : npx tsx prisma/backfill-organizations.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureOwner(ownerUserId: string, name: string, company: string | null) {
  const existing = await prisma.organization.findUnique({ where: { ownerUserId } });
  if (existing) {
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: existing.id, userId: ownerUserId } },
      create: { organizationId: existing.id, userId: ownerUserId, role: "OWNER" },
      update: { role: "OWNER" },
    });
    return existing.id;
  }
  const org = await prisma.organization.create({
    data: {
      name: company?.trim() || name || "Entreprise",
      ownerUserId,
      members: { create: { userId: ownerUserId, role: "OWNER" } },
    },
  });
  return org.id;
}

function mapRole(teamRole: string | null): "ADMIN" | "MEMBER" | "VIEWER" {
  const r = (teamRole ?? "USER").toUpperCase();
  if (r === "ADMIN" || r === "SUPERVISEUR") return "ADMIN";
  if (r === "VIEWER") return "VIEWER";
  return "MEMBER";
}

async function main() {
  const owners = await prisma.user.findMany({
    where: { role: "CLIENT", invitedById: null },
    select: { id: true, name: true, company: true },
  });
  let orgs = 0;
  for (const o of owners) {
    await ensureOwner(o.id, o.name, o.company);
    orgs += 1;
  }

  const invited = await prisma.user.findMany({
    where: { role: "CLIENT", invitedById: { not: null } },
    select: { id: true, invitedById: true, teamRole: true },
  });
  let members = 0;
  for (const u of invited) {
    if (!u.invitedById) continue;
    const org = await prisma.organization.findUnique({ where: { ownerUserId: u.invitedById } });
    if (!org) continue;
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: u.id } },
      create: { organizationId: org.id, userId: u.id, role: mapRole(u.teamRole) },
      update: { role: mapRole(u.teamRole) },
    });
    members += 1;
  }

  const allOrgs = await prisma.organization.findMany({ select: { id: true, ownerUserId: true } });
  let projects = 0;
  let tasks = 0;
  for (const org of allOrgs) {
    projects += (
      await prisma.project.updateMany({
        where: { clientId: org.ownerUserId, organizationId: null },
        data: { organizationId: org.id },
      })
    ).count;
    tasks += (
      await prisma.task.updateMany({
        where: { clientId: org.ownerUserId, organizationId: null },
        data: { organizationId: org.id },
      })
    ).count;
  }

  console.log(JSON.stringify({ orgs, members, projects, tasks }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
