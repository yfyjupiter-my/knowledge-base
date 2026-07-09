import type { ReactNode } from "react";

/**
 * Minimal, dependency-free Markdown renderer for document bodies.
 * Renders directly to React elements (never dangerouslySetInnerHTML), so
 * there's no HTML-injection surface to sanitize against.
 * Supports: #/##/### headings, paragraphs, - / 1. lists, pipe tables,
 * and inline **bold**, *italic*, `code`, [text](url).
 */
export function Markdown({ content }: { content: string }) {
  const trimmed = content.trim();
  if (!trimmed) {
    return <p className="text-sm italic text-text-muted">No content yet.</p>;
  }
  const blocks = trimmed.split(/\n{2,}/);
  return <>{blocks.map((block, i) => renderBlock(block, i))}</>;
}

function renderBlock(block: string, key: number): ReactNode {
  const lines = block.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return null;

  const headingMatch = lines.length === 1 && lines[0].match(/^(#{1,6})\s+(.*)$/);
  if (headingMatch) {
    const level = Math.min(headingMatch[1].length + 1, 4);
    const className = "mb-2.5 mt-5.5 text-[15px] font-bold text-text first:mt-0";
    const text = parseInline(headingMatch[2]);
    switch (level) {
      case 2:
        return <h2 key={key} className={className}>{text}</h2>;
      case 3:
        return <h3 key={key} className={className}>{text}</h3>;
      default:
        return <h4 key={key} className={className}>{text}</h4>;
    }
  }

  if (lines.length >= 2 && lines[0].includes("|") && /^[\s:|-]+$/.test(lines[1]) && lines[1].includes("-")) {
    return renderTable(lines, key);
  }

  if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
    return (
      <ul key={key} className="mb-2.5 ml-5 list-disc text-sm leading-relaxed text-text-muted">
        {lines.map((l, i) => (
          <li key={i}>{parseInline(l.replace(/^\s*[-*]\s+/, ""))}</li>
        ))}
      </ul>
    );
  }

  if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
    return (
      <ol key={key} className="mb-2.5 ml-5 list-decimal text-sm leading-relaxed text-text-muted">
        {lines.map((l, i) => (
          <li key={i}>{parseInline(l.replace(/^\s*\d+\.\s+/, ""))}</li>
        ))}
      </ol>
    );
  }

  return (
    <p key={key} className="mb-2.5 text-sm leading-relaxed text-text-muted">
      {parseInline(lines.join(" "))}
    </p>
  );
}

function splitRow(line: string): string[] {
  const stripped = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return stripped.split("|").map((c) => c.trim());
}

function renderTable(lines: string[], key: number): ReactNode {
  const header = splitRow(lines[0]);
  const rows = lines.slice(2).map(splitRow);
  return (
    <div key={key} className="mb-2.5 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {header.map((cell, i) => (
              <th
                key={i}
                className="border border-border bg-surface-alt px-2.5 py-1.5 text-left text-xs font-semibold text-text"
              >
                {parseInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="border border-border px-2.5 py-1.5 text-text-muted">
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const INLINE_PATTERN = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/g;

/**
 * Returns a safe href for a Markdown link, or null if the URL uses a
 * disallowed scheme (e.g. `javascript:`, `data:`, `vbscript:`). React does not
 * sanitize `href`, so unsafe schemes here would execute on click — only allow
 * http(s)/mailto and relative (`/`, `#`, `?`) links.
 */
function safeHref(raw: string): string | null {
  const url = raw.trim();
  // Relative links (in-app paths, anchors, query-only) are safe.
  if (/^(?:[/#?])/.test(url)) return url;
  // Absolute URLs: allow only an explicit safe scheme.
  if (/^(?:https?:|mailto:)/i.test(url)) return url;
  // Anything with a scheme we didn't allow (or a control-char-obfuscated one) is dropped.
  return null;
}

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = new RegExp(INLINE_PATTERN);
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      const href = safeHref(match[2]);
      if (href === null) {
        // Disallowed scheme — render the link text only, never a live anchor.
        nodes.push(<span key={key++}>{match[1]}</span>);
      } else {
        nodes.push(
          <a
            key={key++}
            href={href}
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            {match[1]}
          </a>,
        );
      }
    } else if (match[3] !== undefined) {
      nodes.push(<strong key={key++}>{match[3]}</strong>);
    } else if (match[4] !== undefined) {
      nodes.push(
        <code key={key++} className="rounded-sm bg-surface-alt px-1 py-0.5 text-[0.85em]">
          {match[4]}
        </code>,
      );
    } else if (match[5] !== undefined) {
      nodes.push(<em key={key++}>{match[5]}</em>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
