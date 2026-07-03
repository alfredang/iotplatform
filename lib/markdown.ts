/**
 * Minimal, dependency-free Markdown → HTML for blog content.
 * Supports: #/##/### headings, **bold**, *italic*, `code`, fenced ``` blocks,
 * - and 1. lists, > blockquotes, ![alt](src) images, [text](url) links,
 * horizontal rules (---), and blank-line-separated paragraphs.
 * Content is authored by admins (trusted); output is rendered with
 * dangerouslySetInnerHTML by the caller.
 */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  let out = esc(s);
  // images ![alt](src)
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) =>
    `<img src="${src}" alt="${alt}" class="my-4 w-full rounded-card border border-border" loading="lazy" />`);
  // links [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) =>
    `<a href="${url}" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">${text}</a>`);
  // inline code
  out = out.replace(/`([^`]+)`/g, (_m, c) => `<code class="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em]">${c}</code>`);
  // bold then italic
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      html.push(`<p class="my-4 leading-relaxed text-foreground/90">${inline(para.join(" "))}</p>`);
      para = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // fenced code block
    if (line.trim().startsWith("```")) {
      flushPara();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) { code.push(lines[i]); i++; }
      i++; // closing fence
      html.push(`<pre class="my-4 overflow-x-auto rounded-card border border-border bg-surface-2 p-4 text-sm"><code class="font-mono">${esc(code.join("\n"))}</code></pre>`);
      continue;
    }

    // heading
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushPara();
      const level = h[1].length;
      const sizes = { 1: "text-3xl", 2: "text-2xl", 3: "text-xl" } as const;
      html.push(`<h${level} class="mt-8 mb-3 ${sizes[level as 1 | 2 | 3]} font-bold tracking-tight">${inline(h[2])}</h${level}>`);
      i++; continue;
    }

    // horizontal rule
    if (/^---+$/.test(line.trim())) { flushPara(); html.push('<hr class="my-8 border-border" />'); i++; continue; }

    // blockquote
    if (line.trim().startsWith(">")) {
      flushPara();
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) { quote.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      html.push(`<blockquote class="my-4 border-l-2 border-primary/50 pl-4 italic text-muted">${inline(quote.join(" "))}</blockquote>`);
      continue;
    }

    // unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(inline(lines[i].replace(/^\s*[-*]\s+/, ""))); i++; }
      html.push(`<ul class="my-4 list-disc space-y-1 pl-6 text-foreground/90">${items.map((x) => `<li>${x}</li>`).join("")}</ul>`);
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(inline(lines[i].replace(/^\s*\d+\.\s+/, ""))); i++; }
      html.push(`<ol class="my-4 list-decimal space-y-1 pl-6 text-foreground/90">${items.map((x) => `<li>${x}</li>`).join("")}</ol>`);
      continue;
    }

    // blank line ends a paragraph
    if (line.trim() === "") { flushPara(); i++; continue; }

    para.push(line.trim());
    i++;
  }
  flushPara();
  return html.join("\n");
}
