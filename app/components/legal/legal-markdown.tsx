"use client";

import { Fragment, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * Renders the Markdown subset legal documents are written in: "## " and
 * "### " headings, paragraphs, "- " and "1. " lists, "> " callouts, **bold**
 * and [links](/legal?doc=privacy). Built from React elements, never HTML,
 * so a document can't inject anything into the page.
 */

type Block =
  | { kind: "h2" | "h3" | "p" | "callout"; text: string }
  | { kind: "ul" | "ol"; items: string[] };

export function parseLegalMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  let callout: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "p", text: para.join(" ") });
    if (list) blocks.push(list);
    if (callout.length) blocks.push({ kind: "callout", text: callout.join(" ") });
    para = [];
    list = null;
    callout = [];
  };
  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      blocks.push({ kind: heading[1].length >= 3 ? "h3" : "h2", text: heading[2] });
    } else if (bullet || numbered) {
      const kind = bullet ? "ul" : "ol";
      if (para.length || callout.length || (list && list.kind !== kind)) flush();
      list = list ?? { kind, items: [] };
      list.items.push((bullet ?? numbered)![1]);
    } else if (line.startsWith(">")) {
      if (para.length || list) flush();
      callout.push(line.replace(/^>\s?/, ""));
    } else if (list && /^\s{2,}/.test(raw)) {
      // An indented line continues the previous list item.
      list.items[list.items.length - 1] += ` ${line}`;
    } else {
      if (list || callout.length) flush();
      para.push(line);
    }
  }
  flush();
  return blocks;
}

const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;

function Inline({ text, onInternal }: { text: string; onInternal: (href: string) => void }) {
  const parts = text.split(INLINE).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-slate-800 dark:text-slate-100">
              {part.slice(2, -2)}
            </strong>
          );
        }
        const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
        if (link) {
          const [, label, href] = link;
          const cls = "text-blue-600 dark:text-blue-400 font-medium underline-offset-2 hover:underline";
          if (href.startsWith("/")) {
            return (
              <a
                key={i}
                href={href}
                className={cls}
                onClick={(e) => {
                  e.preventDefault();
                  onInternal(href);
                }}
              >
                {label}
              </a>
            );
          }
          if (/^(https?:|mailto:|tel:)/i.test(href)) {
            return (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                {label}
              </a>
            );
          }
          return <Fragment key={i}>{label}</Fragment>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

export default function LegalMarkdown({
  content,
  onInternalLink,
}: {
  content: string;
  /** Where links to other pages go; by default the app navigates to them. */
  onInternalLink?: (href: string) => void;
}) {
  const router = useRouter();
  const blocks = parseLegalMarkdown(content);
  const onInternal = onInternalLink ?? ((href: string) => router.push(href));
  const nodes: ReactNode[] = blocks.map((b, i) => {
    switch (b.kind) {
      case "h2":
        return (
          <h3 key={i} className="text-[15px] font-bold text-slate-900 dark:text-white pt-3">
            <Inline text={b.text} onInternal={onInternal} />
          </h3>
        );
      case "h3":
        return (
          <h4 key={i} className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 pt-1">
            <Inline text={b.text} onInternal={onInternal} />
          </h4>
        );
      case "callout":
        return (
          <div
            key={i}
            className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-amber-900 dark:text-amber-200"
          >
            <Inline text={b.text} onInternal={onInternal} />
          </div>
        );
      case "ul":
      case "ol": {
        const List = b.kind === "ul" ? "ul" : "ol";
        return (
          <List key={i} className={`${b.kind === "ul" ? "list-disc" : "list-decimal"} pl-5 space-y-1.5 marker:text-slate-400`}>
            {b.items.map((item, j) => (
              <li key={j}>
                <Inline text={item} onInternal={onInternal} />
              </li>
            ))}
          </List>
        );
      }
      default:
        // The "Effective …" line at the top reads as a date badge.
        if (i === 0 && /^(effective|last updated)\b/i.test(b.text)) {
          return (
            <div
              key={i}
              className="inline-block rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              {b.text}
            </div>
          );
        }
        return (
          <p key={i}>
            <Inline text={b.text} onInternal={onInternal} />
          </p>
        );
    }
  });
  return <div className="space-y-3.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{nodes}</div>;
}
