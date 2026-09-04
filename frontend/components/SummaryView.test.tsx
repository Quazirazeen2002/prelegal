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

  it("renders a stat tile row and no risk-composition chart when there are no risks", () => {
    render(
      <SummaryView
        upload={sampleUpload({
          summary: "Summary text.",
          matchedCatalogName: "Cloud Service Agreement",
          risks: [],
          clauses: [{ clauseTitle: "Term", plainEnglish: "How long this lasts." }],
        })}
      />
    );
    expect(screen.getByText("Cloud Service Agreement")).toBeInTheDocument();
    expect(screen.getByText("Risks found")).toBeInTheDocument();
    expect(screen.getByText("Clauses reviewed")).toBeInTheDocument();
    expect(screen.queryByText("Risk composition")).not.toBeInTheDocument();
  });

  it("renders the risk-composition chart when risks are present", () => {
    render(
      <SummaryView
        upload={sampleUpload({
          summary: "Summary text.",
          risks: [
            { title: "Uncapped liability", description: "No cap.", severity: "high", relatedClause: null },
          ],
        })}
      />
    );
    expect(screen.getByText("Risk composition")).toBeInTheDocument();
  });
});
