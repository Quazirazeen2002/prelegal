"use client";

import AnalysisStateGate from "./AnalysisStateGate";
import { UploadedDocumentDetail } from "@/lib/uploads";

export default function ComparisonView({ upload }: { upload: UploadedDocumentDetail | null }) {
  return (
    <AnalysisStateGate upload={upload}>
      {(doc) => {
        if (!doc.comparison) {
          return (
            <p className="max-w-3xl text-sm text-ink-muted">
              We couldn&apos;t confidently match this document to one of our standard templates, so
              there&apos;s no comparison to show.
            </p>
          );
        }

        return (
          <div className="max-w-3xl space-y-3">
            <p className="text-sm text-ink-muted">
              Compared against our standard{" "}
              <span className="font-semibold text-ink">{doc.comparison.matchedCatalogName}</span> terms.
            </p>
            {doc.comparison.deviations.length === 0 && (
              <p className="text-sm text-ink-muted">
                No material deviations from our standard terms were found.
              </p>
            )}
            {doc.comparison.deviations.map((deviation, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-surface p-5 shadow-xl shadow-black/20"
              >
                <h3 className="mb-3 text-sm font-semibold text-ink">{deviation.topic}</h3>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Our standard term
                    </dt>
                    <dd className="text-ink-muted">{deviation.standardTerm}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      This document
                    </dt>
                    <dd className="text-ink-muted">{deviation.uploadedDocumentTerm}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-brand-green">
                      Assessment
                    </dt>
                    <dd className="text-ink">{deviation.assessment}</dd>
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
