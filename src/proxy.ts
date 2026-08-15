import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  detectCountryCode,
  isCountryBlocked,
  parseBlockedCountries,
  shouldSkipGeoBlock,
} from "@/lib/geo-block";
import {
  canAccessDashboardApi,
  canAccessDashboardHref,
  requiredHrefForApiPath,
} from "@/lib/equipe-acces/dashboard-policy";

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

/** Healthcheck Railway : Host = healthcheck.railway.app — ne jamais rediriger. */
const HEALTHCHECK_PATHS = new Set(["/api/health", "/api/health-db"]);
const PASSTHROUGH_HOSTS = new Set([
  "healthcheck.railway.app",
  "localhost",
  "127.0.0.1",
]);

const BLOCKED_COUNTRIES = parseBlockedCountries(process.env.BLOCKED_COUNTRIES);

function geoBlockResponse(request: NextRequest): NextResponse | null {
  if (!BLOCKED_COUNTRIES.length) return null;

  const pathname = request.nextUrl.pathname;
  if (shouldSkipGeoBlock(pathname)) return null;

  const country = detectCountryCode(request);

  if (process.env.NODE_ENV === "development") {
    console.info("[geo-block]", {
      pathname,
      country: country ?? "(inconnu)",
      blocked: BLOCKED_COUNTRIES,
    });
  }

  if (!isCountryBlocked(country, BLOCKED_COUNTRIES)) return null;

  return new NextResponse("Access denied.", {
    status: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function tokenPersona(token: { personType?: unknown; permissionProfile?: unknown }) {
  return {
    personType: (token.personType as string | null | undefined) ?? null,
    permissionProfile: (token.permissionProfile as string | null | undefined) ?? null,
  };
}

/** SEC-1 — pages dashboard + APIs mappées. Next 16 : un seul fichier proxy. */
async function applyPersonaGate(
  request: NextRequest,
  requestHeaders: Headers,
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const mappedApi = requiredHrefForApiPath(pathname);
  const isDashboard = pathname.startsWith("/dashboard");
  if (!isDashboard && !mappedApi) return null;

  const token = await getToken({ req: request, secret });
  const authenticated = Boolean(token?.id || token?.sub);
  const { personType, permissionProfile } = token
    ? tokenPersona(token)
    : { personType: null, permissionProfile: null };

  if (isDashboard) {
    if (!authenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/connexion";
      url.search = `?callbackUrl=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    if (!canAccessDashboardHref(pathname, personType, permissionProfile)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (!authenticated) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!canAccessDashboardApi(pathname, personType, permissionProfile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export async function proxy(request: NextRequest) {
  if (HEALTHCHECK_PATHS.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const indexNowKey = process.env.INDEXNOW_API_KEY?.trim();
  if (indexNowKey) {
    const keyMatch = request.nextUrl.pathname.match(/^\/([a-zA-Z0-9-]{8,128})\.txt$/);
    if (keyMatch?.[1] === indexNowKey) {
      return new NextResponse(indexNowKey, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  }

  const blocked = geoBlockResponse(request);
  if (blocked) return blocked;

  const canonicalHost = getCanonicalHost();
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();

  if (host && host !== canonicalHost && !PASSTHROUGH_HOSTS.has(host)) {
    if (APEX_REDIRECT_HOSTS.has(host)) {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      url.host = canonicalHost;
      return NextResponse.redirect(url, 308);
    }
  }

  const requestHeaders = new Headers(request.headers);
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    requestHeaders.set("x-dashboard-pathname", request.nextUrl.pathname);
  }

  const gated = await applyPersonaGate(request, requestHeaders);
  if (gated) return gated;

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|woff2?|txt|xml)$).*)",
  ],
};
