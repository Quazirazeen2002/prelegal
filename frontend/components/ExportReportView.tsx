"use client";

import dynamic from "next/dynamic";
import AnalysisStateGate from "./AnalysisStateGate";
import { UploadedDocumentDetail } from "@/lib/uploads";

const AnalysisReportDownloadButton = dynamic(() => import("./AnalysisReportDownloadButton"), {
  ssr: false,
  loading: () => (
    <span className="inline-flex items-center justify-center rounded-full bg-overlay px-5 py-2.5 text-sm font-medium text-ink-muted">
      Loading…
    </span>
  ),
});

export default function ExportReportView({ upload }: { upload: UploadedDocumentDetail | null }) {
  return (
    <AnalysisStateGate upload={upload}>
      {(doc) => (
        <div className="max-w-xl rounded-2xl border border-border bg-surface p-7 shadow-xl shadow-black/20">
          <h2 className="mb-2 text-sm font-semibold text-ink">{doc.filename}</h2>
          <p className="mb-6 text-sm text-ink-muted">
            Download a PDF report combining the summary, risk highlights, clause explanations, and
            standard-terms comparison for this document.
          </p>
          <AnalysisReportDownloadButton upload={doc} />
        </div>
      )}
    </AnalysisStateGate>
  );
}
