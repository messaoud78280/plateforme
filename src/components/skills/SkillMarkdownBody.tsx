/** Rendu Markdown léger (titres, listes, paragraphes) — sans dépendance externe. */
export function SkillMarkdownBody({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/\n\n+/);

  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-800">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("```")) {
          const inner = trimmed.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800"
            >
              {inner}
            </pre>
          );
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="font-heading text-lg font-bold tracking-tight text-[#0f172a]">
              {trimmed.replace(/^##\s+/, "")}
            </h2>
          );
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="font-heading text-base font-bold text-[#1e3a5f]">
              {trimmed.replace(/^###\s+/, "")}
            </h3>
          );
        }

        if (trimmed.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-4 border-[#2563eb]/40 bg-[#eff6ff]/60 px-4 py-3 text-slate-700"
            >
              {trimmed
                .split("\n")
                .map((l) => l.replace(/^>\s?/, ""))
                .join(" ")}
            </blockquote>
          );
        }

        if (/^\|.+\|/.test(trimmed) && trimmed.includes("\n|")) {
          const rows = trimmed.split("\n").filter((r) => r.trim().startsWith("|"));
          return (
            <div key={i} className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <tbody>
                  {rows.map((row, ri) => {
                    if (/^\|[\s\-:|]+\|$/.test(row)) return null;
                    const cells = row
                      .split("|")
                      .slice(1, -1)
                      .map((c) => c.trim());
                    const Tag = ri === 0 ? "th" : "td";
                    return (
                      <tr key={ri} className={ri === 0 ? "bg-slate-100 font-semibold" : "border-t border-slate-100"}>
                        {cells.map((cell, ci) => (
                          <Tag key={ci} className="px-3 py-2">
                            {cell}
                          </Tag>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }

        const lines = trimmed.split("\n");
        if (lines.every((l) => /^[-*]\s/.test(l.trim()) || l.trim() === "")) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5">
              {lines
                .filter((l) => l.trim())
                .map((l, li) => (
                  <li key={li}>{l.replace(/^[-*]\s+/, "")}</li>
                ))}
            </ul>
          );
        }

        if (lines.every((l) => /^\d+\.\s/.test(l.trim()) || l.trim() === "")) {
          return (
            <ol key={i} className="list-decimal space-y-1.5 pl-5">
              {lines
                .filter((l) => l.trim())
                .map((l, li) => (
                  <li key={li}>{l.replace(/^\d+\.\s+/, "")}</li>
                ))}
            </ol>
          );
        }

        return (
          <p key={i} className="whitespace-pre-wrap">
            {trimmed.split("\n").map((line, li) => (
              <span key={li}>
                {li > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
