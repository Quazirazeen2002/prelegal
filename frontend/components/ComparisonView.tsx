"use client";

import AnalysisStateGate from "./AnalysisStateGate";
import { UploadedDocumentDetail } from "@/lib/uploads";

export default function ComparisonView({ upload }: { upload: UploadedDocumentDetail | null }) {
  return (
    <AnalysisStateGate upload={upload}>
      {(doc) => {
        if (!doc.comparison) {
          return (
            <p className="max-w-3xl text-sm text-canvas-ink-muted">
              We couldn&apos;t confidently match this document to one of our standard templates, so
              there&apos;s no comparison to show.
            </p>
          );
        }

        return (
          <div className="max-w-3xl space-y-3">
            <p className="text-sm text-canvas-ink-muted">
              Compared against our standard{" "}
              <span className="font-semibold text-canvas-ink">{doc.comparison.matchedCatalogName}</span> terms.
            </p>
            {doc.comparison.deviations.length === 0 && (
              <p className="text-sm text-canvas-ink-muted">
                No material deviations from our standard terms were found.
              </p>
            )}
            {doc.comparison.deviations.map((deviation, i) => (
              <div
                key={i}
                className="rounded-sm border border-paper-border bg-paper p-5 shadow-[0_30px_60px_-28px_rgba(1,10,24,0.55)]"
              >
                <h3 className="mb-3 font-serif text-sm font-semibold text-paper-ink">{deviation.topic}</h3>
                <dl className="space-y-2.5 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-paper-ink-muted">
                      Our standard term
                    </dt>
                    <dd className="text-paper-ink-muted">{deviation.standardTerm}</dd>
                  </div>
                  <div className="-mx-1 rounded-r-sm border-l-2 border-del bg-del/5 px-3 py-1.5">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-del">
                      This document
                    </dt>
                    <dd className="text-paper-ink">{deviation.uploadedDocumentTerm}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ins">
                      Assessment
                    </dt>
                    <dd className="text-paper-ink">{deviation.assessment}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        );
      }}
    </AnalysisStateGate>
  );
}
