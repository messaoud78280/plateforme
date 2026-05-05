import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import bcrypt from "bcryptjs";
import { prismaAdapterCaseInsensitiveEmail } from "./auth-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: prismaAdapterCaseInsensitiveEmail(prisma),
  providers: [
    EmailProvider({
      // 24h pour utiliser le lien (option B)
      maxAge: 24 * 60 * 60,
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || "587"),
        secure:
          (process.env.SMTP_SECURE ?? "").trim().toLowerCase() === "true" ||
          (process.env.SMTP_SECURE ?? "").trim() === "1" ||
          (!(process.env.SMTP_SECURE ?? "").trim() && Number(process.env.SMTP_PORT || "587") === 465),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
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

          if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            contractStatus: user.contractStatus,
          };
        } catch (err) {
          console.error("[Auth] Erreur base de données:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { id: string; role: string }).role;
        const u = user as unknown as Record<string, unknown>;
        token.contractStatus = typeof u.contractStatus === "string" ? u.contractStatus : undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.contractStatus = token.contractStatus as string;
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
