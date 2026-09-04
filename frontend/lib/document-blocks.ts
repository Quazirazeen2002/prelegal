import { PartyInfo } from "./nda";

/**
 * Structured, renderer-agnostic representation of a document so the on-screen
 * HTML preview and the downloadable PDF render identical legal text from a
 * single source instead of duplicating it per-renderer. Shared by the
 * hand-crafted Mutual NDA content (lib/nda-content.ts) and the generic,
 * template-driven renderer for every other document type
 * (lib/document-template.ts).
 */

export type Inline = string | { term: string };

export type Block =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: Inline[] }
  | { type: "label"; text: string }
  | { type: "olItem"; number: number; text: Inline[] }
  | { type: "clause"; label: string; text: Inline[] }
  | { type: "checklist"; items: { checked: boolean; text: string }[] }
  | { type: "fieldValue"; label: string; value: string }
  | { type: "signatureTable"; party1: PartyInfo; party2: PartyInfo }
  | { type: "divider" }
  | { type: "footnote"; text: string };
