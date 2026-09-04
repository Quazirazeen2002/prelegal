"use client";

import AnalysisStateGate from "./AnalysisStateGate";
import { UploadedDocumentDetail } from "@/lib/uploads";

export default function ClauseExplanationView({ upload }: { upload: UploadedDocumentDetail | null }) {
  return (
    <AnalysisStateGate upload={upload}>
      {(doc) => (
        <div className="max-w-3xl space-y-3">
          {doc.clauses?.map((clause, i) => (
            <div
              key={i}
              className="rounded-sm border border-paper-border bg-paper p-5 shadow-[0_30px_60px_-28px_rgba(1,10,24,0.55)]"
            >
              <h3 className="mb-1.5 font-serif text-sm font-semibold text-paper-ink">{clause.clauseTitle}</h3>
              <p className="text-sm leading-relaxed text-paper-ink-muted">{clause.plainEnglish}</p>
            </div>
          ))}
        </div>
      )}
    </AnalysisStateGate>
  );
}
