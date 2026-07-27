import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  detectCountryCode,
  isCountryBlocked,
  parseBlockedCountries,
  shouldSkipGeoBlock,
} from "@/lib/geo-block";

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

export function proxy(request: NextRequest) {
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|woff2?|txt|xml)$).*)",
  ],
};
