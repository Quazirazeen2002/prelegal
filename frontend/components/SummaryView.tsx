"use client";

import AnalysisStateGate from "./AnalysisStateGate";
import { UploadedDocumentDetail } from "@/lib/uploads";

export default function SummaryView({ upload }: { upload: UploadedDocumentDetail | null }) {
  return (
    <AnalysisStateGate upload={upload}>
      {(doc) => (
        <div className="max-w-3xl rounded-sm border border-paper-border bg-paper p-7 shadow-[0_30px_60px_-28px_rgba(1,10,24,0.55)]">
          <h2 className="mb-4 text-sm font-semibold text-paper-ink-muted">{doc.filename}</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-paper-ink">{doc.summary}</div>
        </div>
      )}
    </AnalysisStateGate>
  );
}
