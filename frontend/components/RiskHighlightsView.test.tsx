import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import RiskHighlightsView from "./RiskHighlightsView";
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

describe("RiskHighlightsView", () => {
  it("shows a no-risks message when the risk list is empty", () => {
    render(<RiskHighlightsView upload={sampleUpload({ risks: [] })} />);
    expect(screen.getByText(/No notable risks/)).toBeInTheDocument();
  });

  it("renders each risk with its severity badge", () => {
    render(
      <RiskHighlightsView
        upload={sampleUpload({
          risks: [
            {
              title: "Uncapped liability",
              description: "No cap on damages.",
              severity: "high",
              relatedClause: "Section 8",
            },
          ],
        })}
      />
    );
    expect(screen.getByText("Uncapped liability")).toBeInTheDocument();
    expect(screen.getByText("No cap on damages.")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText(/Section 8/)).toBeInTheDocument();
  });
});
