import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import bcrypt from "bcryptjs";
import { ClientAccountStatus, UserRole } from "@prisma/client";
import { prismaAdapterCaseInsensitiveEmail } from "./auth-adapter";
import { prisma } from "./prisma";
import { sendEmail } from "@/lib/email";
import { isClientLoginAllowed } from "@/lib/client-account-approval";

export const authOptions: NextAuthOptions = {
  adapter: prismaAdapterCaseInsensitiveEmail(prisma),
  providers: [
    EmailProvider({
      // 24h pour utiliser le lien (option B)
      maxAge: 24 * 60 * 60,
      // Envoi via l'API Brevo (pas de SMTP / nodemailer).
      // NextAuth utilise seulement ce callback pour envoyer le lien.
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url }) {
        const emailNorm = identifier.trim().toLowerCase();
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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const email = credentials.email.trim().toLowerCase();
          const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
          });

          if (!user?.password) return null;
          if (!(await bcrypt.compare(credentials.password, user.password))) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            contractStatus: user.contractStatus,
            accountStatus: user.accountStatus,
          };
        } catch (err) {
          console.error("[Auth] Erreur base de données:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const userId = (user as { id?: string }).id;
      if (!userId) return true;

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, accountStatus: true },
      });

      if (dbUser?.role === UserRole.CLIENT && !isClientLoginAllowed(dbUser.accountStatus)) {
        if (dbUser.accountStatus === ClientAccountStatus.REJECTED) {
          return "/connexion/clients?error=account_rejected";
        }
        return "/connexion/clients?error=account_pending";
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
      } else if (token.id && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, contractStatus: true, accountStatus: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.contractStatus = dbUser.contractStatus;
          token.accountStatus = dbUser.accountStatus;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.contractStatus = token.contractStatus as string;
        session.user.accountStatus = token.accountStatus as string;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl + "/dashboard";
    },
  },
  pages: {
    signIn: "/connexion",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
} as NextAuthOptions;
