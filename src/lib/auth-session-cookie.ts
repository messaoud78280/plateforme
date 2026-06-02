import type { JWT } from "next-auth/jwt";
import { encode } from "next-auth/jwt";

/** Nom du cookie de session NextAuth (aligné sur magic-login). */
export function getNextAuthSessionCookieName(secure: boolean): string {
  return secure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

/**
 * Crée un JWT de session compatible getServerSession / getToken.
 * Important : salt doit rester vide (""), comme dans next-auth/jwt getToken().
 */
export async function createNextAuthSessionToken(
  secret: string,
  token: JWT,
): Promise<string> {
  return encode({
    secret,
    salt: "",
    maxAge: SESSION_MAX_AGE,
    token,
  });
}

export function nextAuthSessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
