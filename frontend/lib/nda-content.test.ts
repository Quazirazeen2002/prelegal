import { describe, expect, it } from "vitest";
import {
  Block,
  buildCoverPageBlocks,
  buildNdaDocumentBlocks,
  buildStandardTermsBlocks,
  Inline,
} from "./nda-content";
import { createDefaultNdaFormData, NdaFormData } from "./nda";

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

function flattenInline(text: Inline[]): string {
  return text.map((segment) => (typeof segment === "string" ? segment : segment.term)).join("");
}

function terms(text: Inline[]): string[] {
  return text.filter((s): s is { term: string } => typeof s !== "string").map((s) => s.term);
}

describe("buildCoverPageBlocks", () => {
  it("opens with the document title", () => {
    const blocks = buildCoverPageBlocks(sampleData());
    expect(blocks[0]).toEqual({ type: "h1", text: "Mutual Non-Disclosure Agreement" });
  });

  it("fills in the purpose, using a placeholder when blank", () => {
    const filled = buildCoverPageBlocks(sampleData({ purpose: "Evaluating a partnership." }));
    const filledIdx = filled.findIndex((b) => b.type === "h3" && b.text === "Purpose");
    expect(filled[filledIdx + 2]).toMatchObject({
      type: "fieldValue",
      value: "Evaluating a partnership.",
    });

    const blank = buildCoverPageBlocks(sampleData({ purpose: "   " }));
    const blankIdx = blank.findIndex((b) => b.type === "h3" && b.text === "Purpose");
    expect(blank[blankIdx + 2]).toMatchObject({
      type: "fieldValue",
      value: "[Purpose not specified]",
    });
  });

  it("formats the effective date", () => {
    const blocks = buildCoverPageBlocks(sampleData({ effectiveDate: "2026-09-03" }));
    const idx = blocks.findIndex((b) => b.type === "h3" && b.text === "Effective Date");
    expect(blocks[idx + 1]).toMatchObject({ type: "fieldValue", value: "September 3, 2026" });
  });

  describe("MNDA term checklist", () => {
    it("checks 'expires' with the chosen year count when that option is selected", () => {
      const blocks = buildCoverPageBlocks(
        sampleData({ mndaTermType: "expires", mndaTermYears: 3 })
      );
      const checklist = blocks.find(
        (b, i) => b.type === "checklist" && blocks[i - 2]?.type === "h3" && (blocks[i - 2] as { text: string }).text === "MNDA Term"
      );
      expect(checklist).toMatchObject({
        type: "checklist",
        items: [
          { checked: true, text: "Expires 3 year(s) from Effective Date." },
          {
            checked: false,
            text: "Continues until terminated in accordance with the terms of the MNDA.",
          },
        ],
      });
    });

    it("checks 'perpetual' when that option is selected", () => {
      const blocks = buildCoverPageBlocks(sampleData({ mndaTermType: "perpetual" }));
      const checklist = blocks.find(
        (b, i) => b.type === "checklist" && blocks[i - 2]?.type === "h3" && (blocks[i - 2] as { text: string }).text === "MNDA Term"
      );
      expect(checklist).toMatchObject({
        type: "checklist",
        items: [
          { checked: false },
          { checked: true, text: "Continues until terminated in accordance with the terms of the MNDA." },
        ],
      });
    });
  });

  describe("Term of Confidentiality checklist", () => {
    it("checks the fixed term with the chosen year count when selected", () => {
      const blocks = buildCoverPageBlocks(
        sampleData({ confidentialityTermType: "term", confidentialityTermYears: 5 })
      );
      const checklist = blocks.find(
        (b, i) => b.type === "checklist" && blocks[i - 2]?.type === "h3" && (blocks[i - 2] as { text: string }).text === "Term of Confidentiality"
      );
      expect(checklist).toMatchObject({
        type: "checklist",
        items: [
          {
            checked: true,
            text: "5 year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.",
          },
          { checked: false, text: "In perpetuity." },
        ],
      });
    });

    it("checks 'in perpetuity' when selected", () => {
      const blocks = buildCoverPageBlocks(sampleData({ confidentialityTermType: "perpetual" }));
      const checklist = blocks.find(
        (b, i) => b.type === "checklist" && blocks[i - 2]?.type === "h3" && (blocks[i - 2] as { text: string }).text === "Term of Confidentiality"
      );
      expect(checklist).toMatchObject({
        type: "checklist",
        items: [{ checked: false }, { checked: true, text: "In perpetuity." }],
      });
    });
  });

  it("falls back to placeholders for blank governing law and jurisdiction", () => {
    const blocks = buildCoverPageBlocks(sampleData({ governingLaw: "", jurisdiction: "" }));
    const governingLaw = blocks.find(
      (b): b is Extract<Block, { type: "fieldValue" }> =>
        b.type === "fieldValue" && b.label === "Governing Law"
    );
    const jurisdiction = blocks.find(
      (b): b is Extract<Block, { type: "fieldValue" }> =>
        b.type === "fieldValue" && b.label === "Jurisdiction"
    );
    expect(governingLaw?.value).toBe("[Fill in state]");
    expect(jurisdiction?.value).toMatch(/^\[Fill in city or county and state/);
  });

  it("uses filled-in governing law and jurisdiction values", () => {
    const blocks = buildCoverPageBlocks(
      sampleData({ governingLaw: "Delaware", jurisdiction: "New Castle, DE" })
    );
    const governingLaw = blocks.find(
      (b): b is Extract<Block, { type: "fieldValue" }> =>
        b.type === "fieldValue" && b.label === "Governing Law"
    );
    const jurisdiction = blocks.find(
      (b): b is Extract<Block, { type: "fieldValue" }> =>
        b.type === "fieldValue" && b.label === "Jurisdiction"
    );
    expect(governingLaw?.value).toBe("Delaware");
    expect(jurisdiction?.value).toBe("New Castle, DE");
  });

  it("defaults MNDA Modifications to 'None.' when blank", () => {
    const blocks = buildCoverPageBlocks(sampleData({ modifications: "" }));
    const idx = blocks.findIndex((b) => b.type === "h3" && b.text === "MNDA Modifications");
    expect(blocks[idx + 2]).toMatchObject({ type: "fieldValue", value: "None." });
  });

  it("shows the entered MNDA Modifications text when present", () => {
    const blocks = buildCoverPageBlocks(
      sampleData({ modifications: "Section 5 term extended to 2 years." })
    );
    const idx = blocks.findIndex((b) => b.type === "h3" && b.text === "MNDA Modifications");
    expect(blocks[idx + 2]).toMatchObject({
      type: "fieldValue",
      value: "Section 5 term extended to 2 years.",
    });
  });

  it("carries the two parties through to the signature table", () => {
    const data = sampleData();
    const blocks = buildCoverPageBlocks(data);
    const table = blocks.find((b) => b.type === "signatureTable");
    expect(table).toMatchObject({
      type: "signatureTable",
      party1: data.party1,
      party2: data.party2,
    });
  });

  it("ends with a footnote", () => {
    const blocks = buildCoverPageBlocks(sampleData());
    expect(blocks[blocks.length - 1].type).toBe("footnote");
  });
});

describe("buildStandardTermsBlocks", () => {
  const blocks = buildStandardTermsBlocks();

  it("opens with a 'Standard Terms' heading", () => {
    expect(blocks[0]).toEqual({ type: "h1", text: "Standard Terms" });
  });

  it("contains exactly 11 numbered clauses, in order, 1 through 11", () => {
    const olItems = blocks.filter((b): b is Extract<Block, { type: "olItem" }> => b.type === "olItem");
    expect(olItems).toHaveLength(11);
    expect(olItems.map((item) => item.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });

  it("is a pure function: repeated calls produce equivalent content", () => {
    expect(buildStandardTermsBlocks()).toEqual(blocks);
  });

  it("cross-references Purpose from clause 1 (Introduction) and clause 2 (Use and Protection)", () => {
    const olItems = blocks.filter((b): b is Extract<Block, { type: "olItem" }> => b.type === "olItem");
    expect(terms(olItems[0].text)).toEqual(["Purpose"]);
    expect(terms(olItems[1].text)).toEqual(["Purpose", "Purpose"]);
  });

  it("cross-references Effective Date, MNDA Term, and Term of Confidentiality from clause 5 (Term and Termination), in order", () => {
    const olItems = blocks.filter((b): b is Extract<Block, { type: "olItem" }> => b.type === "olItem");
    expect(terms(olItems[4].text)).toEqual([
      "Effective Date",
      "MNDA Term",
      "Term of Confidentiality",
    ]);
  });

  it("cross-references Governing Law and Jurisdiction (twice each) from clause 9", () => {
    const olItems = blocks.filter((b): b is Extract<Block, { type: "olItem" }> => b.type === "olItem");
    expect(terms(olItems[8].text)).toEqual([
      "Governing Law",
      "Governing Law",
      "Jurisdiction",
      "Jurisdiction",
    ]);
  });

  it("does not cross-reference any cover page term from clauses without one (e.g. clause 3, Exceptions)", () => {
    const olItems = blocks.filter((b): b is Extract<Block, { type: "olItem" }> => b.type === "olItem");
    expect(terms(olItems[2].text)).toEqual([]);
  });

  it("includes the disclaimer clause verbatim, in full capitals", () => {
    const olItems = blocks.filter((b): b is Extract<Block, { type: "olItem" }> => b.type === "olItem");
    const disclaimer = flattenInline(olItems[7].text);
    expect(disclaimer).toContain(
      'ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS", WITH ALL FAULTS, AND WITHOUT WARRANTIES'
    );
  });

  it("ends with a footnote", () => {
    expect(blocks[blocks.length - 1].type).toBe("footnote");
  });
});

describe("buildNdaDocumentBlocks", () => {
  it("concatenates the cover page and standard terms, separated by a single divider", () => {
    const data = sampleData();
    const blocks = buildNdaDocumentBlocks(data);
    const coverPage = buildCoverPageBlocks(data);
    const standardTerms = buildStandardTermsBlocks();

    expect(blocks).toHaveLength(coverPage.length + 1 + standardTerms.length);
    expect(blocks.slice(0, coverPage.length)).toEqual(coverPage);
    expect(blocks[coverPage.length]).toEqual({ type: "divider" });
    expect(blocks.slice(coverPage.length + 1)).toEqual(standardTerms);

    const dividers = blocks.filter((b) => b.type === "divider");
    expect(dividers).toHaveLength(1);
  });
});
