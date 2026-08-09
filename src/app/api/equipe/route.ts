import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEquipeAdmin } from "@/lib/equipe-acces/admin";
import { addEquipeMember, type AddMemberInput } from "@/lib/equipe-acces/create-member";
import {
  PERSON_TYPES,
  PERMISSION_PROFILES,
  type PersonType,
  type PermissionProfileKey,
} from "@/lib/equipe-acces/types";

/** GET /api/equipe — membres + invitations + chantiers (formulaire). */
export async function GET() {
  const gate = await requireEquipeAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { ctx } = gate;

  try {
    const [members, invitations, projects] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { id: ctx.ownerUserId },
            { invitedById: ctx.ownerUserId },
            {
              organizationMemberships: {
                some: { organizationId: ctx.organizationId },
              },
            },
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          company: true,
          jobTitle: true,
          personType: true,
          permissionProfile: true,
          accessStatus: true,
          teamRole: true,
          lastLoginAt: true,
          mustChangePassword: true,
          createdAt: true,
          invitedById: true,
          externalOrganization: { select: { id: true, name: true, type: true } },
          projectAccesses: {
            select: {
              projectId: true,
              project: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.invitation.findMany({
        where: { invitedById: ctx.ownerUserId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { clientId: ctx.ownerUserId },
            { organizationId: ctx.organizationId },
          ],
        },
        select: { id: true, title: true, siteCity: true },
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
    ]);

    return NextResponse.json({
      members: members.map((m) => {
        const pt = m.personType ?? "INTERNAL";
        const projects = m.projectAccesses.map((pa) => pa.project);
        const allChantiers =
          pt === "INTERNAL" && projects.length === 0;
        return {
          ...m,
          isOwner: m.id === ctx.ownerUserId,
          projects,
          allChantiers,
          accessLabel: allChantiers
            ? "Tous les chantiers"
            : projects.length === 0
              ? "Aucun chantier"
              : projects.length === 1
                ? projects[0].title
                : `${projects.length} chantiers`,
        };
      }),
      invitations,
      projects,
      organizationId: ctx.organizationId,
    });
  } catch (e) {
    console.error("GET /api/equipe", e);
    return NextResponse.json({ error: "Erreur chargement équipe" }, { status: 500 });
  }
}

/** POST /api/equipe — inviter ou créer un utilisateur. */
export async function POST(request: Request) {
  const gate = await requireEquipeAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const body = await request.json();
    const personType = body.personType as PersonType;
    if (!PERSON_TYPES.includes(personType)) {
      return NextResponse.json({ error: "Type d’utilisateur requis" }, { status: 400 });
    }
    let permissionProfile = body.permissionProfile as PermissionProfileKey | undefined;
    if (permissionProfile && !PERMISSION_PROFILES.includes(permissionProfile)) {
      permissionProfile = undefined;
    }
    const mode = body.mode === "create" ? "create" : "invite";
    const projectIds = Array.isArray(body.projectIds)
      ? body.projectIds.filter((x: unknown) => typeof x === "string")
      : [];

    const input: AddMemberInput = {
      email: typeof body.email === "string" ? body.email : "",
      firstName: typeof body.firstName === "string" ? body.firstName : undefined,
      lastName: typeof body.lastName === "string" ? body.lastName : undefined,
      name: typeof body.name === "string" ? body.name : undefined,
      companyName: typeof body.companyName === "string" ? body.companyName : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      jobTitle: typeof body.jobTitle === "string" ? body.jobTitle : undefined,
      personType,
      permissionProfile,
      projectIds,
      mode,
    };

    if (personType !== "INTERNAL" && projectIds.length === 0 && mode === "create") {
      return NextResponse.json(
        {
          error:
            "Pour un partenaire externe, sélectionnez au moins un chantier partagé (évite une fuite multi-chantiers).",
        },
        { status: 400 }
      );
    }

    const result = await addEquipeMember(gate.ctx, input);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    if (result.kind === "invite") {
      return NextResponse.json({
        kind: "invite",
        id: result.invitationId,
        email: result.email,
        acceptUrl: result.acceptUrl,
        expiresAt: result.expiresAt,
        emailSent: Boolean(result.emailSent),
      });
    }
    return NextResponse.json({
      kind: "create",
      userId: result.userId,
      email: result.email,
      temporaryPassword: result.temporaryPassword,
      message:
        "Compte créé. Copiez le mot de passe temporaire maintenant — il ne sera plus réaffiché.",
    });
  } catch (e) {
    console.error("POST /api/equipe", e);
    return NextResponse.json({ error: "Erreur lors de l’ajout" }, { status: 500 });
  }
}
