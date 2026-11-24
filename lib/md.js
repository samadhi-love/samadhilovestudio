// A tiny, safe Markdown renderer for the site's own teachings.
// Supports: ## and ### headings, paragraphs, - and 1. lists, > quotes,
// pipe tables, **bold**, *italic* and [links](https://...).
// All text is HTML-escaped first, so nothing in the content can inject markup.

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inline(text) {
  let out = escapeHtml(text);
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, label, url) =>
    `<a href="${url}" rel="noopener noreferrer" target="_blank">${label}</a>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>");
  return out;
}

export function renderMarkdown(md) {
  const lines = String(md).replace(/\r/g, "").split("\n");
  const html = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i++; continue;
    }
    if (line.startsWith(">")) {
      const block = [];
      while (i < lines.length && lines[i].startsWith(">")) { block.push(lines[i].replace(/^>\s?/, "")); i++; }
      html.push(`<blockquote>${renderMarkdown(block.join("\n"))}</blockquote>`);
      continue;
    }
    if (line.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) { rows.push(lines[i]); i++; }
      const cells = (row) => row.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      html.push(`<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th scope="col">${inline(c)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    if (/^- /.test(line) || /^\d+\. /.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const items = [];
      while (i < lines.length && (ordered ? /^\d+\. /.test(lines[i]) : /^- /.test(lines[i]))) {
        items.push(lines[i].replace(ordered ? /^\d+\. / : /^- /, "")); i++;
      }
      const tag = ordered ? "ol" : "ul";
      html.push(`<${tag}>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</${tag}>`);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|>|\||- |\d+\. )/.test(lines[i])) { para.push(lines[i]); i++; }
    html.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return html.join("\n");
}
