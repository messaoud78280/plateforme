/** Nom du cookie de session NextAuth (aligné sur magic-login). */
export function getNextAuthSessionCookieName(secure: boolean): string {
  return secure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}
