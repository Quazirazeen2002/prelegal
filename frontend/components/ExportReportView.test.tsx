import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ExportReportView from "./ExportReportView";
import { UploadedDocumentDetail } from "@/lib/uploads";

// AnalysisReportDownloadButton pulls in @react-pdf/renderer's PDFDownloadLink, which
// relies on browser-only APIs jsdom doesn't implement — covered on its own merits
// elsewhere (NdaPdfDocument.test.tsx-style PDF-content tests aren't needed here since
// AnalysisReportPdfDocument reuses the same @react-pdf/renderer primitives already
// exercised there); here we only need to confirm ExportReportView wires the upload in.
vi.mock("./AnalysisReportDownloadButton", () => ({
  default: () => <button>Download PDF (mock)</button>,
}));

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

describe("ExportReportView", () => {
  it("shows the empty state when no document is selected", () => {
    render(<ExportReportView upload={null} />);
    expect(screen.getByText(/Upload a document first/)).toBeInTheDocument();
  });

  it("renders the download button for a processed document", async () => {
    render(<ExportReportView upload={sampleUpload()} />);
    expect(screen.getByText("agreement.pdf")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Download PDF (mock)" })).toBeInTheDocument();
  });
});
