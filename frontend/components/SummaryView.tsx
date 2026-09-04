"use client";

import AnalysisStateGate from "./AnalysisStateGate";
import { UploadedDocumentDetail } from "@/lib/uploads";

export default function SummaryView({ upload }: { upload: UploadedDocumentDetail | null }) {
  return (
    <AnalysisStateGate upload={upload}>
      {(doc) => (
        <div className="max-w-3xl rounded-2xl border border-border bg-surface p-7 shadow-xl shadow-black/20">
          <h2 className="mb-4 text-sm font-semibold text-ink-muted">{doc.filename}</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{doc.summary}</div>
        </div>
      )}
    </AnalysisStateGate>
  );
}
