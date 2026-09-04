"use client";

import dynamic from "next/dynamic";
import AnalysisStateGate from "./AnalysisStateGate";
import { UploadedDocumentDetail } from "@/lib/uploads";

const AnalysisReportDownloadButton = dynamic(() => import("./AnalysisReportDownloadButton"), {
  ssr: false,
  loading: () => (
    <span className="inline-flex items-center justify-center rounded-full bg-paper-overlay px-5 py-2.5 text-sm font-medium text-paper-ink-muted">
      Loading…
    </span>
  ),
});

export default function ExportReportView({ upload }: { upload: UploadedDocumentDetail | null }) {
  return (
    <AnalysisStateGate upload={upload}>
      {(doc) => (
        <div className="max-w-xl rounded-sm border border-paper-border bg-paper p-7 shadow-[0_30px_60px_-28px_rgba(1,10,24,0.55)]">
          <h2 className="mb-2 font-serif text-sm font-semibold text-paper-ink">{doc.filename}</h2>
          <p className="mb-6 text-sm text-paper-ink-muted">
            Download a PDF report combining the summary, risk highlights, clause explanations, and
            standard-terms comparison for this document.
          </p>
          <AnalysisReportDownloadButton upload={doc} />
        </div>
      )}
    </AnalysisStateGate>
  );
}
