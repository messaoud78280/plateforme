import { SITE_URL } from "@/lib/site";

const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://yandex.com/indexnow/indexnow",
] as const;

export function getIndexNowKey(): string | null {
  const key = process.env.INDEXNOW_API_KEY?.trim();
  return key && key.length >= 8 && key.length <= 128 ? key : null;
}

export function getIndexNowKeyLocation(): string | null {
  const key = getIndexNowKey();
  if (!key) return null;
  try {
    const host = new URL(SITE_URL).host;
    return `https://${host}/${key}.txt`;
  } catch {
    return null;
  }
}

/** Notifie Bing / Yandex / partenaires IndexNow après publication ou déploiement. */
export async function pingIndexNow(urlList: string[]): Promise<{ ok: boolean; errors: string[] }> {
  const key = getIndexNowKey();
  if (!key || urlList.length === 0) {
    return { ok: false, errors: ["INDEXNOW_API_KEY manquant ou liste d’URL vide."] };
  }

  let host: string;
  try {
    host = new URL(SITE_URL).host;
  } catch {
    return { ok: false, errors: ["NEXT_PUBLIC_SITE_URL invalide."] };
  }

  const keyLocation = `https://${host}/${key}.txt`;
  const body = {
    host,
    key,
    keyLocation,
    urlList: urlList.slice(0, 10_000),
  };

  const errors: string[] = [];
  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      });
      if (!res.ok && res.status !== 202) {
        errors.push(`${endpoint}: HTTP ${res.status}`);
      }
    } catch (e) {
      errors.push(`${endpoint}: ${e instanceof Error ? e.message : "erreur réseau"}`);
    }
  }

  return { ok: errors.length === 0, errors };
}
