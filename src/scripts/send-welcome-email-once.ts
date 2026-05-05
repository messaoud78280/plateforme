/**
 * Usage : npx tsx src/scripts/send-welcome-email-once.ts <email> [prénom]
 * Envoie le mail de bienvenue + lien « Accéder à mon espace » (magic link NextAuth).
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

const email = (process.argv[2] ?? "hanadjebaili14@gmail.com").trim().toLowerCase();
const name = process.argv[3]?.trim() || "Hana";

async function main() {
  const { sendWelcomeEmail } = await import("@/lib/email");
  const { prisma } = await import("@/lib/prisma");
  const { canonicalRequestOrigin } = await import("@/lib/site");

  const origin = canonicalRequestOrigin();

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      console.error(
        `Aucun compte pour ${email}. Inscris-toi d’abord sur la plateforme (le magic link nécessite un utilisateur existant).`
      );
      process.exit(1);
    }
    await sendWelcomeEmail({ email, name }, { baseUrl: origin });
    console.log("Mail envoyé.", { to: email, origin });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
