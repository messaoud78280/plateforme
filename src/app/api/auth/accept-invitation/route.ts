import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addMemberToOwnerOrganization, ensureOrganizationForOwner } from "@/lib/organization/access";
import { mapProfileToOrgRole } from "@/lib/equipe-acces/admin";
import { setUserProjectAccesses } from "@/lib/equipe-acces/project-access";
import { logAccessAction } from "@/lib/equipe-acces/audit";
import { defaultProfileForPersonType, type PersonType } from "@/lib/equipe-acces/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, name, password } = body;
    if (!token || !name?.trim() || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Token, nom et mot de passe (8 caractères min.) requis." },
        { status: 400 },
      );
    }
    const inv = await prisma.invitation.findUnique({
      where: { token },
    });
    if (!inv || inv.status !== "PENDING" || inv.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation expirée ou déjà utilisée." },
        { status: 400 },
      );
    }
    const existing = await prisma.user.findUnique({
      where: { email: inv.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 400 },
      );
    }

    const personType = (inv.personType as PersonType | null) ?? "INTERNAL";
    const permissionProfile =
      inv.permissionProfile ?? defaultProfileForPersonType(personType);
    const displayName =
      name.trim() ||
      [inv.firstName, inv.lastName].filter(Boolean).join(" ") ||
      inv.email.split("@")[0];

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: inv.email,
        password: hashedPassword,
        name: displayName,
        role: UserRole.CLIENT,
        company: inv.companyName,
        phone: inv.phone,
        jobTitle: inv.jobTitle,
        invitedById: inv.invitedById,
        teamRole: inv.role,
        personType,
        permissionProfile,
        accessStatus: "ACTIVE",
        mustChangePassword: false,
        externalOrganizationId: inv.externalOrganizationId,
        subscriptionPlan: null,
        monthlyActionsTotal: 0,
        monthlyActionsUsed: 0,
      },
    });

    await prisma.invitation.update({
      where: { id: inv.id },
      data: { status: "ACCEPTED" },
    });

    try {
      const organizationId =
        inv.organizationId ?? (await ensureOrganizationForOwner(inv.invitedById));
      const orgRole = mapProfileToOrgRole(permissionProfile, personType);

      if (organizationId) {
        await prisma.organizationMember.upsert({
          where: {
            organizationId_userId: { organizationId, userId: user.id },
          },
          create: {
            organizationId,
            userId: user.id,
            role: orgRole,
            status: "ACTIVE",
          },
          update: { role: orgRole, status: "ACTIVE" },
        });
      } else {
        await addMemberToOwnerOrganization(inv.invitedById, user.id, inv.role);
      }

      const resolvedOrgId =
        organizationId ?? (await ensureOrganizationForOwner(inv.invitedById));
      if (resolvedOrgId) {
        const projectIds = Array.isArray(inv.projectIdsJson)
          ? (inv.projectIdsJson as unknown[]).filter((x): x is string => typeof x === "string")
          : [];
        if (personType !== "INTERNAL" || projectIds.length > 0) {
          await setUserProjectAccesses({
            userId: user.id,
            projectIds,
            grantedById: inv.invitedById,
            permissionProfile,
            organizationId: resolvedOrgId,
          });
        }

        await logAccessAction({
          organizationId: resolvedOrgId,
          actorUserId: user.id,
          targetUserId: user.id,
          action: "INVITE_ACCEPTED",
          detail: JSON.stringify({ invitationId: inv.id, personType }),
        });
      }
    } catch (e) {
      console.error("Organization member after invite:", e);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Accept invitation:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
