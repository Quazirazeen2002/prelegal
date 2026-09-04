import { readFileSync, readdirSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { parseDocumentTemplate, slugifyVariableName } from "./document-template";

const TEMPLATES_DIR = path.resolve(__dirname, "../../templates");

const GENERIC_TEMPLATE_FILES = readdirSync(TEMPLATES_DIR).filter(
  (f) => f.endsWith(".md") && f !== "mutual-nda.md" && f !== "mutual-nda-coverpage.md"
);

describe("parseDocumentTemplate against every real generic template", () => {
  it.each(GENERIC_TEMPLATE_FILES)("parses %s without error and finds variables", (filename) => {
    const markdown = readFileSync(path.join(TEMPLATES_DIR, filename), "utf8");
    const { blocks, variables } = parseDocumentTemplate(markdown);

    expect(blocks.length).toBeGreaterThan(5);
    expect(blocks[0]).toEqual({ type: "h1", text: expect.any(String) });
    expect(variables.length).toBeGreaterThan(0);

    // No raw HTML/markdown leaking into rendered text.
    const allText = blocks
      .flatMap((b) => ("text" in b ? b.text : []))
      .flatMap((t) => (typeof t === "string" ? [t] : [t.term]))
      .join(" ");
    expect(allText).not.toMatch(/<span/);
    expect(allText).not.toMatch(/\*\*/);

    // Variable names are clean (no stray possessive suffix, no HTML).
    for (const v of variables) {
      expect(v).not.toMatch(/['’]s$/);
      expect(v).not.toMatch(/[<>]/);
    }
  });

  it("produces distinct, non-empty slugs for csa.md's variables with no collisions", () => {
    const markdown = readFileSync(path.join(TEMPLATES_DIR, "csa.md"), "utf8");
    const { variables } = parseDocumentTemplate(markdown);

    const slugs = variables.map(slugifyVariableName);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug.length).toBeGreaterThan(0);
    }
  });

  it("builds hierarchical clause labels for a 3-level nested document (psa.md)", () => {
    const markdown = readFileSync(path.join(TEMPLATES_DIR, "psa.md"), "utf8");
    const { blocks } = parseDocumentTemplate(markdown);
    const labels = blocks.filter((b) => b.type === "clause").map((b) => (b as { label: string }).label);

    expect(labels).toContain("1");
    expect(labels).toContain("2.4");
    expect(labels.some((l) => /^2\.4\(a\)$/.test(l))).toBe(true);
  });

  it("keeps a term reference and its possessive form mapped to the same variable", () => {
    const markdown = readFileSync(path.join(TEMPLATES_DIR, "baa.md"), "utf8");
    const { variables } = parseDocumentTemplate(markdown);

    expect(variables).toContain("Provider");
    expect(variables).not.toContain("Provider's");
    expect(variables).not.toContain("Provider’s");
  });
});
