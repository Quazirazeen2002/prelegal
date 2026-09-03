import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import NdaPreview from "./NdaPreview";
import { buildNdaDocumentBlocks } from "@/lib/nda-content";
import { createDefaultNdaFormData, NdaFormData } from "@/lib/nda";

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
    ...overrides,
  };
}

describe("NdaPreview", () => {
  it("renders the document title and Standard Terms heading", () => {
    render(<NdaPreview blocks={buildNdaDocumentBlocks(sampleData())} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Mutual Non-Disclosure Agreement" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Standard Terms" })).toBeInTheDocument();
  });

  it("shows the filled-in purpose and effective date as plain field values", () => {
    render(<NdaPreview blocks={buildNdaDocumentBlocks(sampleData())} />);

    expect(
      screen.getByText(/Evaluating whether to enter into a business relationship/)
    ).toBeInTheDocument();
    expect(screen.getByText("September 3, 2026")).toBeInTheDocument();
  });

  it("shows the filled-in governing law and jurisdiction, each with its label", () => {
    const { container } = render(<NdaPreview blocks={buildNdaDocumentBlocks(sampleData())} />);
    const text = container.textContent ?? "";

    expect(text).toMatch(/Governing Law:\s*Delaware/);
    expect(text).toMatch(/Jurisdiction:\s*New Castle, DE/);
  });

  it("marks the checked MNDA term option and leaves the other unchecked", () => {
    const { container } = render(
      <NdaPreview
        blocks={buildNdaDocumentBlocks(sampleData({ mndaTermType: "expires", mndaTermYears: 2 }))}
      />
    );

    const items = Array.from(container.querySelectorAll("li")).map(
      (li) => li.textContent?.replace(/\s+/g, " ").trim()
    );
    expect(items).toContain("☒Expires 2 year(s) from Effective Date.");
    expect(items).toContain(
      "☐Continues until terminated in accordance with the terms of the MNDA."
    );
  });

  it("flips which option is checked when the confidentiality term type changes", () => {
    const { container } = render(
      <NdaPreview blocks={buildNdaDocumentBlocks(sampleData({ confidentialityTermType: "perpetual" }))} />
    );

    const items = Array.from(container.querySelectorAll("li")).map(
      (li) => li.textContent?.replace(/\s+/g, " ").trim()
    );
    expect(items).toContain("☒In perpetuity.");
  });

  it("renders an em-dash for blank signature-table fields and the entered value otherwise", () => {
    render(<NdaPreview blocks={buildNdaDocumentBlocks(sampleData())} />);

    // Party 1's print name is filled in, Party 2's is left blank.
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("underlines Standard Terms cross-references to cover page fields", () => {
    render(<NdaPreview blocks={buildNdaDocumentBlocks(sampleData())} />);

    const purposeRefs = screen.getAllByText("Purpose", { selector: "span.underline" });
    expect(purposeRefs.length).toBeGreaterThan(0);
  });

  it("numbers the Standard Terms clauses 1 through 11", () => {
    render(<NdaPreview blocks={buildNdaDocumentBlocks(sampleData())} />);

    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByText("11.")).toBeInTheDocument();
  });

  it("renders exactly one divider between the cover page and the standard terms", () => {
    const { container } = render(<NdaPreview blocks={buildNdaDocumentBlocks(sampleData())} />);
    expect(container.querySelectorAll("hr")).toHaveLength(1);
  });
});
