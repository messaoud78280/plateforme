/**
 * Provisionne / met à jour le propriétaire permanent URBAN AMÉNAGEMENTS.
 *
 * Usage (mot de passe UNIQUEMENT en argument CLI — jamais commit) :
 *   npx tsx scripts/provision-urban-owner.ts --email=... --password='...'
 *
 * Options :
 *   --email=messaoud.djebaili@gmail.com
 *   --password=...   (min 10 car.)
 *   --name="Mashoud DJEBAILI"
 *   --org-name="URBAN AMÉNAGEMENTS"
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { getScriptDatabaseUrl, loadScriptEnv } from "./load-script-env";

loadScriptEnv();
const connectionUrl = getScriptDatabaseUrl();
if (!connectionUrl) {
  console.error("❌ DATABASE_URL manquant");
  process.exit(1);
}

const prisma = new PrismaClient({ datasourceUrl: connectionUrl });

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

const email = (arg("email") ?? "messaoud.djebaili@gmail.com").trim().toLowerCase();
const password = arg("password")?.trim();
const displayName = (arg("name") ?? "Mashoud DJEBAILI").trim();
const orgName = (arg("org-name") ?? "URBAN AMÉNAGEMENTS").trim();

if (!password || password.length < 10) {
  console.error("❌ --password requis (min. 10 caractères). Ne jamais committer le mot de passe.");
  process.exit(1);
}

async function main() {
  const hash = await bcrypt.hash(password, 12);
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email },
      select: { id: true },
    });

    const user = existingUser
      ? await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name: displayName,
            password: hash,
            role: "CLIENT",
            company: orgName,
            accountStatus: "APPROVED",
            accessStatus: "ACTIVE",
            contractStatus: "SIGNED",
            personType: "INTERNAL",
            permissionProfile: "DIRECTION",
            teamRole: "ADMIN",
            mustChangePassword: false,
          },
        })
      : await tx.user.create({
          data: {
            email,
            name: displayName,
            password: hash,
            role: "CLIENT",
            company: orgName,
            accountStatus: "APPROVED",
            accessStatus: "ACTIVE",
            contractStatus: "SIGNED",
            personType: "INTERNAL",
            permissionProfile: "DIRECTION",
            teamRole: "ADMIN",
            mustChangePassword: false,
          },
        });

    let org = await tx.organization.findFirst({
      where: {
        OR: [
          { ownerUserId: user.id },
          { name: { equals: orgName, mode: "insensitive" } },
          { name: { contains: "urban", mode: "insensitive" } },
        ],
      },
    });

    if (org) {
      org = await tx.organization.update({
        where: { id: org.id },
        data: {
          name: orgName,
          ownerUserId: user.id,
          kind: "STANDARD",
          saasStatus: "ACTIVE",
          trialStartedAt: null,
          trialEndsAt: null,
          onboardingCompletedAt: now,
          onboardingStep: 100,
        },
      });
    } else {
      org = await tx.organization.create({
        data: {
          name: orgName,
          ownerUserId: user.id,
          kind: "STANDARD",
          saasStatus: "ACTIVE",
          trialStartedAt: null,
          trialEndsAt: null,
          onboardingCompletedAt: now,
          onboardingStep: 100,
        },
      });
    }

    await tx.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: user.id,
        },
      },
      create: {
        organizationId: org.id,
        userId: user.id,
        role: "OWNER",
        status: "ACTIVE",
      },
      update: {
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    return { user, org };
  });

  console.log("OK — espace propriétaire permanent");
  console.log("  email:", result.user.email);
  console.log("  userId:", result.user.id);
  console.log("  org:", result.org.name);
  console.log("  orgId:", result.org.id);
  console.log("  saasStatus:", result.org.saasStatus);
  console.log("  member:", "OWNER");
  console.log("  login:", "https://www.bework.fr/connexion/clients");
  console.log("  (mot de passe non affiché — celui passé en --password)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
