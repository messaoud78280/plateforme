import crypto from "crypto";
import type { AuthOptions } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Reproduction de `parseUrl` (next-auth/utils/parse-url) pour calculer `createSecret` / hash identiques au runtime NextAuth.
 */
function parseUrlLikeNextAuth(urlInput: string) {
  const defaultUrl = new URL("http://localhost:3000/api/auth");
  let urlStr = urlInput;
  if (urlStr && !urlStr.startsWith("http")) {
    urlStr = `https://${urlStr}`;
  }
  const u = new URL(urlStr || defaultUrl.toString());
  const path = (u.pathname === "/" ? defaultUrl.pathname : u.pathname).replace(/\/$/, "");
  const base = `${u.origin}${path}`;
  return {
    origin: u.origin,
    host: u.host,
    path,
    base,
    toString: () => base,
  };
}

/** Comme `createSecret` dans `next-auth/core/lib/utils`. */
function createSecretLikeNextAuth(urlInput: string): string {
  const url = parseUrlLikeNextAuth(urlInput);
  const s = (authOptions as AuthOptions).secret;
  if (s != null && s !== "") return String(s);
  return crypto
    .createHash("sha256")
    .update(JSON.stringify({ ...url, ...(authOptions as AuthOptions) }))
    .digest("hex");
}

/** Comme `hashToken` dans `next-auth/core/lib/utils` (provider email). */
export function nextAuthEmailVerificationTokenHash(
  rawTokenFromUrl: string,
  /** Ex. `http://127.0.0.1:3000` — même base que le lien du mail. */
  requestOriginBase: string
): string {
  const secret = createSecretLikeNextAuth(requestOriginBase);
  const providers = (authOptions as AuthOptions).providers ?? [];
  const emailProv = providers.find(
    (p) => typeof p === "object" && p !== null && "id" in p && (p as { id: string }).id === "email"
  ) as { secret?: string } | undefined;
  const salt = emailProv?.secret ?? secret;
  return crypto.createHash("sha256").update(`${rawTokenFromUrl}${salt}`).digest("hex");
}
