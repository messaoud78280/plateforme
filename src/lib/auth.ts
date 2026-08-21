import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import bcrypt from "bcryptjs";
import { ClientAccountStatus, UserRole } from "@prisma/client";
import { prismaAdapterCaseInsensitiveEmail } from "./auth-adapter";
import { prisma } from "./prisma";
import { sendEmail } from "@/lib/email";
import { isClientLoginAllowed } from "@/lib/client-account-approval";
import { gateAllows, parseTeamLoginGate } from "@/lib/auth-team-login";
import { canonicalRequestOrigin } from "@/lib/site";
import { resolveDemoAccessForUser } from "@/lib/demo-environment/access";
import { isDemoEmail, toDemoEmail } from "@/lib/demo-environment/constants";
import { isPlatformAdminRole } from "@/lib/platform-admin/authz";

function resolveCredentialsEmail(raw: string, gate: string | null): string {
  const trimmed = raw.trim().toLowerCase();
  if (gate === "demo" && !trimmed.includes("@")) {
    return toDemoEmail(trimmed);
  }
  return trimmed;
}

export const authOptions: NextAuthOptions = {
  adapter: prismaAdapterCaseInsensitiveEmail(prisma),
  providers: [
    EmailProvider({
      maxAge: 24 * 60 * 60,
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url }) {
        const emailNorm = identifier.trim().toLowerCase();
        if (isDemoEmail(emailNorm)) {
          throw new Error("Connexion magique indisponible pour les comptes de démonstration");
        }
        const existing = await prisma.user.findFirst({
          where: { email: { equals: emailNorm, mode: "insensitive" } },
          select: { role: true, accountStatus: true },
        });
        if (
          existing?.role === UserRole.CLIENT &&
          !isClientLoginAllowed(existing.accountStatus)
        ) {
          throw new Error("Compte client non validé");
        }

        const subject = "Connexion BeWork — lien de connexion";
        const safeUrl = String(url);
        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Connexion BeWork</title></head>
<body style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.55; color: #0f172a; padding: 24px;">
  <h1 style="margin:0 0 12px 0; font-size:20px;">Connexion à BeWork</h1>
  <p style="margin:0 0 16px 0; color:#334155; font-size:14px;">
    Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien expire dans 24 heures.
  </p>
  <p style="margin:18px 0;">
    <a href="${safeUrl}" style="display:inline-block; background:#1d4ed8; color:#fff; text-decoration:none; padding:10px 14px; border-radius:10px; font-weight:700;">
      Se connecter
    </a>
  </p>
  <p style="margin:18px 0 0 0; font-size:12px; color:#64748b;">
    Si le bouton ne fonctionne pas, copiez-collez ce lien :
    <br>
    <a href="${safeUrl}" style="color:#1d4ed8;">${safeUrl}</a>
  </p>
</body>
</html>
        `.trim();

        const r = await sendEmail({ to: identifier, subject, html });
        if (!r.ok) {
          console.error("[Auth] sendVerificationRequest failed:", r);
        }
      },
    }),
    CredentialsProvider({
      name: "Identifiants",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        gate: { label: "Portail", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const gate = parseTeamLoginGate(credentials.gate);
          const email = resolveCredentialsEmail(credentials.email, gate);
          const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
          });

          if (!user?.password) return null;
          if (!(await bcrypt.compare(credentials.password, user.password))) {
            return null;
          }

          const accessStatus = (user as { accessStatus?: string }).accessStatus;
          if (accessStatus === "SUSPENDED" || accessStatus === "DISABLED") {
            return null;
          }

          const platformRole =
            (user as { platformRole?: string | null }).platformRole ?? null;

          if (gate === "demo") {
            const access = await resolveDemoAccessForUser(user.id);
            if (!access.ok) return null;
          } else if (isDemoEmail(user.email)) {
            // Les comptes démo ne passent que par le portail démo
            return null;
          }

          prisma.user
            .update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            })
            .catch(() => undefined);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            contractStatus: user.contractStatus,
            accountStatus: user.accountStatus,
            personType: (user as { personType?: string | null }).personType ?? null,
            permissionProfile:
              (user as { permissionProfile?: string | null }).permissionProfile ?? null,
            mustChangePassword: Boolean(
              (user as { mustChangePassword?: boolean }).mustChangePassword
            ),
            platformRole,
          };
        } catch (err) {
          console.error("[Auth] Erreur base de données:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, credentials }) {
      const role = (user as { role?: string }).role;
      const email = (user as { email?: string }).email;
      const gate = parseTeamLoginGate(credentials?.gate);
      const userId = (user as { id?: string }).id;

      let platformRole =
        (user as { platformRole?: string | null }).platformRole ?? null;
      if (userId && platformRole === null) {
        const pr = await prisma.user.findUnique({
          where: { id: userId },
          select: { platformRole: true },
        });
        platformRole = pr?.platformRole ?? null;
      }

      if (gate && role && !gateAllows(role, gate, email, platformRole)) {
        if (gate === "admin") {
          return `/admin/connexion?error=forbidden`;
        }
        return `/connexion/${gate}?error=wrong_gate`;
      }

      if (!userId) return true;

      if (gate === "admin") {
        return true;
      }

      if (gate === "demo" || isDemoEmail(email)) {
        const access = await resolveDemoAccessForUser(userId);
        if (!access.ok) {
          const err =
            access.reason === "expired"
              ? "demo_expired"
              : access.reason === "disabled"
                ? "demo_disabled"
                : access.reason === "not_started"
                  ? "demo_not_started"
                  : "demo_invalid";
          return `/connexion/demo?error=${err}`;
        }
        await prisma.demoEnvironment.update({
          where: { id: access.demo.id },
          data: { lastLoginAt: new Date() },
        });
        return true;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          accountStatus: true,
          accessStatus: true,
          mustChangePassword: true,
          platformRole: true,
        },
      });

      if (dbUser?.accessStatus === "SUSPENDED" || dbUser?.accessStatus === "DISABLED") {
        return "/connexion/clients?error=account_disabled";
      }

      if (dbUser?.role === UserRole.CLIENT && !isClientLoginAllowed(dbUser.accountStatus)) {
        if (dbUser.accountStatus === ClientAccountStatus.REJECTED) {
          return "/connexion/clients?error=account_rejected";
        }
        return "/connexion/clients?error=account_pending";
      }

      if (dbUser?.mustChangePassword) {
        // Platform Admin : définir MDP via flux admin dédié, pas le dashboard client
        if (gate === "admin" || isPlatformAdminRole(dbUser.platformRole)) {
          return true;
        }
        return "/dashboard/parametres/securite?mustChangePassword=1";
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { id: string; role: string }).role;
        const u = user as unknown as Record<string, unknown>;
        token.contractStatus = typeof u.contractStatus === "string" ? u.contractStatus : undefined;
        token.accountStatus = typeof u.accountStatus === "string" ? u.accountStatus : undefined;
        token.email = typeof u.email === "string" ? u.email : token.email;
        token.mustChangePassword = Boolean(u.mustChangePassword);
        token.personType =
          typeof u.personType === "string" || u.personType === null
            ? (u.personType as string | null)
            : undefined;
        token.permissionProfile =
          typeof u.permissionProfile === "string" || u.permissionProfile === null
            ? (u.permissionProfile as string | null)
            : undefined;
        token.platformRole =
          typeof u.platformRole === "string" || u.platformRole === null
            ? (u.platformRole as string | null)
            : undefined;
        // Enrichir depuis la DB si absents (magic link)
        if (
          token.personType === undefined ||
          token.permissionProfile === undefined ||
          token.platformRole === undefined
        ) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { personType: true, permissionProfile: true, platformRole: true },
          });
          if (dbUser) {
            token.personType = dbUser.personType;
            token.permissionProfile = dbUser.permissionProfile;
            token.platformRole = dbUser.platformRole;
          }
        }
      } else if (token.id && (!token.role || token.personType === undefined || token.platformRole === undefined)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            contractStatus: true,
            accountStatus: true,
            email: true,
            mustChangePassword: true,
            personType: true,
            permissionProfile: true,
            platformRole: true,
          },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.contractStatus = dbUser.contractStatus;
          token.accountStatus = dbUser.accountStatus;
          token.email = dbUser.email;
          token.mustChangePassword = dbUser.mustChangePassword;
          token.personType = dbUser.personType;
          token.permissionProfile = dbUser.permissionProfile;
          token.platformRole = dbUser.platformRole;
        }
      }

      // Métadonnées démo (revalidées à chaque JWT) + nom affiché (évite Marc figé après apply-brand)
      const email = (token.email as string | undefined) ?? undefined;
      if (token.id && (isDemoEmail(email) || token.isDemo)) {
        const access = await resolveDemoAccessForUser(token.id as string);
        if (access.ok) {
          token.isDemo = true;
          token.demoEnvironmentId = access.demo.id;
          token.demoCompanyName = access.demo.companyName;
          token.demoModules = Array.isArray(access.demo.modulesEnabled)
            ? (access.demo.modulesEnabled as string[]).filter((x) => typeof x === "string")
            : [];
          if (!token.demoRootUserId) {
            token.demoRootUserId = access.demo.rootUserId;
          }
          // Lecture légère : synchro identité visible (Denis / profil) sans ensure* métier
          const demoUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { name: true, personType: true, permissionProfile: true },
          });
          if (demoUser?.name) token.name = demoUser.name;
          if (demoUser) {
            token.personType = demoUser.personType;
            token.permissionProfile = demoUser.permissionProfile;
          }
        } else {
          token.isDemo = true;
          token.demoExpired = true;
        }
      } else {
        token.isDemo = false;
        token.demoEnvironmentId = undefined;
        token.demoCompanyName = undefined;
        token.demoModules = undefined;
        token.demoExpired = undefined;
        token.demoRootUserId = undefined;
        token.demoViewAs = undefined;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.contractStatus = token.contractStatus as string;
        session.user.accountStatus = token.accountStatus as string;
        session.user.personType = (token.personType as string | null | undefined) ?? null;
        session.user.permissionProfile =
          (token.permissionProfile as string | null | undefined) ?? null;
        session.user.platformRole =
          (token.platformRole as string | null | undefined) ?? null;
        session.user.isDemo = Boolean(token.isDemo);
        session.user.demoEnvironmentId = token.demoEnvironmentId as string | undefined;
        session.user.demoCompanyName = token.demoCompanyName as string | undefined;
        session.user.demoModules = token.demoModules as string[] | undefined;
        session.user.demoExpired = Boolean(token.demoExpired);
        session.user.demoRootUserId = token.demoRootUserId as string | undefined;
        session.user.demoViewAs = (token.demoViewAs as string | null | undefined) ?? null;
        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.email === "string") session.user.email = token.email;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      const origin = canonicalRequestOrigin(baseUrl);
      if (url.startsWith("/")) return `${origin}${url}`;
      try {
        if (new URL(url).origin === origin) return url;
      } catch {
        /* ignore malformed url */
      }
      return `${origin}/dashboard`;
    },
  },
  pages: {
    signIn: "/connexion",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
} as NextAuthOptions;
