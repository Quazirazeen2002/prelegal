"use client";

import { ReactNode } from "react";
import { UploadedDocumentDetail } from "@/lib/uploads";

type Props = {
  upload: UploadedDocumentDetail | null;
  children: (upload: UploadedDocumentDetail) => ReactNode;
};

/** Shared empty/processing/error handling for the analysis views (Summary,
 * Risk Highlights, Clause Explanation, Comparison) — each just renders its
 * own content once a fully-processed document is selected. */
export default function AnalysisStateGate({ upload, children }: Props) {
  if (!upload) {
    return (
      <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-canvas-border-strong bg-canvas-overlay-faint p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-purple/15 text-2xl">
          📄
        </span>
        <p className="text-sm text-canvas-ink-muted">
          Upload a document first, then come back here to see the analysis.
        </p>
      </div>
    );
  }

  if (upload.status === "processing") {
    return (
      <div className="flex min-h-[24rem] items-center justify-center rounded-md border border-dashed border-canvas-border-strong bg-canvas-overlay-faint p-8 text-sm text-canvas-ink-muted">
        Analyzing &ldquo;{upload.filename}&rdquo;…
      </div>
    );
  }

  if (upload.status === "error") {
    return (
      <div className="rounded-md border border-del/30 bg-del/10 p-6 text-sm text-red-300">
        {upload.errorMessage || "Something went wrong analyzing this document."}
      </div>
    );
  }

  return <>{children(upload)}</>;
}
