"use client";

import AnalysisStateGate from "./AnalysisStateGate";
import { UploadedDocumentDetail } from "@/lib/uploads";

export default function ClauseExplanationView({ upload }: { upload: UploadedDocumentDetail | null }) {
  return (
    <AnalysisStateGate upload={upload}>
      {(doc) => {
        const clauses = doc.clauses ?? [];

        return (
          <div className="max-w-3xl">
            {clauses.length > 0 && (
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-canvas-ink-muted">
                {clauses.length} {clauses.length === 1 ? "clause" : "clauses"} walked through, in document order
              </p>
            )}
            {clauses.map((clause, i) => {
              const isLast = i === clauses.length - 1;
              return (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-purple font-sans text-xs font-bold text-on-brand">
                      {i + 1}
                    </span>
                    {!isLast && <span aria-hidden="true" className="mt-1 w-px flex-1 bg-canvas-border-strong" />}
                  </div>
                  <div className={`flex-1 ${isLast ? "" : "pb-4"}`}>
                    <div className="rounded-sm border border-paper-border bg-paper p-5 shadow-[0_30px_60px_-28px_rgba(1,10,24,0.55)]">
                      <h3 className="mb-1.5 font-serif text-sm font-semibold text-paper-ink">
                        {clause.clauseTitle}
                      </h3>
                      <p className="text-sm leading-relaxed text-paper-ink-muted">{clause.plainEnglish}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }}
    </AnalysisStateGate>
  );
}
