import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { prisma } from "@/lib/prisma";
import { MessagerieHub } from "@/components/messagerie/MessagerieHub";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";
import type { MessagingPartyType } from "@/lib/messagerie/party-type";
import { resolveMessagingPartyType } from "@/lib/messagerie/party-type";
import {
  DEMO_STAFF_CONTACTS,
  isDemoStaffHiddenFromMessaging,
} from "@/lib/demo-environment/demo-staff-names";

export type MessagerieRecipient = {
  id: string;
  name: string;
  /** Legacy UI string — conservé pour compat, préférer partyType */
  role: string;
  personType: string | null;
  permissionProfile: string | null;
  company: string | null;
  partyType: MessagingPartyType;
  shortLabel: string;
};

function toRecipient(u: {
  id: string;
  name: string;
  email?: string | null;
  role: string;
  personType: string | null;
  permissionProfile: string | null;
  company: string | null;
  externalOrganization?: { type: string; name: string; tradeName: string | null } | null;
}): MessagerieRecipient {
  const party = resolveMessagingPartyType({
    personType: u.personType,
    permissionProfile: u.permissionProfile,
    externalOrgType: u.externalOrganization?.type ?? null,
    legacyRole: u.role,
  });
  const company =
    u.company?.trim() ||
    u.externalOrganization?.tradeName?.trim() ||
    u.externalOrganization?.name?.trim() ||
    null;
  return {
    id: u.id,
    name: u.name,
    role:
      party.partyType === "INTERNAL"
        ? "interne"
        : party.partyType === "CLIENT"
          ? "client"
          : party.partyType === "SUPPLIER"
            ? "fournisseur"
            : "externe",
    personType: u.personType,
    permissionProfile: u.permissionProfile,
    company,
    partyType: party.partyType,
    shortLabel: party.shortLabel,
  };
}

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  personType: true,
  permissionProfile: true,
  company: true,
  externalOrganization: { select: { type: true, name: true, tradeName: true } },
} as const;

