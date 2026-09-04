// @vitest-environment node
import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFParse } from "pdf-parse";
import NdaPdfDocument from "@/components/NdaPdfDocument";
import { parseDocumentTemplate } from "./document-template";

const TEMPLATES_DIR = path.resolve(__dirname, "../../templates");

async function renderTemplateToPdfText(filename: string) {
  const markdown = readFileSync(path.join(TEMPLATES_DIR, filename), "utf8");
  const { blocks } = parseDocumentTemplate(markdown);

  const buffer = await renderToBuffer(<NdaPdfDocument blocks={blocks} />);
  const parser = new PDFParse({ data: buffer });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}

describe("generic document PDF rendering (smoke test)", () => {
  it("renders csa.md's parsed blocks (2 levels of nested clauses) to a valid PDF", async () => {
    const text = await renderTemplateToPdfText("csa.md");

    expect(text).toContain("Cloud Service Agreement");
    expect(text).toMatch(/1\.1\./);
    expect(text).not.toMatch(/<span/);
  });

  it("renders psa.md's parsed blocks (3 levels, including lettered sub-clauses) to a valid PDF", async () => {
    const text = await renderTemplateToPdfText("psa.md");

    expect(text).toContain("Professional Services Agreement");
    expect(text).toMatch(/2\.4\(a\)/);
    expect(text).not.toMatch(/<span/);
  });
});
