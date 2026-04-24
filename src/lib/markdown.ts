/**
 * Tiny Markdown → HTML converter sized for the document drafts the AI produces.
 * Handles: # / ## / ### headings, **bold**, *italic*, ordered/unordered lists, paragraphs, hr.
 * Not a general-purpose Markdown engine — intentionally minimal.
 */
export function mdToHtml(md: string): string {
  if (!md) return "";

  const escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = escaped.split("\n");
  const out: string[] = [];
  let inOl = false;
  let inUl = false;
  let paraBuf: string[] = [];

  const flushPara = () => {
    if (!paraBuf.length) return;
    const text = paraBuf.join(" ").trim();
    if (text) out.push(`<p>${inline(text)}</p>`);
    paraBuf = [];
  };
  const closeLists = () => {
    if (inOl) { out.push("</ol>"); inOl = false; }
    if (inUl) { out.push("</ul>"); inUl = false; }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line === "") { flushPara(); closeLists(); continue; }
    if (/^---+$/.test(line)) { flushPara(); closeLists(); out.push("<hr/>"); continue; }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara(); closeLists();
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }
    const ol = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (ol) {
      flushPara();
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (!inOl) { out.push("<ol>"); inOl = true; }
      out.push(`<li>${inline(ol[2])}</li>`);
      continue;
    }
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) {
      flushPara();
      if (inOl) { out.push("</ol>"); inOl = false; }
      if (!inUl) { out.push("<ul>"); inUl = true; }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    closeLists();
    paraBuf.push(line);
  }
  flushPara();
  closeLists();
  return out.join("\n");
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
