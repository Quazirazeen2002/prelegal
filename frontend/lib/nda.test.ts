import { describe, expect, it } from "vitest";
import { createDefaultNdaFormData, formatEffectiveDate, orPlaceholder } from "./nda";

describe("createDefaultNdaFormData", () => {
  it("returns sensible defaults", () => {
    const data = createDefaultNdaFormData();

    expect(data.purpose).toBe("");
    expect(data.mndaTermType).toBe("expires");
    expect(data.mndaTermYears).toBe(1);
    expect(data.confidentialityTermType).toBe("term");
    expect(data.confidentialityTermYears).toBe(1);
    expect(data.governingLaw).toBe("");
    expect(data.jurisdiction).toBe("");
    expect(data.modifications).toBe("");
    expect(data.party1).toEqual({
      company: "",
      printName: "",
      title: "",
      noticeAddress: "",
    });
    expect(data.party2).toEqual(data.party1);
  });

  it("defaults the effective date to today, as an ISO date", () => {
    const data = createDefaultNdaFormData();
    expect(data.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("gives each call, and each party within a call, independent objects", () => {
    const a = createDefaultNdaFormData();
    const b = createDefaultNdaFormData();

    a.party1.company = "Acme, Inc.";
    expect(b.party1.company).toBe("");
    expect(a.party2.company).toBe("");
    expect(a.party1).not.toBe(a.party2);
  });
});

describe("orPlaceholder", () => {
  it("returns the trimmed value when non-empty", () => {
    expect(orPlaceholder("  Delaware  ", "[Fill in state]")).toBe("Delaware");
  });

  it("falls back to the placeholder for an empty string", () => {
    expect(orPlaceholder("", "[Fill in state]")).toBe("[Fill in state]");
  });

  it("falls back to the placeholder for a whitespace-only string", () => {
    expect(orPlaceholder("   ", "[Fill in state]")).toBe("[Fill in state]");
  });
});

describe("formatEffectiveDate", () => {
  it("formats an ISO date as a long-form US date", () => {
    expect(formatEffectiveDate("2026-09-03")).toBe("September 3, 2026");
  });

  it("does not shift the date across a UTC day boundary", () => {
    // A naive `new Date("2026-01-01")` parses as UTC midnight, which renders
    // as December 31 in any timezone behind UTC. Regression guard for that.
    expect(formatEffectiveDate("2026-01-01")).toBe("January 1, 2026");
    expect(formatEffectiveDate("2026-12-31")).toBe("December 31, 2026");
  });

  it("falls back to a placeholder for an empty string", () => {
    expect(formatEffectiveDate("")).toBe("[Today's date]");
  });

  it("falls back to a placeholder for an unparseable date", () => {
    expect(formatEffectiveDate("not-a-date")).toBe("[Today's date]");
  });
});
