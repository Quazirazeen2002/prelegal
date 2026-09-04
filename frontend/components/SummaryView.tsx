"use client";

import AnalysisStateGate from "./AnalysisStateGate";
import { RiskSeverityBar, StatTile, countBySeverity } from "./AnalysisCharts";
import { UploadedDocumentDetail, formatFileSize } from "@/lib/uploads";

export default function SummaryView({ upload }: { upload: UploadedDocumentDetail | null }) {
  return (
    <AnalysisStateGate upload={upload}>
      {(doc) => {
        const riskCount = doc.risks?.length ?? 0;
        const clauseCount = doc.clauses?.length ?? 0;
        const severityCounts = countBySeverity(doc.risks);

        return (
          <div className="max-w-3xl space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile
                label="Matched template"
                value={doc.matchedCatalogName ?? "No match"}
                hint={doc.matchedCatalogName ? "Closest catalog type" : "No close catalog type"}
              />
              <StatTile label="Risks found" value={String(riskCount)} hint={riskCount > 0 ? "See Risk Highlights" : "None flagged"} />
              <StatTile label="Clauses reviewed" value={String(clauseCount)} hint="See Clause Explanation" />
              <StatTile label="File" value={doc.fileType.toUpperCase()} hint={formatFileSize(doc.fileSizeBytes)} />
            </div>

            {riskCount > 0 && (
              <div className="rounded-sm border border-paper-border bg-paper p-5 shadow-[0_30px_60px_-28px_rgba(1,10,24,0.55)]">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-paper-ink-muted">
                  Risk composition
                </h3>
                <RiskSeverityBar counts={severityCounts} />
              </div>
            )}

            <div className="rounded-sm border border-paper-border bg-paper p-7 shadow-[0_30px_60px_-28px_rgba(1,10,24,0.55)]">
              <h2 className="mb-4 text-sm font-semibold text-paper-ink-muted">{doc.filename}</h2>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-paper-ink">{doc.summary}</div>
            </div>
          </div>
        );
      }}
    </AnalysisStateGate>
  );
}
