import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskSeverityBar, StatTile, countBySeverity } from "./AnalysisCharts";

describe("countBySeverity", () => {
  it("tallies each severity, defaulting missing ones to zero", () => {
    expect(
      countBySeverity([
        { severity: "high" },
        { severity: "high" },
        { severity: "low" },
      ])
    ).toEqual({ high: 2, medium: 0, low: 1 });
  });

  it("returns all zeros for null or undefined input", () => {
    expect(countBySeverity(null)).toEqual({ high: 0, medium: 0, low: 0 });
    expect(countBySeverity(undefined)).toEqual({ high: 0, medium: 0, low: 0 });
  });
});

describe("StatTile", () => {
  it("renders the label, value, and optional hint", () => {
    render(<StatTile label="Risks found" value="3" hint="See Risk Highlights" />);
    expect(screen.getByText("Risks found")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("See Risk Highlights")).toBeInTheDocument();
  });
});

describe("RiskSeverityBar", () => {
  it("renders nothing when there are no risks", () => {
    const { container } = render(<RiskSeverityBar counts={{ high: 0, medium: 0, low: 0 }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a legend entry with the count for every severity", () => {
    render(<RiskSeverityBar counts={{ high: 2, medium: 1, low: 0 }} />);
    expect(screen.getByText("High risk")).toBeInTheDocument();
    expect(screen.getByText("Medium risk")).toBeInTheDocument();
    expect(screen.getByText("Low risk")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
