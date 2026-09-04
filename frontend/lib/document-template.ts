import { Block, Inline } from "./document-blocks";

/**
 * Parses one of the raw Common Paper template files (templates/*.md) into a
 * renderer-agnostic Block[] plus the list of "variables" the document
 * references — terms like `<span class="coverpage_link">Customer</span>`
 * that a cover page / order form / key terms doc would normally define, but
 * which this dataset never included for anything but the Mutual NDA. Every
 * distinct variable found becomes a field the chat asks the user to fill in.
 *
 * Deliberately NOT a general Markdown parser: these templates use a specific,
 * consistent convention (one clause per physical line, 4 spaces of
 * indentation per nesting level, digits at the first two levels and letters
 * at the third) that a CommonMark-compliant parser actually renders
 * ambiguously here, since a numbered section header is immediately followed
 * by its first numbered sub-clause with no blank line in between.
 */

const HEADING_PATTERN = /^(#{1,3})\s+(.*)$/;
const CLAUSE_PATTERN = /^( *)(\d+\.|[a-z]\.)\s+(.*)$/;
const SPAN_PATTERN = /<span([^>]*)>(.*?)<\/span>/g;
const SPAN_CLASS_PATTERN = /class="([a-z0-9_]+)"/;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\([^)]+\)/g;

function stripMarkdownLinks(text: string): string {
  return text.replace(MARKDOWN_LINK_PATTERN, "$1");
}

function stripBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "$1");
}

/** The field key a variable's display name maps to, e.g. "Subscription
 * Period" -> "subscription_period". Mirrors backend/app/generic_documents.py's
 * `slugify` exactly — both sides must agree on the same key for a given name. */
export function slugifyVariableName(name: string): string {
  return name
    .replace(/[’']s$/i, "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function canonicalVariableName(rawTerm: string): string {
  return rawTerm.replace(/[’']s$/i, "").trim();
}

function parseInline(text: string, variables: Set<string>): Inline[] {
  const cleaned = stripBold(stripMarkdownLinks(text));
  const segments: Inline[] = [];
  let lastIndex = 0;

  for (const match of cleaned.matchAll(SPAN_PATTERN)) {
    const [fullMatch, attributes, innerText] = match;
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push(cleaned.slice(lastIndex, index));
    }
    const spanClass = attributes.match(SPAN_CLASS_PATTERN)?.[1] ?? "";
    if (spanClass.endsWith("_link")) {
      segments.push({ term: innerText });
      variables.add(canonicalVariableName(innerText));
    } else {
      segments.push(innerText);
    }
    lastIndex = index + fullMatch.length;
  }
  if (lastIndex < cleaned.length) {
    segments.push(cleaned.slice(lastIndex));
  }
  return segments.length > 0 ? segments : [cleaned];
}

function formatClauseLabel(path: string[]): string {
  const numeric = path.filter((p) => /^\d+$/.test(p));
  const letters = path.filter((p) => !/^\d+$/.test(p));
  return numeric.join(".") + letters.map((l) => `(${l})`).join("");
}

export type ParsedTemplate = {
  blocks: Block[];
  variables: string[];
};

export function parseDocumentTemplate(markdown: string): ParsedTemplate {
  const blocks: Block[] = [];
  const variables = new Set<string>();
  const path: string[] = [];

  for (const rawLine of markdown.replace(/\r\n/g, "\n").split("\n")) {
    if (!rawLine.trim()) continue;

    const heading = rawLine.match(HEADING_PATTERN);
    if (heading) {
      const depth = heading[1].length as 1 | 2 | 3;
      const text = stripBold(stripMarkdownLinks(heading[2].trim()));
      blocks.push({ type: depth === 1 ? "h1" : depth === 2 ? "h2" : "h3", text });
      continue;
    }

    const clause = rawLine.match(CLAUSE_PATTERN);
    if (clause) {
      const [, indent, marker, text] = clause;
      const depth = Math.floor(indent.length / 4);
      path[depth] = marker.replace(/\.$/, "");
      path.length = depth + 1;
      blocks.push({
        type: "clause",
        label: formatClauseLabel(path),
        text: parseInline(text.trim(), variables),
      });
      continue;
    }

    blocks.push({ type: "p", text: parseInline(rawLine.trim(), variables) });
  }

  return { blocks, variables: Array.from(variables) };
}
