/**
 * Concurrence plafonnée pour les lectures Prisma.
 * Évite d’ouvrir trop de connexions contre un pooler Supabase limité.
 */

export async function mapPool<const T extends readonly unknown[]>(
  factories: { readonly [K in keyof T]: () => Promise<T[K]> },
  concurrency = 4,
): Promise<{ -readonly [K in keyof T]: T[K] }> {
  const list = factories as ReadonlyArray<() => Promise<unknown>>;
  const limit = Math.max(1, Math.min(concurrency, list.length));
  const results = new Array<unknown>(list.length);
  let next = 0;

  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const i = next++;
      if (i >= list.length) return;
      results[i] = await list[i]!();
    }
  });

  await Promise.all(workers);
  return results as { -readonly [K in keyof T]: T[K] };
}
