import Link from "next/link";
import type { ServicePageDefinition, ServicePageSlug } from "@/content/service-pages";
import { SERVICE_PAGES } from "@/content/service-pages";

type Props = { definition: ServicePageDefinition };

export function ServicePageBody({ definition: d }: Props) {
  const seeAlso =
    d.seeAlsoSlugs?.map((slug) => {
      const page = SERVICE_PAGES[slug as ServicePageSlug];
      if (!page) return null;
      return { slug: slug as ServicePageSlug, label: page.h1 };
    }).filter(Boolean) ?? [];

  return (
    <>
      <h2>Pour qui</h2>
      <ul>
        {d.pourQuiBullets.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <h2>Ce que BeWork prend en charge</h2>
      <ul>
        {d.priseEnChargeBullets.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <h2>Pourquoi déléguer cette mission</h2>
      {d.pourquoiParagraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}

      <h2>Comment ça fonctionne</h2>
      <ol>
        {d.commentSteps.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>

      <h2>Approfondir</h2>
      <ul>
        {d.deepeningLinks.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>

      {seeAlso.length > 0 ? (
        <>
          <h2>Voir aussi</h2>
          <ul>
            {seeAlso.map((item) =>
              item ? (
                <li key={item.slug}>
                  <Link href={`/services/${item.slug}`}>{item.label}</Link>
                </li>
              ) : null
            )}
          </ul>
        </>
      ) : null}

      <h2>Questions fréquentes</h2>
      <dl>
        {d.faq.map((item) => (
          <div key={item.q} className="not-prose mb-8">
            <dt className="font-bold text-black">{item.q}</dt>
            <dd className="mt-2 text-black">{item.a}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
