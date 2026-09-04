"use client";

import AnalysisStateGate from "./AnalysisStateGate";
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
      {(doc) => (
        <div className="max-w-3xl space-y-3">
          {doc.risks && doc.risks.length === 0 && (
            <p className="text-sm text-canvas-ink-muted">No notable risks were identified in this document.</p>
          )}
          {doc.risks?.map((risk, i) => (
            <div
              key={i}
              className={`rounded-sm border border-paper-border bg-paper p-5 shadow-[0_30px_60px_-28px_rgba(1,10,24,0.55)] ${CARD_ACCENT[risk.severity]}`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="font-serif text-sm font-semibold text-paper-ink">{risk.title}</h3>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${SEVERITY_STYLES[risk.severity]}`}
                >
                  {risk.severity}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-paper-ink-muted">{risk.description}</p>
              {risk.relatedClause && (
                <p className="mt-2 text-xs text-paper-ink-muted">Related: {risk.relatedClause}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </AnalysisStateGate>
  );
}
