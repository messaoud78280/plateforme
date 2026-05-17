function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Markdown simple → HTML pour export Word (.doc via MIME HTML). */
export function markdownToExportHtml(markdown: string, title: string): string {
  const body: string[] = [];
  let tableOpen = false;
  const tableRows: string[][] = [];

  const flushTable = () => {
    if (!tableOpen || tableRows.length === 0) return;
    body.push("<table border=\"1\" cellpadding=\"4\" cellspacing=\"0\" style=\"border-collapse:collapse;width:100%\">");
    tableRows.forEach((row, i) => {
      const tag = i === 0 ? "th" : "td";
      body.push("<tr>" + row.map((c) => `<${tag}>${escapeHtml(c)}</${tag}>`).join("") + "</tr>");
    });
    body.push("</table>");
    tableRows.length = 0;
    tableOpen = false;
  };

  for (const raw of markdown.split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) continue;
      tableOpen = true;
      tableRows.push(cells);
      continue;
    }
    flushTable();

    if (!line.trim()) {
      body.push("<p>&nbsp;</p>");
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)?.[0].length ?? 2;
      const text = line.replace(/^#+\s+/, "");
      const tag = level <= 1 ? "h1" : level === 2 ? "h2" : "h3";
      body.push(`<${tag}>${escapeHtml(text)}</${tag}>`);
      continue;
    }
    if (line.startsWith("> ")) {
      body.push(`<blockquote><p>${escapeHtml(line.slice(2))}</p></blockquote>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      body.push(`<ul><li>${escapeHtml(line.replace(/^[-*]\s+/, ""))}</li></ul>`);
      continue;
    }
    const inline = escapeHtml(line)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
    body.push(`<p>${inline}</p>`);
  }
  flushTable();

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1e293b">
<h1 style="color:#1e3a5f">${escapeHtml(title)}</h1>
<p style="color:#64748b;font-size:9pt">Document généré par BeWork — Skill CCTP — ${new Date().toLocaleString("fr-FR")}</p>
<hr/>
${body.join("\n")}
</body></html>`;
}

export function buildCctpWordBuffer(markdown: string, title: string): Buffer {
  return Buffer.from(markdownToExportHtml(markdown, title), "utf-8");
}
