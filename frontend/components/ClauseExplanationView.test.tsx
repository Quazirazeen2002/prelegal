import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ClauseExplanationView from "./ClauseExplanationView";
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

describe("ClauseExplanationView", () => {
  it("renders each clause with its plain-English explanation", () => {
    render(
      <ClauseExplanationView
        upload={sampleUpload({
          clauses: [{ clauseTitle: "Term", plainEnglish: "How long this lasts." }],
        })}
      />
    );
    expect(screen.getByText("Term")).toBeInTheDocument();
    expect(screen.getByText("How long this lasts.")).toBeInTheDocument();
  });

  it("numbers each clause node in a flow, in document order", () => {
    render(
      <ClauseExplanationView
        upload={sampleUpload({
          clauses: [
            { clauseTitle: "Term", plainEnglish: "How long this lasts." },
            { clauseTitle: "Termination", plainEnglish: "How either party can end it." },
          ],
        })}
      />
    );
    expect(screen.getByText("2 clauses walked through, in document order")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
