// @vitest-environment node
import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFParse } from "pdf-parse";
import NdaPdfDocument from "./NdaPdfDocument";
import { buildNdaDocumentBlocks } from "@/lib/nda-content";
import { createDefaultNdaFormData, NdaFormData } from "@/lib/nda";

// The @vitest-environment override above is required, not stylistic: under jsdom,
// Vitest resolves @react-pdf/renderer's browser build (no Node Buffer/stream APIs),
// so `renderToBuffer` would be undefined there.

function sampleData(overrides: Partial<NdaFormData> = {}): NdaFormData {
  return {
    ...createDefaultNdaFormData(),
    effectiveDate: "2026-09-03",
    governingLaw: "Delaware",
    jurisdiction: "New Castle, DE",
    party1: {
      company: "Acme, Inc.",
      printName: "Jane Doe",
      title: "General Counsel",
      noticeAddress: "legal@acme.com",
    },
    party2: {
      company: "Widgets LLC",
      printName: "John Smith",
      title: "CEO",
      noticeAddress: "john@widgets.example",
    },
    ...overrides,
  };
}

async function generatePdfText(data: NdaFormData) {
  const buffer = await renderToBuffer(
    <NdaPdfDocument blocks={buildNdaDocumentBlocks(data)} />
  );
  const parser = new PDFParse({ data: buffer });
  try {
    return await parser.getText();
  } finally {
    await parser.destroy();
  }
}

describe("NdaPdfDocument", () => {
  it("generates a valid, multi-page PDF for a fully filled-in NDA", async () => {
    const result = await generatePdfText(sampleData());

    expect(result.total).toBeGreaterThan(1);
  }, 20000);

  it("includes the filled-in cover page values in the PDF text", async () => {
    const result = await generatePdfText(
      sampleData({ purpose: "Evaluating a supply agreement." })
    );

    expect(result.text).toContain("Mutual Non-Disclosure Agreement");
    expect(result.text).toContain("Evaluating a supply agreement.");
    expect(result.text).toContain("September 3, 2026");
    expect(result.text).toContain("Governing Law: Delaware");
    expect(result.text).toContain("Jurisdiction: New Castle, DE");
    expect(result.text).toContain("Jane Doe");
    expect(result.text).toContain("John Smith");
  }, 20000);

  it("includes the Standard Terms verbatim, including all 11 numbered clauses", async () => {
    const result = await generatePdfText(sampleData());

    expect(result.text).toContain("Standard Terms");
    expect(result.text).toContain("1. Introduction.");
    expect(result.text).toContain("11. General.");
    expect(result.text).toContain(
      'ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS"'
    );
  }, 20000);

  it("falls back to bracketed placeholders in the PDF when fields are left blank", async () => {
    const result = await generatePdfText(createDefaultNdaFormData());

    expect(result.text).toContain("[Fill in state]");
    expect(result.text).toContain("[Fill in city or county and state");
    expect(result.text).toContain("None.");
  }, 20000);

  it("does not throw and still paginates correctly for unusually long input", async () => {
    const longPurpose = "Evaluating a potential partnership. ".repeat(400);
    const shortResult = await generatePdfText(sampleData());
    const longResult = await generatePdfText(sampleData({ purpose: longPurpose }));

    // PDF text extraction line-wraps long paragraphs, inserting newlines the
    // source string doesn't have, so compare with whitespace normalized rather
    // than as a single contiguous substring.
    const normalized = longResult.text.replace(/\s+/g, " ");
    expect(normalized).toContain(
      "Evaluating a potential partnership. Evaluating a potential partnership."
    );
    expect(longResult.total).toBeGreaterThan(shortResult.total);
  }, 20000);
});
