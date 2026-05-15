import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Hôte canonique (ex. www.bework.fr) — dérivé de NEXT_PUBLIC_SITE_URL en prod. */
function getCanonicalHost(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.bework.fr";
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return "www.bework.fr";
  }
}

/** Domaines apex à rediriger vers l’hôte canonique (sans www). */
const APEX_REDIRECT_HOSTS = new Set(["bework.fr"]);

export function middleware(request: NextRequest) {
  const canonicalHost = getCanonicalHost();
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();

  if (!host || host === canonicalHost) {
    return NextResponse.next();
  }

  if (APEX_REDIRECT_HOSTS.has(host)) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = canonicalHost;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|woff2?)$).*)"],
};
