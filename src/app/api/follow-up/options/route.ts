import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isBeworkStaff } from "@/lib/authz";
import { resolveFollowUpOwnerUserId, followUpSheetAccessWhere } from "@/lib/follow-up/access";
import { prisma } from "@/lib/prisma";

/** GET /api/follow-up/options — équipe + fiches pour liaisons agenda / assignation */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const ownerUserId = await resolveFollowUpOwnerUserId(session.user.id);
  const staff = isBeworkStaff(session.user);
  const accessWhere = await followUpSheetAccessWhere(session.user);

  const [teamUsers, sheets] = await Promise.all([
    staff
      ? prisma.user.findMany({
          where: { role: { in: ["CLIENT", "AGENT", "MANAGER", "AGENCE"] } },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
          take: 200,
        })
      : (async () => {
          const org = await prisma.organization.findUnique({
            where: { ownerUserId },
            select: {
              members: {
                select: { user: { select: { id: true, name: true, email: true } } },
              },
            },
          });
          const map = new Map<string, { id: string; name: string; email: string }>();
          for (const m of org?.members ?? []) {
            map.set(m.user.id, {
              id: m.user.id,
              name: m.user.name ?? "",
              email: m.user.email,
            });
          }
          const invited = await prisma.user.findMany({
            where: { OR: [{ id: ownerUserId }, { invitedById: ownerUserId }] },
            select: { id: true, name: true, email: true },
          });
          for (const u of invited) {
            map.set(u.id, { id: u.id, name: u.name ?? "", email: u.email });
          }
          return Array.from(map.values()).sort((a, b) =>
            (a.name || a.email).localeCompare(b.name || b.email, "fr"),
          );
        })(),
    prisma.followUpSheet.findMany({
      where: { AND: [accessWhere, { status: { not: "ARCHIVE" } }] },
      select: {
        id: true,
        title: true,
        osNumber: true,
        orderNumber: true,
        status: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
  ]);

  return NextResponse.json({
    teamUsers: teamUsers.map((u) => ({
      id: u.id,
      name: u.name || u.email,
      email: u.email,
    })),
    sheets: sheets.map((s) => ({
      id: s.id,
      label: `${s.title}${s.osNumber ? ` · OS ${s.osNumber}` : s.orderNumber ? ` · ${s.orderNumber}` : ""}`,
      status: s.status,
    })),
  });
}
