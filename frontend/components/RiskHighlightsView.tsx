"use client";

import AnalysisStateGate from "./AnalysisStateGate";
import { RiskSeverityBar, SeverityGauge, countBySeverity } from "./AnalysisCharts";
import { RiskItem, UploadedDocumentDetail } from "@/lib/uploads";

const SEVERITY_STYLES: Record<RiskItem["severity"], string> = {
  high: "bg-del/10 text-del border-del/30",
  medium: "bg-brand-yellow/15 text-amber-700 border-brand-yellow/40",
  low: "bg-brand-blue/10 text-sky-700 border-brand-blue/30",
};

/** High-severity risks get the same margin-flag treatment as the landing
 * page's "Analyze a document" section — a struck-through accent bar calling
 * out the sentence, not just a badge. */
const CARD_ACCENT: Record<RiskItem["severity"], string> = {
  high: "border-l-2 border-l-del",
  medium: "",
  low: "",
};

export default function RiskHighlightsView({ upload }: { upload: UploadedDocumentDetail | null }) {
  return (
    <AnalysisStateGate upload={upload}>
      {(doc) => {
        const severityCounts = countBySeverity(doc.risks);
        const total = doc.risks?.length ?? 0;

        return (
          <div className="max-w-3xl space-y-5">
            {doc.risks && doc.risks.length === 0 && (
              <p className="text-sm text-canvas-ink-muted">No notable risks were identified in this document.</p>
            )}

            {total > 0 && (
              <div className="rounded-sm border border-paper-border bg-paper p-5 shadow-[0_30px_60px_-28px_rgba(1,10,24,0.55)]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-paper-ink-muted">
                    Risk composition
                  </h3>
                  <span className="text-xs text-paper-ink-muted">
                    {total} {total === 1 ? "risk" : "risks"} total
                  </span>
                </div>
                <RiskSeverityBar counts={severityCounts} />
              </div>
            )}

            <div className="space-y-3">
              {doc.risks?.map((risk, i) => (
                <div
                  key={i}
                  className={`rounded-sm border border-paper-border bg-paper p-5 shadow-[0_30px_60px_-28px_rgba(1,10,24,0.55)] ${CARD_ACCENT[risk.severity]}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="font-serif text-sm font-semibold text-paper-ink">{risk.title}</h3>
                    <div className="flex shrink-0 items-center gap-2">
                      <SeverityGauge severity={risk.severity} />
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${SEVERITY_STYLES[risk.severity]}`}
                      >
                        {risk.severity}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-paper-ink-muted">{risk.description}</p>
                  {risk.relatedClause && (
                    <p className="mt-2 text-xs text-paper-ink-muted">Related: {risk.relatedClause}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }}
    </AnalysisStateGate>
  );
}
