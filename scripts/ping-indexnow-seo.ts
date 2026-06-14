/**
 * Ping IndexNow (Bing, Yandex, partenaires) pour les URLs SEO / IA prioritaires.
 * Usage : npx tsx scripts/ping-indexnow-seo.ts
 * Requiert INDEXNOW_API_KEY et NEXT_PUBLIC_SITE_URL en env.
 */
import { getIndexNowPriorityUrls } from "../src/lib/seo-ai-discovery";
import { pingIndexNow } from "../src/lib/indexnow";

async function main() {
  const urls = getIndexNowPriorityUrls();
  console.info(`IndexNow — ${urls.length} URL(s) prioritaires…`);
  const result = await pingIndexNow(urls);
  if (result.ok) {
    console.info("IndexNow : OK");
  } else {
    console.error("IndexNow : erreurs", result.errors);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
