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
import { DEMO_PERSONAS } from "@/lib/demo-environment/personas";
import {
  evaluateDirectMessageAcl,
  isMessagingAccessActive,
  type DirectAclUser,
} from "@/lib/messaging/direct-acl";
import { withPerfLog, timedBranch, runWithPerfContext } from "@/lib/perf/server-timing";

function sortMessagerieRecipients(list: MessagerieRecipient[]): MessagerieRecipient[] {
  const priority = new Map<string, number>([
    [DEMO_PERSONAS.administratif.name, 0],
    [DEMO_PERSONAS.conducteur.name, 1],
  ]);
  return [...list].sort((a, b) => {
    const pa = priority.has(a.name) ? (priority.get(a.name) as number) : a.partyType === "INTERNAL" ? 10 : 20;
    const pb = priority.has(b.name) ? (priority.get(b.name) as number) : b.partyType === "INTERNAL" ? 10 : 20;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name, "fr");
  });
}

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
  accessStatus?: string | null;
  organizationMemberships?: { organizationId: string }[];
  externalOrganization?: {
    type: string;
    name: string;
    tradeName: string | null;
    hostOrganizationId?: string | null;
  } | null;
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

function toAclUser(u: {
  id: string;
  role: string;
  personType: string | null;
  permissionProfile: string | null;
  accessStatus?: string | null;
  email?: string | null;
  organizationMemberships?: { organizationId: string }[];
  externalOrganization?: { hostOrganizationId?: string | null } | null;
}): DirectAclUser {
  return {
    id: u.id,
    role: u.role,
    personType: u.personType,
    permissionProfile: u.permissionProfile,
    accessStatus: u.accessStatus ?? null,
    email: u.email ?? null,
    organizationIds: (u.organizationMemberships ?? []).map((m) => m.organizationId),
    externalHostOrganizationId: u.externalOrganization?.hostOrganizationId ?? null,
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
  accessStatus: true,
  organizationMemberships: { select: { organizationId: true } },
  externalOrganization: {
    select: { type: true, name: true, tradeName: true, hostOrganizationId: true },
  },
} as const;

function keepIfMessageable(
  sender: DirectAclUser,
  raw: Parameters<typeof toRecipient>[0],
): MessagerieRecipient | null {
  if (!isMessagingAccessActive(raw.accessStatus)) return null;
  const acl = evaluateDirectMessageAcl(sender, toAclUser(raw), { taskLinked: false });
  if (!acl.ok) return null;
  return toRecipient(raw);
}

export default async function MessageriePage() {
  return runWithPerfContext(() =>
    withPerfLog("messagerie.page", async () => {
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
        id: true,
        role: true,
        personType: true,
        permissionProfile: true,
        accessStatus: true,
        email: true,
        organizationMemberships: { select: { organizationId: true } },
        externalOrganization: { select: { hostOrganizationId: true } },
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
    const senderAcl: DirectAclUser | null = me
      ? toAclUser({
          ...me,
          role: me.role ?? session.user.role ?? "CLIENT",
        })
      : null;

    if (isManager || isAgent || (isClient && meInternal)) {
      // Pair internes + externes liés à l’organisation (personas démo incluses).
      if (orgId && senderAcl) {
        const [members, externals] = await Promise.all([
          timedBranch(
            "messagerie.orgMembers",
            prisma.organizationMember.findMany({
              where: { organizationId: orgId },
              select: { user: { select: USER_SELECT } },
            }),
          ),
          timedBranch(
            "messagerie.externals",
            prisma.user.findMany({
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
            }),
          ),
        ]);
        const byId = new Map<string, MessagerieRecipient>();
        for (const m of members) {
          if (!m.user || m.user.id === session.user.id) continue;
          if (isDemoSession && isDemoStaffHiddenFromMessaging(m.user.email)) continue;
          const rec = keepIfMessageable(senderAcl, m.user);
          if (rec) byId.set(rec.id, rec);
        }

        for (const u of externals) {
          if (u.id === session.user.id) continue;
          const rec = keepIfMessageable(senderAcl, u);
          if (rec) byId.set(rec.id, rec);
        }

        // Staff démo optionnels (showInDemoMessaging) — hors org, filtrés par ACL.
        if (isDemoSession) {
          const visibleStaffEmails = DEMO_STAFF_CONTACTS.filter((c) => c.showInDemoMessaging).map(
            (c) => c.email,
          );
          if (visibleStaffEmails.length > 0) {
            const staffUsers = await timedBranch(
              "messagerie.demoStaff",
              prisma.user.findMany({
                where: { email: { in: visibleStaffEmails } },
                select: USER_SELECT,
              }),
            );
            for (const u of staffUsers) {
              if (u.id === session.user.id) continue;
              if (isDemoStaffHiddenFromMessaging(u.email)) continue;
              const rec = keepIfMessageable(senderAcl, u);
              if (rec) byId.set(rec.id, rec);
            }
          }
        }

        recipients = sortMessagerieRecipients([...byId.values()]);
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
          // Isolation : BeWork interne ne liste pas les comptes démo client
          if (u.email?.endsWith("@demo.bework.local")) continue;
          map.set(u.id, toRecipient(u));
        }
        recipients = sortMessagerieRecipients([...map.values()]);
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
    <div className="flex h-[calc(100dvh-3.5rem-3.75rem-env(safe-area-inset-bottom))] min-h-[420px] min-w-0 flex-col overflow-hidden bg-white lg:h-[calc(100dvh-4rem)]">
      <Suspense
        fallback={
          <div className="flex flex-1 flex-col gap-2 p-4" aria-hidden>
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
          </div>
        }
      >
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
    }),
  );
}
