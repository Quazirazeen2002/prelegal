import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AnalysisStateGate from "./AnalysisStateGate";
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

describe("AnalysisStateGate", () => {
  it("shows a prompt to upload when no document is selected", () => {
    render(<AnalysisStateGate upload={null}>{() => <p>content</p>}</AnalysisStateGate>);
    expect(screen.getByText(/Upload a document first/)).toBeInTheDocument();
    expect(screen.queryByText("content")).not.toBeInTheDocument();
  });

  it("shows a processing state for a document still being analyzed", () => {
    render(
      <AnalysisStateGate upload={sampleUpload({ status: "processing" })}>
        {() => <p>content</p>}
      </AnalysisStateGate>
    );
    expect(screen.getByText(/Analyzing.*agreement\.pdf/)).toBeInTheDocument();
  });

  it("shows the error message for a document that failed analysis", () => {
    render(
      <AnalysisStateGate
        upload={sampleUpload({ status: "error", errorMessage: "Analysis failed. Please try again." })}
      >
        {() => <p>content</p>}
      </AnalysisStateGate>
    );
    expect(screen.getByText("Analysis failed. Please try again.")).toBeInTheDocument();
  });

  it("renders the children with the upload once processed", () => {
    render(
      <AnalysisStateGate upload={sampleUpload({ status: "processed" })}>
        {(doc) => <p>{doc.filename}</p>}
      </AnalysisStateGate>
    );
    expect(screen.getByText("agreement.pdf")).toBeInTheDocument();
  });
});
