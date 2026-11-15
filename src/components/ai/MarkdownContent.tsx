import type { ReactNode } from 'react';

function inlineMarkdown(value: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|\*[^*\n]+\*)/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(value))) {
    if (match.index > cursor) nodes.push(value.slice(cursor, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;

    if (token.startsWith('[')) {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = link?.[2]?.trim() ?? '';
      if (link && /^(https?:|mailto:)/i.test(href)) {
        nodes.push(<a key={key} href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#4F46E5] underline underline-offset-2 dark:text-[#C4B5FD]">{link[1]}</a>);
      } else {
        nodes.push(link?.[1] ?? token);
      }
    } else if (token.startsWith('`')) {
      nodes.push(<code key={key} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em] dark:bg-slate-800">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(<strong key={key} className="font-semibold">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('~~')) {
      nodes.push(<del key={key}>{token.slice(2, -2)}</del>);
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    cursor = match.index + token.length;
  }

  if (cursor < value.length) nodes.push(value.slice(cursor));
  return nodes;
}

function splitTableRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
}

export function MarkdownContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    if (/^\s*```/.test(line)) {
      const language = line.trim().slice(3).trim();
      index += 1;
      const code: string[] = [];
      while (index < lines.length && !/^\s*```/.test(lines[index])) code.push(lines[index++]);
      if (index < lines.length) index += 1;
      blocks.push(<pre key={blocks.length} className="my-3 max-w-full overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs leading-6 text-slate-100"><code data-language={language || undefined}>{code.join('\n')}</code></pre>);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const className = level <= 2 ? 'mt-3 mb-2 text-base font-bold' : 'mt-3 mb-1 text-sm font-bold';
      blocks.push(<div key={blocks.length} className={className}>{inlineMarkdown(heading[2], `h-${blocks.length}`)}</div>);
      index += 1;
      continue;
    }

    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push(<hr key={blocks.length} className="my-3 border-[#DCE4EF] dark:border-slate-700" />);
      index += 1;
      continue;
    }

    if (line.includes('|') && index + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) {
      const headers = splitTableRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) rows.push(splitTableRow(lines[index++]));
      blocks.push(
        <div key={blocks.length} className="my-3 max-w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead><tr>{headers.map((cell, i) => <th key={i} className="border border-[#DCE4EF] bg-[#F8FAFD] px-2 py-2 font-semibold dark:border-slate-700 dark:bg-slate-800">{inlineMarkdown(cell, `th-${blocks.length}-${i}`)}</th>)}</tr></thead>
            <tbody>{rows.map((row, ri) => <tr key={ri}>{headers.map((_, ci) => <td key={ci} className="border border-[#DCE4EF] px-2 py-2 align-top dark:border-slate-700">{inlineMarkdown(row[ci] ?? '', `td-${blocks.length}-${ri}-${ci}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }

    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      const isOrdered = Boolean(ordered);
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].match(isOrdered ? /^\s*\d+[.)]\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/);
        if (!item) break;
        items.push(item[1]);
        index += 1;
      }
      const ListTag = isOrdered ? 'ol' : 'ul';
      blocks.push(<ListTag key={blocks.length} className={`my-2 space-y-1 pl-5 ${isOrdered ? 'list-decimal' : 'list-disc'}`}>{items.map((item, i) => <li key={i}>{inlineMarkdown(item, `li-${blocks.length}-${i}`)}</li>)}</ListTag>);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ''));
      blocks.push(<blockquote key={blocks.length} className="my-2 border-l-2 border-violet-300 pl-3 text-[#475569] dark:border-violet-500 dark:text-slate-300">{quote.map((part, i) => <p key={i}>{inlineMarkdown(part, `quote-${blocks.length}-${i}`)}</p>)}</blockquote>);
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,6}\s|\s*```|\s*[-*+]\s|\s*\d+[.)]\s|>\s?)/.test(lines[index])) {
      paragraph.push(lines[index++]);
    }
    blocks.push(<p key={blocks.length} className="my-2 leading-7">{inlineMarkdown(paragraph.join(' '), `p-${blocks.length}`)}</p>);
  }

  return <div className="min-w-0 break-words text-sm leading-7 [overflow-wrap:anywhere]">{blocks}</div>;
}