export default async function MessageriePage() {
  const session = await getCachedServerSession();

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const isManager = session.user.role === "MANAGER";
  const isAgent = session.user.role === "AGENT" || session.user.role === "AGENCE";
  const isClient = session.user.role === "CLIENT";

  let agents: { id: string; name: string; role?: string }[] = [];
  let recipients: MessagerieRecipient[] = [];
  let managerId: string | null = null;
  let personType: string | null = null;

  try {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        personType: true,
        permissionProfile: true,
        email: true,
        organizationMemberships: { select: { organizationId: true }, take: 1 },
      },
    });
    personType = me?.personType ?? session.user.personType ?? null;
    const orgId = me?.organizationMemberships[0]?.organizationId ?? null;
    const isDemoSession =
      Boolean(session.user.isDemo) || Boolean(me?.email?.endsWith("@demo.bework.local"));
    const meInternal =
      personType === "INTERNAL" ||
      ["DIRECTION", "CONDUCTEUR", "ADMINISTRATIF", "CHEF_CHANTIER"].includes(
        me?.permissionProfile ?? "",
      );

    if (isManager || isAgent || (isClient && meInternal)) {
      // Pair internes + externes liés à l’organisation (personas démo incluses).
      if (orgId) {
        const members = await prisma.organizationMember.findMany({
          where: { organizationId: orgId },
          select: { user: { select: USER_SELECT } },
        });
        const byId = new Map<string, MessagerieRecipient>();
        for (const m of members) {
          if (!m.user || m.user.id === session.user.id) continue;
          // Laura Bernard (legacy) masquée — Lefèvre / Adjaili OK si présents.
          if (isDemoSession && isDemoStaffHiddenFromMessaging(m.user.email)) continue;
          byId.set(m.user.id, toRecipient(m.user));
        }

        // Externes Point.P / ABC Promotion via ProjectAccess sur chantiers de l’org
        const externals = await prisma.user.findMany({
          where: {
            personType: { in: ["CLIENT_EXT", "SUPPLIER", "SUBCONTRACTOR"] },
            OR: [
              { externalOrganization: { hostOrganizationId: orgId } },
              {
                projectAccesses: {
                  some: { project: { organizationId: orgId } },
                },
              },
            ],
          },
          select: USER_SELECT,
          take: 80,
        });
        for (const u of externals) {
          if (u.id === session.user.id) continue;
          byId.set(u.id, toRecipient(u));
        }

        // Staff démo visibles (Sophie Lefèvre, Karim Adjaili) — hors org, pour Contacts.
        if (isDemoSession) {
          const visibleStaffEmails = DEMO_STAFF_CONTACTS.filter((c) => c.showInDemoMessaging).map(
            (c) => c.email,
          );
          if (visibleStaffEmails.length > 0) {
            const staffUsers = await prisma.user.findMany({
              where: { email: { in: visibleStaffEmails } },
              select: USER_SELECT,
            });
            for (const u of staffUsers) {
              if (u.id === session.user.id) continue;
              byId.set(u.id, toRecipient(u));
            }
          }
        }

        recipients = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
        agents = recipients
          .filter((r) => r.partyType === "INTERNAL")
          .map((r) => ({ id: r.id, name: r.name, role: r.role }));
        managerId =
          recipients.find((r) => r.permissionProfile === "DIRECTION")?.id ??
          (
            await prisma.user.findFirst({
              where: { role: "MANAGER" },
              select: { id: true },
            })
          )?.id ??
          null;
      } else if (isManager || isAgent) {
        const [agentsRes, managersRes, clients, managerFirst] = await Promise.all([
          prisma.user.findMany({
            where: { role: { in: ["AGENCE", "AGENT"] } },
            select: USER_SELECT,
            orderBy: { name: "asc" },
          }),
          prisma.user.findMany({
            where: { role: "MANAGER" },
            select: USER_SELECT,
            orderBy: { name: "asc" },
          }),
          prisma.user.findMany({
            where: {
              OR: [
                { personType: "CLIENT_EXT" },
                { personType: "SUPPLIER" },
                {
                  role: "CLIENT",
                  personType: { not: "INTERNAL" },
                },
              ],
            },
            select: USER_SELECT,
            take: 80,
            orderBy: { name: "asc" },
          }),
          prisma.user.findFirst({
            where: { role: "MANAGER" },
            select: { id: true },
          }),
        ]);
        agents = agentsRes.map((a) => ({ id: a.id, name: a.name }));
        managerId = managerFirst?.id ?? null;
        const map = new Map<string, MessagerieRecipient>();
        for (const u of [...agentsRes, ...managersRes, ...clients]) {
          if (u.id === session.user.id) continue;
          map.set(u.id, toRecipient(u));
        }
        recipients = [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
      }
    } else if (isClient) {
      const [assignedAgents, managers] = await Promise.all([
        prisma.user.findMany({
          where: {
            role: { in: ["AGENCE", "AGENT"] },
            tasksAssigned: { some: { clientId: session.user.id } },
          },
          select: USER_SELECT,
          orderBy: { name: "asc" },
        }),
        prisma.user.findMany({
          where: { role: "MANAGER" },
          select: USER_SELECT,
          orderBy: { name: "asc" },
          take: 20,
        }),
      ]);
      agents = assignedAgents.map((a) => ({ id: a.id, name: a.name }));
      managerId = managers[0]?.id ?? null;
      recipients = [...assignedAgents, ...managers]
        .filter((u) => u.id !== session.user.id)
        .map(toRecipient);

      if (recipients.length === 0) {
        const anyStaff = await prisma.user.findMany({
          where: { role: { in: ["AGENCE", "AGENT", "MANAGER"] } },
          select: USER_SELECT,
          take: 15,
          orderBy: { name: "asc" },
        });
        recipients = anyStaff.filter((u) => u.id !== session.user.id).map(toRecipient);
        agents = anyStaff
          .filter((u) => u.role !== "MANAGER")
          .map((u) => ({ id: u.id, name: u.name }));
        managerId = anyStaff.find((u) => u.role === "MANAGER")?.id ?? null;
      }
    }
  } catch {
    // ignore
  }

  const canChangeStatus = isManager || isAgent;
  const external = isExternalPortalUser(personType);

  return (
    <div className="-mx-3 -mb-6 -mt-2 flex h-[calc(100dvh-11rem)] min-h-[420px] min-w-0 flex-col overflow-hidden bg-[#111b21] sm:-mx-5 sm:-mb-8 sm:h-[calc(100dvh-12rem)]">
      <Suspense fallback={<p className="p-4 text-sm text-slate-300">Chargement messagerie…</p>}>
        <MessagerieHub
          sessionUserId={session.user.id}
          isAgence={isManager}
          isAgent={isAgent}
          isClient={isClient}
          canChangeStatus={canChangeStatus}
          agents={agents}
          recipients={recipients}
          managerId={managerId}
          preferChantiers={external}
          hideNewDemande={external}
        />
      </Suspense>
    </div>
  );
}
