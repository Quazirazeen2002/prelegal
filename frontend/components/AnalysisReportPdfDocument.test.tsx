// @vitest-environment node
import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFParse } from "pdf-parse";
import AnalysisReportPdfDocument from "./AnalysisReportPdfDocument";
import { UploadedDocumentDetail } from "@/lib/uploads";

// See NdaPdfDocument.test.tsx's note: @vitest-environment node is required here too,
// for the same reason (renderToBuffer needs Node's Buffer/stream APIs).

function sampleUpload(overrides: Partial<UploadedDocumentDetail> = {}): UploadedDocumentDetail {
  return {
    id: 1,
    filename: "agreement.pdf",
    fileType: "pdf",
    fileSizeBytes: 1024,
    status: "processed",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    errorMessage: null,
    matchedCatalogKey: null,
    matchedCatalogName: null,
    summary: null,
    risks: null,
    clauses: null,
    comparison: null,
    ...overrides,
  };
}

async function generatePdfText(upload: UploadedDocumentDetail) {
  const buffer = await renderToBuffer(<AnalysisReportPdfDocument upload={upload} />);
  const parser = new PDFParse({ data: buffer });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}

describe("AnalysisReportPdfDocument", () => {
  it("renders the filename, summary, risks, clauses, and comparison into real PDF text", async () => {
    const text = await generatePdfText(
      sampleUpload({
        filename: "cloud-agreement.pdf",
        summary: "This is a plain-English summary.",
        risks: [
          { title: "Uncapped liability", description: "No cap on damages.", severity: "high", relatedClause: "8" },
        ],
        clauses: [{ clauseTitle: "Term", plainEnglish: "How long this lasts." }],
        comparison: {
          matchedCatalogKey: "csa",
          matchedCatalogName: "Cloud Service Agreement",
          deviations: [
            {
              topic: "Liability cap",
              standardTerm: "Capped at fees paid.",
              uploadedDocumentTerm: "No cap mentioned.",
              assessment: "Riskier than our standard terms.",
            },
          ],
        },
      })
    );

    expect(text).toContain("cloud-agreement.pdf");
    expect(text).toContain("This is a plain-English summary.");
    expect(text).toContain("Uncapped liability");
    expect(text).toContain("Term");
    expect(text).toContain("How long this lasts.");
    expect(text).toContain("Cloud Service Agreement");
    expect(text).toContain("Liability cap");
  });

  it("renders cleanly when there is no risk/clause/comparison data yet", async () => {
    const text = await generatePdfText(sampleUpload({ summary: "Just a summary." }));
    expect(text).toContain("Just a summary.");
  });
});
