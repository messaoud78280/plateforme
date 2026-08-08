import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isUserInTenant,
  mapProfileToLegacyTeamRole,
  mapProfileToOrgRole,
  requireEquipeAdmin,
} from "@/lib/equipe-acces/admin";
import { logAccessAction } from "@/lib/equipe-acces/audit";
import { setUserProjectAccesses } from "@/lib/equipe-acces/project-access";
import {
  ACCESS_STATUSES,
  PERMISSION_PROFILES,
  PERSON_TYPES,
  type AccessStatus,
  type PermissionProfileKey,
  type PersonType,
} from "@/lib/equipe-acces/types";

type Ctx = { params: Promise<{ userId: string }> };

/** PATCH /api/equipe/[userId] — statut, profil, périmètre. */
export async function PATCH(request: Request, context: Ctx) {
  const gate = await requireEquipeAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { userId } = await context.params;
  if (!(await isUserInTenant(gate.ctx, userId))) {
    return NextResponse.json({ error: "Utilisateur hors périmètre" }, { status: 404 });
  }

  try {
    const body = await request.json();

    if (userId === gate.ctx.ownerUserId) {
      if (body.accessStatus && body.accessStatus !== "ACTIVE") {
        return NextResponse.json(
          { error: "Impossible de suspendre ou désactiver le propriétaire du compte." },
          { status: 400 }
        );
      }
    }

    const data: {
      accessStatus?: string;
      permissionProfile?: string;
      personType?: string;
      jobTitle?: string | null;
      phone?: string | null;
      company?: string | null;
      teamRole?: string;
    } = {};

    if (typeof body.accessStatus === "string" && ACCESS_STATUSES.includes(body.accessStatus as AccessStatus)) {
      data.accessStatus = body.accessStatus;
    }
    if (
      typeof body.permissionProfile === "string" &&
      PERMISSION_PROFILES.includes(body.permissionProfile as PermissionProfileKey)
    ) {
      data.permissionProfile = body.permissionProfile;
      data.teamRole = mapProfileToLegacyTeamRole(body.permissionProfile);
    }
    if (typeof body.personType === "string" && PERSON_TYPES.includes(body.personType as PersonType)) {
      data.personType = body.personType;
    }
    if (body.jobTitle !== undefined) {
      data.jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() || null : null;
    }
    if (body.phone !== undefined) {
      data.phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
    }
    if (body.companyName !== undefined) {
      data.company = typeof body.companyName === "string" ? body.companyName.trim() || null : null;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        accessStatus: true,
        permissionProfile: true,
        personType: true,
        jobTitle: true,
        phone: true,
        company: true,
      },
    });

    if (data.permissionProfile || data.personType) {
      const orgRole = mapProfileToOrgRole(updated.permissionProfile, updated.personType);
      await prisma.organizationMember
        .updateMany({
          where: {
            organizationId: gate.ctx.organizationId,
            userId,
          },
          data: { role: orgRole },
        })
        .catch(() => undefined);
    }

    if (Array.isArray(body.projectIds)) {
      const projectIds = body.projectIds.filter((x: unknown) => typeof x === "string");
      await setUserProjectAccesses({
        userId,
        projectIds,
        grantedById: gate.ctx.actorId,
        permissionProfile: updated.permissionProfile,
        organizationId: gate.ctx.organizationId,
      });
    }

    await logAccessAction({
      organizationId: gate.ctx.organizationId,
      actorUserId: gate.ctx.actorId,
      targetUserId: userId,
      action: "USER_UPDATED",
      detail: JSON.stringify({
        accessStatus: body.accessStatus,
        permissionProfile: body.permissionProfile,
        personType: body.personType,
        projectIds: body.projectIds,
      }),
    });

    return NextResponse.json({ user: updated });
  } catch (e) {
    console.error("PATCH /api/equipe/[userId]", e);
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }
}
