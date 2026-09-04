import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import SummaryView from "./SummaryView";
import { UploadedDocumentDetail } from "@/lib/uploads";

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

describe("SummaryView", () => {
  it("shows the empty state when no document is selected", () => {
    render(<SummaryView upload={null} />);
    expect(screen.getByText(/Upload a document first/)).toBeInTheDocument();
  });

  it("renders the summary text for a processed document", () => {
    render(<SummaryView upload={sampleUpload({ summary: "This is a plain-English summary." })} />);
    expect(screen.getByText("This is a plain-English summary.")).toBeInTheDocument();
    expect(screen.getByText("agreement.pdf")).toBeInTheDocument();
  });
});
