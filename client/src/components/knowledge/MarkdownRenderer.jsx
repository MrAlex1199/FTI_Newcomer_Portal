import { useState } from 'react';

/**
 * Parses markdown into structured blocks:
 * - headings (with slug id for TOC)
 * - callouts (> [!NOTE], > [!WARNING], > [!TIP], > [!IMPORTANT], > [!CAUTION])
 * - code blocks (```lang ... ```)
 * - checklists (- [ ] or - [x])
 * - regular lists (- or 1.)
 * - tables (| a | b |)
 * - quotes (> ...)
 * - horizontal rules (---)
 * - paragraphs
 */

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0E00-\u0E7F-]/g, '')
    .replace(/\s+/g, '-');
}

// Inline parser for bold, italic, strikethrough, inline code, links, and images
function renderInline(text, keyPrefix = 'inline') {
  if (!text) return null;

  // Tokenize regex
  // 1: images !\[(.*?)\]\((.*?)\)
  // 2: links \[(.*?)\]\((.*?)\)
  // 3: inline code `(.*?)`
  // 4: bold \*\*(.*?)\*\*
  // 5: italic \*(.*?)\*
  // 6: strikethrough ~~(.*?)~~
  const regex = /(!?\[.*?\]\(.*?\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    const k = `${keyPrefix}-${idx}`;
    if (!part) return null;

    // Image: ![alt](url)
    if (part.startsWith('![') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (match) {
        return (
          <img
            key={k}
            src={match[2]}
            alt={match[1]}
            className="my-3 max-h-96 rounded-xl border border-slate-200 object-contain shadow-xs"
            loading="lazy"
          />
        );
      }
    }

    // Link: [text](url)
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (match) {
        const isExternal = match[2].startsWith('http');
        return (
          <a
            key={k}
            href={match[2]}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800 hover:decoration-blue-600"
          >
            {match[1]}
          </a>
        );
      }
    }

    // Inline Code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={k}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-rose-600 border border-slate-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={k} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Strikethrough: ~~text~~
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      return (
        <del key={k} className="text-slate-400 line-through">
          {part.slice(2, -2)}
        </del>
      );
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={k} className="italic text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }

    return <span key={k}>{part}</span>;
  });
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2 text-slate-400">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-300">
          {lang || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-slate-100 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const CALLOUT_STYLES = {
  NOTE: {
    border: 'border-blue-500',
    bg: 'bg-blue-50/80',
    text: 'text-blue-900',
    title: 'Note',
    icon: 'ℹ️',
  },
  TIP: {
    border: 'border-emerald-500',
    bg: 'bg-emerald-50/80',
    text: 'text-emerald-900',
    title: 'Tip',
    icon: '💡',
  },
  WARNING: {
    border: 'border-amber-500',
    bg: 'bg-amber-50/80',
    text: 'text-amber-900',
    title: 'Warning',
    icon: '⚠️',
  },
  CAUTION: {
    border: 'border-red-500',
    bg: 'bg-red-50/80',
    text: 'text-red-900',
    title: 'Caution',
    icon: '🚨',
  },
  IMPORTANT: {
    border: 'border-purple-500',
    bg: 'bg-purple-50/80',
    text: 'text-purple-900',
    title: 'Important',
    icon: '📌',
  },
};

export default function MarkdownRenderer({ content = '' }) {
  if (!content) return null;

  const lines = content.split(/\r?\n/);
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // 1. Code Block ```
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      elements.push(
        <CodeBlock
          key={`code-${elements.length}`}
          code={codeLines.join('\n')}
          lang={lang}
        />
      );
      continue;
    }

    // 2. Obsidian Callouts (> [!NOTE], > [!WARNING], etc.)
    const calloutMatch = line.match(/^>\s*\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT|DANGER)\](?:\s+(.*))?$/i);
    if (calloutMatch) {
      let type = calloutMatch[1].toUpperCase();
      if (type === 'DANGER') type = 'CAUTION';
      const customTitle = calloutMatch[2];
      const style = CALLOUT_STYLES[type] || CALLOUT_STYLES.NOTE;
      const quoteLines = [];
      i++;
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <div
          key={`callout-${elements.length}`}
          className={`my-4 rounded-xl border-l-4 ${style.border} ${style.bg} p-4 shadow-xs`}
        >
          <div className="flex items-center gap-2 font-semibold text-sm">
            <span>{style.icon}</span>
            <span className={style.text}>{customTitle || style.title}</span>
          </div>
          {quoteLines.length > 0 && (
            <div className={`mt-2 text-xs leading-relaxed ${style.text} opacity-90 space-y-1`}>
              {quoteLines.map((ql, qidx) => (
                <p key={qidx}>{renderInline(ql, `callout-text-${qidx}`)}</p>
              ))}
            </div>
          )}
        </div>
      );
      continue;
    }

    // 3. Standard Blockquote (> ...)
    if (line.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${elements.length}`}
          className="my-3 border-l-4 border-slate-300 bg-slate-50 py-2 pl-4 pr-3 text-sm italic text-slate-700 rounded-r-lg"
        >
          {quoteLines.map((ql, qidx) => (
            <p key={qidx}>{renderInline(ql, `quote-text-${qidx}`)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 4. Headings
    if (/^#{1,4}\s/.test(line)) {
      const match = line.match(/^(#{1,4})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const id = slugify(text);

        if (level === 1) {
          elements.push(
            <h1
              key={`h1-${elements.length}`}
              id={id}
              className="mt-6 mb-3 text-2xl font-bold tracking-tight text-slate-900 scroll-mt-20 border-b border-slate-100 pb-2"
            >
              {renderInline(text, `h1-${id}`)}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2
              key={`h2-${elements.length}`}
              id={id}
              className="mt-5 mb-2.5 text-xl font-bold text-slate-900 scroll-mt-20 border-b border-slate-100/60 pb-1.5"
            >
              {renderInline(text, `h2-${id}`)}
            </h2>
          );
        } else if (level === 3) {
          elements.push(
            <h3
              key={`h3-${elements.length}`}
              id={id}
              className="mt-4 mb-2 text-base font-semibold text-slate-800 scroll-mt-20"
            >
              {renderInline(text, `h3-${id}`)}
            </h3>
          );
        } else {
          elements.push(
            <h4
              key={`h4-${elements.length}`}
              id={id}
              className="mt-3 mb-1.5 text-sm font-semibold text-slate-800 scroll-mt-20"
            >
              {renderInline(text, `h4-${id}`)}
            </h4>
          );
        }
        i++;
        continue;
      }
    }

    // 5. Horizontal divider
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      elements.push(<hr key={`hr-${elements.length}`} className="my-6 border-slate-200" />);
      i++;
      continue;
    }

    // 6. Checklists (- [ ] or - [x])
    if (/^-\s*\[([ xX])\]\s+(.*)$/.test(line)) {
      const checklistItems = [];
      while (i < lines.length && /^-\s*\[([ xX])\]\s+(.*)$/.test(lines[i])) {
        const m = lines[i].match(/^-\s*\[([ xX])\]\s+(.*)$/);
        const checked = m[1].toLowerCase() === 'x';
        checklistItems.push({ checked, text: m[2] });
        i++;
      }
      elements.push(
        <ul key={`checklist-${elements.length}`} className="my-3 space-y-1.5">
          {checklistItems.map((item, cidx) => (
            <li key={cidx} className="flex items-start gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                readOnly
                checked={item.checked}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-default"
              />
              <span className={item.checked ? 'text-slate-400 line-through' : 'text-slate-800'}>
                {renderInline(item.text, `chk-${cidx}`)}
              </span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 7. Unordered lists (- or *)
    if (/^[-*]\s+(.*)$/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^[-*]\s+(.*)$/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-3 list-disc pl-5 space-y-1 text-sm text-slate-700">
          {listItems.map((item, lidx) => (
            <li key={lidx}>{renderInline(item, `ul-${lidx}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 8. Ordered lists (1. 2. ...)
    if (/^\d+\.\s+(.*)$/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\d+\.\s+(.*)$/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-3 list-decimal pl-5 space-y-1 text-sm text-slate-700">
          {listItems.map((item, lidx) => (
            <li key={lidx}>{renderInline(item, `ol-${lidx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // 9. Markdown Tables (| a | b |)
    if (line.includes('|') && lines[i + 1] && /^\s*\|?\s*[-:]+[-| :]*\|?\s*$/.test(lines[i + 1])) {
      const headers = line.split('|').map((s) => s.trim()).filter(Boolean);
      i += 2; // skip header and separator
      const rows = [];
      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i].split('|').map((s) => s.trim()).filter(Boolean);
        rows.push(cells);
        i++;
      }
      elements.push(
        <div key={`table-${elements.length}`} className="my-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 font-semibold text-slate-900 border-b border-slate-200">
              <tr>
                {headers.map((h, hidx) => (
                  <th key={hidx} className="px-3.5 py-2.5">
                    {renderInline(h, `th-${hidx}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, ridx) => (
                <tr key={ridx} className="hover:bg-slate-50/60">
                  {row.map((cell, cidx) => (
                    <td key={cidx} className="px-3.5 py-2">
                      {renderInline(cell, `td-${ridx}-${cidx}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 10. Regular Paragraph
    elements.push(
      <p key={`p-${elements.length}`} className="my-2.5 text-sm leading-relaxed text-slate-700">
        {renderInline(line, `p-${elements.length}`)}
      </p>
    );
    i++;
  }

  return <div className="markdown-body space-y-1">{elements}</div>;
}

/**
 * Extracts table of contents items (#, ##, ###) from markdown content
 */
export function extractHeadings(content = '') {
  if (!content) return [];
  const lines = content.split(/\r?\n/);
  const headings = [];

  lines.forEach((line) => {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = slugify(text);
      headings.push({ level, text, id });
    }
  });

  return headings;
}
