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
              className="rounded-2xl border border-white/10 bg-surface p-5 shadow-xl shadow-black/20"
            >
              <h3 className="mb-1.5 text-sm font-semibold text-ink">{clause.clauseTitle}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">{clause.plainEnglish}</p>
            </div>
          ))}
        </div>
      )}
    </AnalysisStateGate>
  );
}
