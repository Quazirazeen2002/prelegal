import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ComparisonView from "./ComparisonView";
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

describe("ComparisonView", () => {
  it("shows a message when no catalog match was found", () => {
    render(<ComparisonView upload={sampleUpload({ comparison: null })} />);
    expect(screen.getByText(/couldn't confidently match/)).toBeInTheDocument();
  });

  it("renders deviations against the matched template", () => {
    render(
      <ComparisonView
        upload={sampleUpload({
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
        })}
      />
    );
    expect(screen.getByText(/Cloud Service Agreement/)).toBeInTheDocument();
    expect(screen.getByText("Liability cap")).toBeInTheDocument();
    expect(screen.getByText("Riskier than our standard terms.")).toBeInTheDocument();
  });
});
