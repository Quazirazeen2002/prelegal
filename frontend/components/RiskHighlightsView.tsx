"use client";

import AnalysisStateGate from "./AnalysisStateGate";
import { RiskItem, UploadedDocumentDetail } from "@/lib/uploads";

const SEVERITY_STYLES: Record<RiskItem["severity"], string> = {
  high: "bg-red-500/15 text-red-300 border-red-500/30",
  medium: "bg-brand-yellow/15 text-brand-yellow border-brand-yellow/30",
  low: "bg-brand-blue/15 text-brand-blue border-brand-blue/30",
};

export default function RiskHighlightsView({ upload }: { upload: UploadedDocumentDetail | null }) {
  return (
    <AnalysisStateGate upload={upload}>
      {(doc) => (
        <div className="max-w-3xl space-y-3">
          {doc.risks && doc.risks.length === 0 && (
            <p className="text-sm text-ink-muted">No notable risks were identified in this document.</p>
          )}
          {doc.risks?.map((risk, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-surface p-5 shadow-xl shadow-black/20"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">{risk.title}</h3>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${SEVERITY_STYLES[risk.severity]}`}
                >
                  {risk.severity}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-ink-muted">{risk.description}</p>
              {risk.relatedClause && (
                <p className="mt-2 text-xs text-ink-muted">Related: {risk.relatedClause}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </AnalysisStateGate>
  );
}
