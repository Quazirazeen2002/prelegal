"use client";

/** Small, dependency-free infographic building blocks shared by the analysis
 * views (Summary, Risk Highlights). Status colors reuse the app's fixed
 * brand tokens (del/brand-yellow/brand-blue) rather than a generated
 * palette, and every color-coded element carries a text label alongside it
 * — never color alone. */

export type SeverityCounts = { high: number; medium: number; low: number };

export function countBySeverity(risks: { severity: keyof SeverityCounts }[] | null | undefined): SeverityCounts {
  const counts: SeverityCounts = { high: 0, medium: 0, low: 0 };
  for (const risk of risks ?? []) {
    counts[risk.severity] += 1;
  }
  return counts;
}

const SEVERITY_ORDER: (keyof SeverityCounts)[] = ["high", "medium", "low"];

const SEVERITY_LABEL: Record<keyof SeverityCounts, string> = {
  high: "High risk",
  medium: "Medium risk",
  low: "Low risk",
};

const SEVERITY_BAR_COLOR: Record<keyof SeverityCounts, string> = {
  high: "bg-del",
  medium: "bg-brand-yellow",
  low: "bg-brand-blue",
};

/** KPI-row stat tile: label (sentence case) + a compact value, optionally
 * with a one-line hint underneath. */
export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-sm border border-paper-border bg-paper px-4 py-3.5 shadow-[0_20px_40px_-24px_rgba(1,10,24,0.5)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-paper-ink-muted">{label}</p>
      <p
        className="mt-1 line-clamp-2 font-sans text-xl font-semibold leading-snug text-paper-ink"
        title={value}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 truncate text-xs text-paper-ink-muted" title={hint}>{hint}</p>}
    </div>
  );
}

/** Part-to-whole infographic for risk severity: a single horizontal stacked
 * bar (<=24px thick, 2px surface gaps between segments, rounded outer ends)
 * with counts carried by the legend below rather than crammed into the
 * segments themselves. */
export function RiskSeverityBar({ counts }: { counts: SeverityCounts }) {
  const total = counts.high + counts.medium + counts.low;
  if (total === 0) return null;

  const present = SEVERITY_ORDER.filter((key) => counts[key] > 0);

  return (
    <div>
      <div className="flex h-6 gap-[2px]">
        {present.map((key, i) => (
          <div
            key={key}
            title={`${SEVERITY_LABEL[key]}: ${counts[key]} of ${total}`}
            style={{ width: `${(counts[key] / total) * 100}%` }}
            className={`${SEVERITY_BAR_COLOR[key]} ${i === 0 ? "rounded-l" : ""} ${
              i === present.length - 1 ? "rounded-r" : ""
            }`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {SEVERITY_ORDER.map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <span className={`h-2 w-2 shrink-0 rounded-full ${SEVERITY_BAR_COLOR[key]}`} aria-hidden="true" />
            <span className="font-medium text-paper-ink">{SEVERITY_LABEL[key]}</span>
            <span className="text-paper-ink-muted">{counts[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const SEVERITY_RANK: Record<keyof SeverityCounts, number> = { low: 1, medium: 2, high: 3 };

/** Per-card severity gauge: three dots, filled up to the risk's rank, so a
 * reader can compare risks at a glance without re-reading every badge. */
export function SeverityGauge({ severity }: { severity: keyof SeverityCounts }) {
  const rank = SEVERITY_RANK[severity];
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          className={`h-1.5 w-1.5 rounded-full ${step <= rank ? SEVERITY_BAR_COLOR[severity] : "bg-paper-overlay"}`}
        />
      ))}
    </div>
  );
}
